// Builds sql/batches/finish-setup.sql: ONE statement that (1) re-applies sql 028–037 (every step is "if not exists"), (2) brings the two
// newest tables (test_rules, show_results) under the per-account rules if 038 missed them, and (3) loads the sample aviary into the
// hidden demo account. One statement, so an SQL editor that splits or half-runs long scripts can't leave it half done.
//   node scripts/gen-finish-setup.js      (run scripts/gen-demo-account.js first)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'sql');
const part1 = fs.readFileSync(path.join(root, 'batches', 'part1-028-to-037.sql'), 'utf8');
const body1 = part1.slice(part1.indexOf('-- ====')); // everything after the header
const demo = fs.readFileSync(path.join(root, '039_demo_data.sql'), 'utf8').replace(/^select set_config\((.*)\);$/gm, 'perform set_config($1);');
const ACC = "nullif(current_setting(''app.account_id'', true), '')";
function tenant(tbl, pk, unique) {
  return `
  if to_regclass('public.${tbl}') is not null and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = '${tbl}' and column_name = 'account_id') then
    alter table ${tbl} add column account_id text;
    alter table ${tbl} add column if not exists is_demo boolean not null default false;
    update ${tbl} set account_id = 'legacy';
    alter table ${tbl} alter column account_id set default nullif(current_setting('app.account_id', true), '');
    alter table ${tbl} alter column account_id set not null;
    alter table ${tbl} drop constraint if exists ${tbl}_pkey cascade;
    alter table ${tbl} add primary key (account_id, ${pk});
${unique ? `    alter table ${tbl} drop constraint if exists ${unique.old};\n    alter table ${tbl} add constraint ${unique.name} unique (account_id, ${unique.cols});\n` : ''}  end if;
  if to_regclass('public.${tbl}') is not null then
    alter table ${tbl} enable row level security;
    alter table ${tbl} force row level security;
    drop policy if exists tenant_isolation on ${tbl};
    create policy tenant_isolation on ${tbl} using (account_id = nullif(current_setting('app.account_id', true), '')) with check (account_id = nullif(current_setting('app.account_id', true), ''));
    drop policy if exists demo_read on ${tbl};
    create policy demo_read on ${tbl} for select using (account_id = 'demo' and current_setting('app.loading_demo', true) = 'on');
    grant select, insert, update, delete on ${tbl} to birdbox_app;
  end if;
`;
}
const base = `
-- tables from the first set-up steps that were never created here
create table if not exists health_records (
  id text primary key, bird_id text not null, type text not null, date date not null,
  provider text not null default '', notes text not null default '', attachments jsonb not null default '[]'
);
create index if not exists health_records_bird_idx on health_records (bird_id);
create table if not exists bird_transfers (
  id text primary key, bird_id text not null, contact_id text, direction text not null check (direction in ('Out', 'In')),
  method text not null, date date, notes text not null default '', created_at timestamptz not null default now()
);
create index if not exists bird_transfers_bird_idx on bird_transfers (bird_id);
`;
const out = `-- FINISH SET-UP — one statement. Paste ALL of this file into the Neon SQL editor and run it once (it can take a few seconds).
-- It catches up the database changes from 028–037 if any were missed, then loads the sample aviary. Safe to run again.
-- Afterwards run the check at the bottom of this file on its own.
do $finish$
begin
${base}
${body1}

-- the tables above follow the per-account rules too
${tenant('health_records', 'id')}
${tenant('bird_transfers', 'id')}
${tenant('test_rules', 'id', { old: 'test_rules_disease_key', name: 'test_rules_unique', cols: 'disease' })}
${tenant('show_results', 'id')}
-- the sample aviary
${demo}
end
$finish$;

-- Check (run on its own afterwards; all four numbers should be above zero):
-- select s.a, b.n as demo_birds, c.n as demo_cages, k.n as demo_contacts, r.n as show_results_has_account from (select set_config('app.account_id', 'demo', false) as a) s, lateral (select count(*) as n from birds where account_id = 'demo') b, lateral (select count(*) as n from cages where account_id = 'demo') c, lateral (select count(*) as n from contacts where account_id = 'demo') k, lateral (select count(*) as n from information_schema.columns where table_name = 'show_results' and column_name = 'account_id') r;
`;
fs.writeFileSync(path.join(root, 'batches', 'finish-setup.sql'), out);
console.log('wrote sql/batches/finish-setup.sql', out.split('\n').length, 'lines');

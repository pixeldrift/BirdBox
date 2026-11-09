-- Run once in the Neon SQL editor (after 037). User accounts: every record now belongs to an account (one per aviary), and the
-- database itself keeps each account's data apart with row-level security — a request can only ever see its own account's
-- rows, whatever the application code does. Everything you have today moves into an account called 'legacy' (yours); a
-- 'demo' account holds the sample aviary that new accounts get a copy of.
--
-- How it works: each API request connects as the low-privilege role birdbox_app and sets app.account_id for its transaction
-- (api/_lib/db.js). Tables get an account_id column that fills itself in from that setting, a primary key that includes it
-- (so two accounts can use the same ids), and a policy that hides every other account's rows.
-- New tables: end the file with   select bb_make_tenant('table_name', 'primary_key_column(s)');

create table if not exists accounts (
  id text primary key,
  name text not null default 'My Aviary',
  created_at timestamptz not null default now()
);
create table if not exists auth_links (          -- which login belongs to which account
  auth_id text primary key,
  account_id text not null,
  user_id text,
  email text not null default '',
  created_at timestamptz not null default now()
);
insert into accounts (id, name) values ('legacy', 'My Aviary'), ('demo', 'Demo Aviary') on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'birdbox_app') then create role birdbox_app nologin; end if;
end $$;
grant birdbox_app to current_user;
grant usage on schema public to birdbox_app;
grant select on species, species_names to birdbox_app;
grant usage on all sequences in schema public to birdbox_app;
alter default privileges in schema public grant usage on sequences to birdbox_app;

create or replace function bb_make_tenant(tbl text, pk_cols text) returns void language plpgsql as $f$
begin
  if to_regclass(tbl) is null then return; end if;
  execute format('alter table %I add column if not exists account_id text', tbl);
  execute format('alter table %I add column if not exists is_demo boolean not null default false', tbl);
  execute format('update %I set account_id = ''legacy'' where account_id is null', tbl);
  execute format('alter table %I alter column account_id set default nullif(current_setting(''app.account_id'', true), '''')', tbl);
  execute format('alter table %I alter column account_id set not null', tbl);
  execute format('alter table %I drop constraint if exists %I cascade', tbl, tbl || '_pkey');
  execute format('alter table %I add primary key (account_id, %s)', tbl, pk_cols);
  execute format('alter table %I enable row level security', tbl);
  execute format('alter table %I force row level security', tbl);
  execute format('drop policy if exists tenant_isolation on %I', tbl);
  execute format('create policy tenant_isolation on %I using (account_id = nullif(current_setting(''app.account_id'', true), '''')) with check (account_id = nullif(current_setting(''app.account_id'', true), ''''))', tbl);
  execute format('drop policy if exists demo_read on %I', tbl);
  execute format('create policy demo_read on %I for select using (account_id = ''demo'' and current_setting(''app.loading_demo'', true) = ''on'')', tbl);
  execute format('grant select, insert, update, delete on %I to birdbox_app', tbl);
end $f$;

select bb_make_tenant('birds', 'id');
select bb_make_tenant('contacts', 'id');
select bb_make_tenant('transactions', 'id');
select bb_make_tenant('health_records', 'id');
select bb_make_tenant('buildings', 'code');
select bb_make_tenant('waybills', 'id');
select bb_make_tenant('waybill_files', 'id');
select bb_make_tenant('media', 'id');
select bb_make_tenant('media_links', 'media_id, target_type, target_id');
select bb_make_tenant('bird_transfers', 'id');
select bb_make_tenant('locations', 'id');
select bb_make_tenant('cages', 'code');
select bb_make_tenant('rooms', 'id');
select bb_make_tenant('aviary', 'id');
select bb_make_tenant('users', 'id');
select bb_make_tenant('supplies', 'id');
select bb_make_tenant('care_items', 'id');
select bb_make_tenant('tasks', 'id');
select bb_make_tenant('task_done', 'id');
select bb_make_tenant('events', 'id');
select bb_make_tenant('event_links', 'id');
select bb_make_tenant('navigation', 'id');
select bb_make_tenant('test_rules', 'id');
select bb_make_tenant('show_results', 'id');

-- Links between tables now include the account too.
do $$ begin
  if to_regclass('waybill_files') is not null then
    alter table waybill_files drop constraint if exists waybill_files_waybill_fk;
    alter table waybill_files add constraint waybill_files_waybill_fk foreign key (account_id, waybill_id) references waybills (account_id, id) on delete cascade;
  end if;
  if to_regclass('media_links') is not null then
    alter table media_links drop constraint if exists media_links_media_fk;
    alter table media_links add constraint media_links_media_fk foreign key (account_id, media_id) references media (account_id, id) on delete cascade;
  end if;
end $$;

-- Rules that were "one per database" are now "one per account".
drop index if exists birds_band_unique;
create unique index if not exists birds_band_unique on birds (account_id, upper(regexp_replace(band, '[[:space:]]+', '', 'g'))) where band is not null;
alter table task_done drop constraint if exists task_done_task_id_on_date_sub_key_key;
alter table task_done drop constraint if exists task_done_unique;
alter table task_done add constraint task_done_unique unique (account_id, task_id, on_date, sub_key);
alter table event_links drop constraint if exists event_links_event_id_target_type_target_id_key;
alter table event_links drop constraint if exists event_links_unique;
alter table event_links add constraint event_links_unique unique (account_id, event_id, target_type, target_id);
alter table test_rules drop constraint if exists test_rules_disease_key;
alter table test_rules drop constraint if exists test_rules_unique;
alter table test_rules add constraint test_rules_unique unique (account_id, disease);

-- accounts and auth_links: you can only see your own.
alter table accounts enable row level security;
alter table accounts force row level security;
drop policy if exists tenant_isolation on accounts;
create policy tenant_isolation on accounts using (id = nullif(current_setting('app.account_id', true), '')) with check (id = nullif(current_setting('app.account_id', true), ''));
grant select, insert, update, delete on accounts to birdbox_app;
alter table auth_links enable row level security;
alter table auth_links force row level security;
drop policy if exists own_login on auth_links;
create policy own_login on auth_links using (auth_id = nullif(current_setting('app.auth_id', true), '')) with check (auth_id = nullif(current_setting('app.auth_id', true), ''));
grant select, insert, update, delete on auth_links to birdbox_app;

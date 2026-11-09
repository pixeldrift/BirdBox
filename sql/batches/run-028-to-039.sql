-- ONE BATCH: everything not yet run, in order — sql/028 through sql/039.
-- Paste this whole file into the Neon SQL editor (direct connection, not the pooler) and run it once.
-- Every step is safe to run again, so if it stops with an error, send me the message and re-run it after the fix.
--
-- Needs the species table loaded (it is, if you ran `npm run seed:species` earlier) — the sample aviary at the end uses it.
-- Contents:
--   028_supply_main_image.sql
--   029_staff_phones_menus.sql
--   030_remove_credits_tab.sql
--   031_rename_browse.sql
--   032_cleaning_plans.sql
--   033_health_tests.sql
--   034_test_rules.sql
--   035_aviary_keeps.sql
--   036_show_results.sql
--   037_award_photos.sql
--   038_multi_tenant.sql
--   039_demo_data.sql
--
-- After it runs: set the Vercel environment variables for logins (see docs/accounts.md). Until you do, the app behaves as before.


-- ======================================================================================================
-- 028_supply_main_image.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor (after 027_supplies_from_photos.sql). Lets you choose which of a supply's photos is
-- its main picture, including the photos that came with the app.
alter table supplies add column if not exists main_image text not null default '';

-- ======================================================================================================
-- 029_staff_phones_menus.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor. Three small tidy-ups:
-- 1. The team role "Employee" is now called "Staff".
-- 2. Phone numbers are saved as xxx-xxx-xxxx (new ones are normalised automatically; this fixes the ones already saved).
--    Only ten-digit numbers (or eleven with a leading 1) are changed; anything else is left as typed.
-- 3. "On Device" and "Cloud Sync" are no longer menu sections (they'll come back as a status indicator once the app works
--    offline), so their saved menu rows are removed.

update users set role = 'Staff' where role = 'Employee';

update contacts set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';
update users set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';
update aviary set phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^1?([0-9]{3})([0-9]{3})([0-9]{4})$', '\1-\2-\3')
  where regexp_replace(phone, '[^0-9]', '', 'g') ~ '^1?[0-9]{10}$' and phone !~ '[A-Za-z]' and phone !~ '^\+[02-9]';

delete from navigation where id in ('account/cloudsync', 'account/ondevice');

-- ======================================================================================================
-- 030_remove_credits_tab.sql
-- ======================================================================================================
-- Credits now lives inside About; remove the old Credits menu row.
delete from navigation where id = 'account/credits';

-- ======================================================================================================
-- 031_rename_browse.sql
-- ======================================================================================================
-- The Classifieds section's Browse tab is now called Classifieds.
update navigation set label = 'Classifieds' where id = 'classifieds/browse' and label = 'Browse';

-- ======================================================================================================
-- 032_cleaning_plans.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor (after 023_care_plans.sql). Cleaning plans work like feeding plans: each line belongs
-- to a cage, room, building, location, bird or the whole aviary, and now also says WHICH plan it is (feeding or
-- cleaning). A cleaning line is a recurring job — what to do, how often, who does it, and which supplies it uses
-- (so you can see when the disinfectant is running low). Its days show up in Tasks and the Calendar.

alter table care_items add column if not exists plan text not null default 'feeding';
alter table care_items add column if not exists repeat text not null default 'Weekly';
alter table care_items add column if not exists every integer;
alter table care_items add column if not exists weekdays text not null default '';
alter table care_items add column if not exists start_date date;
alter table care_items add column if not exists assigned_to text;
alter table care_items add column if not exists supply_ids text not null default '';
create index if not exists care_items_plan_idx on care_items (plan);

-- ======================================================================================================
-- 033_health_tests.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor. Health records can now be disease TESTS: which disease was tested for and the
-- result (the date and the lab or vet use the existing date and provider columns). A bird can have as many as you like;
-- the app shows the most recent result per disease as a badge.

alter table health_records add column if not exists disease text not null default '';
alter table health_records add column if not exists result text not null default '';
create index if not exists health_records_disease_idx on health_records (disease);

-- ======================================================================================================
-- 034_test_rules.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor (after 033_health_tests.sql). How often each disease should be re-tested, so the app can
-- flag tests that are due soon or overdue. Only the ones you change are stored here; the app has sensible starting
-- defaults for the common diseases. interval_months = 0 means "no reminder".

create table if not exists test_rules (
  id text primary key,
  disease text not null unique,
  interval_months integer not null default 0 check (interval_months >= 0)
);

-- ======================================================================================================
-- 035_aviary_keeps.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor. What kind of birds you keep, so the app can use your words ("coop" and "hatch" for
-- chickens, "cage" and "clutch" for parrots). Set it in Account -> Settings -> My Aviary.
alter table aviary add column if not exists keeps text not null default '';

-- ======================================================================================================
-- 036_show_results.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor. Awards and results for a bird: shows, races and trials — the event, the date, the class or
-- category, and the placement ("1st", "Best of Breed", "Champion"…). A bird can have as many as you like, and the results of a
-- bird's parents and grandparents show up on its own page as pedigree credentials.

create table if not exists show_results (
  id text primary key,
  bird_id text not null,
  kind text not null default 'Show',
  event text not null,
  date date,
  location text not null default '',
  category text not null default '',
  placement text not null default '',
  entries integer,
  judge text not null default '',
  notes text not null default ''
);
create index if not exists show_results_bird_idx on show_results (bird_id);

-- ======================================================================================================
-- 037_award_photos.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor (after 036_show_results.sql). Photos can be linked to awards and results, like they can
-- to birds, supplies and receipts. Also adds two kinds of calendar event: Show and Vet appointment.
alter table media_links drop constraint if exists media_links_target_type_check;
alter table media_links add constraint media_links_target_type_check
  check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact', 'aviary', 'location', 'building', 'room', 'cage', 'supply', 'award'));

-- ======================================================================================================
-- 038_multi_tenant.sql
-- ======================================================================================================
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

-- ======================================================================================================
-- 039_demo_data.sql
-- ======================================================================================================
-- Run once in the Neon SQL editor (after 038_multi_tenant.sql). The SAMPLE AVIARY: a made-up flock, places, supplies and records
-- that live in the 'demo' account. Every new account gets a copy of it (Settings → Your account → Load / Remove sample data).
-- Generated by scripts/gen-demo-account.js — change that script, not this file. Re-running is safe.
-- Needs the species table loaded (npm run seed:species) so the birds get their species.

select set_config('app.account_id', 'demo', false);
insert into accounts (id, name) values ('demo', 'Demo Aviary') on conflict (id) do nothing;
insert into aviary (id, name, description, keeps) values ('main', 'Fallbrook Aviary', 'A made-up aviary to look around in.', '') on conflict (account_id, id) do nothing;

-- The pedigree: 136 Game of Thrones birds in family groups.

insert into birds (id, name, sex, species, species_code, mutation, mother_id, father_id, notes, status)
select v.id, v.name, v.sex, v.species, v.species_code, v.mutation, v.mother_id, v.father_id, v.notes, 'Available'
from (values
  ('b-got-001', 'Rickard Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-002', 'Lyarra Stark', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Normal', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-003', 'Catelyn Stark (Tully)', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-024', 'b-got-023', 'Test pedigree (Game of Thrones).'),
  ('b-got-004', 'Eddard Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-002', 'b-got-001', 'Test pedigree (Game of Thrones).'),
  ('b-got-005', 'Brandon Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-002', 'b-got-001', 'Test pedigree (Game of Thrones).'),
  ('b-got-006', 'Benjen Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-002', 'b-got-001', 'Test pedigree (Game of Thrones).'),
  ('b-got-007', 'Lyanna Stark', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-002', 'b-got-001', 'Test pedigree (Game of Thrones).'),
  ('b-got-008', 'Rob Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-003', 'b-got-004', 'Test pedigree (Game of Thrones).'),
  ('b-got-009', 'Sansa Stark', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-003', 'b-got-004', 'Test pedigree (Game of Thrones).'),
  ('b-got-010', 'Arya Stark', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-003', 'b-got-004', 'Test pedigree (Game of Thrones).'),
  ('b-got-011', 'Bran Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-003', 'b-got-004', 'Test pedigree (Game of Thrones).'),
  ('b-got-012', 'Rickon Stark', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-003', 'b-got-004', 'Test pedigree (Game of Thrones).'),
  ('b-got-013', 'Jon Snow', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-007', 'b-got-016', 'Test pedigree (Game of Thrones).'),
  ('b-got-014', 'Aerys II Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-094', 'b-got-095', 'Test pedigree (Game of Thrones).'),
  ('b-got-015', 'Rhaella Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Opamint', 'b-got-094', 'b-got-095', 'Test pedigree (Game of Thrones).'),
  ('b-got-016', 'Rhaegar Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-015', 'b-got-014', 'Test pedigree (Game of Thrones).'),
  ('b-got-017', 'Viserys Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-015', 'b-got-016', 'Test pedigree (Game of Thrones).'),
  ('b-got-018', 'Daenerys Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-015', 'b-got-016', 'Test pedigree (Game of Thrones).'),
  ('b-got-019', 'Ellia Martell', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-049', 'b-got-048', 'Test pedigree (Game of Thrones).'),
  ('b-got-020', 'Rhaenys Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-046', 'b-got-016', 'Test pedigree (Game of Thrones).'),
  ('b-got-021', 'Aegon Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-046', 'b-got-016', 'Test pedigree (Game of Thrones).'),
  ('b-got-022', 'Brynden Tully', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-043', 'b-got-042', 'Test pedigree (Game of Thrones).'),
  ('b-got-023', 'Hoster Tully', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-043', 'b-got-042', 'Test pedigree (Game of Thrones).'),
  ('b-got-024', 'Minisa Tully', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-025', 'Lysa Arryn (Tully)', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-024', 'b-got-023', 'Test pedigree (Game of Thrones).'),
  ('b-got-026', 'Edmure Tully', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-024', 'b-got-023', 'Test pedigree (Game of Thrones).'),
  ('b-got-027', 'Walder Frey', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-028', 'Roslin Tully (Frey)', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-027', 'Test pedigree (Game of Thrones).'),
  ('b-got-029', 'Jon Arryn', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-103', 'b-got-102', 'Test pedigree (Game of Thrones).'),
  ('b-got-030', 'Robyn Arryn', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Cinnamon', 'b-got-025', 'b-got-029', 'Test pedigree (Game of Thrones).'),
  ('b-got-031', 'Balon Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-041', 'b-got-040', 'Test pedigree (Game of Thrones).'),
  ('b-got-032', 'Euron Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-041', 'b-got-040', 'Test pedigree (Game of Thrones).'),
  ('b-got-033', 'Yara Greyjoy', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-039', 'b-got-031', 'Test pedigree (Game of Thrones).'),
  ('b-got-034', 'Theon Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-039', 'b-got-031', 'Test pedigree (Game of Thrones).'),
  ('b-got-035', 'Walda Frey', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-038', 'b-got-027', 'Test pedigree (Game of Thrones).'),
  ('b-got-036', 'Roose Bolton', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-037', 'Unnamed', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Normal', 'b-got-035', 'b-got-036', 'Test pedigree (Game of Thrones).'),
  ('b-got-038', 'Unnamed', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-039', 'Alannys Greyjoy (Harlaw)', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-040', 'Unnamed Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-041', 'Unnamed Greyjoy', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Pineapple', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-042', 'Robbyrt Tully', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-043', 'Sansa Lefford', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-044', 'Ramsay Bolton', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Turquoise', null, 'b-got-036', 'Test pedigree (Game of Thrones).'),
  ('b-got-045', 'Doran Martell', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-049', 'b-got-048', 'Test pedigree (Game of Thrones).'),
  ('b-got-046', 'Trystane Martell', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-130', 'b-got-045', 'Test pedigree (Game of Thrones).'),
  ('b-got-047', 'Oberyn Martell', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-049', 'b-got-048', 'Test pedigree (Game of Thrones).'),
  ('b-got-048', 'Lewyn Martell', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-049', 'Unnamed Martell', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-050', 'Khal Drogo', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Cinnamon', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-051', 'Rheagal', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-018', null, 'Test pedigree (Game of Thrones).'),
  ('b-got-052', 'Drogon', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-018', null, 'Test pedigree (Game of Thrones).'),
  ('b-got-053', 'Viserion', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-018', null, 'Test pedigree (Game of Thrones).'),
  ('b-got-054', 'Luthor Tyrell', 'Male', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), 'Pallid', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-055', 'Olenna Tyrell', 'Female', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-056', 'Mace Tyrell', 'Male', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), 'Blue', 'b-got-055', 'b-got-054', 'Test pedigree (Game of Thrones).'),
  ('b-got-057', 'Alerie Tyrell', 'Female', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), 'Pallid', 'b-got-055', 'b-got-054', 'Test pedigree (Game of Thrones).'),
  ('b-got-058', 'Loras Tyrell', 'Male', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), null, 'b-got-057', 'b-got-056', 'Test pedigree (Game of Thrones).'),
  ('b-got-059', 'Margery Tyrell', 'Female', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), null, 'b-got-057', 'b-got-056', 'Test pedigree (Game of Thrones).'),
  ('b-got-060', 'Ellaria Sand', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-061', 'Obara Sand', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-062', 'Mymeria Sand', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-063', 'Tyene Sand', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-060', 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-064', 'Selyse Baratheon (Florent)', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), 'Pearl', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-065', 'Stannis Baratheon', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-069', 'b-got-068', 'Test pedigree (Game of Thrones).'),
  ('b-got-066', 'Shireen Baratheon', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), 'Pied', 'b-got-064', 'b-got-065', 'Test pedigree (Game of Thrones).'),
  ('b-got-067', 'Robert Baratheon', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-069', 'b-got-068', 'Test pedigree (Game of Thrones).'),
  ('b-got-068', 'Unnamed Baratheon', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-069', 'Unnamed Baratheon', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), 'Pearl', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-070', 'Renly Baratheon', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-069', 'b-got-068', 'Test pedigree (Game of Thrones).'),
  ('b-got-071', 'Joanna Lannister', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-072', 'Tywin Lannister', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-075', 'b-got-074', 'Test pedigree (Game of Thrones).'),
  ('b-got-073', 'Kevan Lannister', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-075', 'b-got-074', 'Test pedigree (Game of Thrones).'),
  ('b-got-074', 'Unnamed Lannister', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-075', 'Unnamed Lannister', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-076', 'Cersei Lannister', 'Female', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-077', 'Jaime Lannister', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-078', 'Tyrion Lannister', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-079', 'Gendry', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), 'Cinnamon', null, 'b-got-067', 'Test pedigree (Game of Thrones).'),
  ('b-got-080', 'Joffrey Baratheon', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, 'b-got-076', 'b-got-077', 'Test pedigree (Game of Thrones).'),
  ('b-got-081', 'Myrcella Baratheon', 'Female', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, 'b-got-076', 'b-got-077', 'Test pedigree (Game of Thrones).'),
  ('b-got-082', 'Tommen Baratheon', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, 'b-got-076', 'b-got-077', 'Test pedigree (Game of Thrones).'),
  ('b-got-083', 'Lancel Lannister', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-131', 'b-got-073', 'Test pedigree (Game of Thrones).'),
  ('b-got-084', 'Aemon Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones).'),
  ('b-got-085', 'Maekar I Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-086', 'Dyanna Dayne', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-087', 'Daeron Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones). Known carrier of: Cinnamon, Turquoise.'),
  ('b-got-088', 'Aerion Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Yellow-sided', 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones).'),
  ('b-got-089', 'Daella Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones).'),
  ('b-got-090', 'Rehea Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones).'),
  ('b-got-091', 'Aegon V Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-086', 'b-got-085', 'Test pedigree (Game of Thrones).'),
  ('b-got-092', 'Betha Blackwood', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-093', 'Duncan Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-092', 'b-got-091', 'Test pedigree (Game of Thrones).'),
  ('b-got-094', 'Shaera Targaryen', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Normal', 'b-got-092', 'b-got-091', 'Test pedigree (Game of Thrones).'),
  ('b-got-095', 'Jaehaerys Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-092', 'b-got-091', 'Test pedigree (Game of Thrones).'),
  ('b-got-096', 'Daeron Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-092', 'b-got-091', 'Test pedigree (Game of Thrones).'),
  ('b-got-097', 'Rhaelle Targaryen', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-092', 'b-got-091', 'Test pedigree (Game of Thrones).'),
  ('b-got-098', 'Sarella Sand', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-099', 'Unnamed Sand', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-100', 'Unnamed Sand', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-101', 'Unnamed Sand', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-047', 'Test pedigree (Game of Thrones).'),
  ('b-got-102', 'Jasper Arryn', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-103', 'Unnamed Arryn', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-104', 'Randyll Tarly', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-105', 'Melessa Tarly', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-106', 'Samwell Tarly', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-105', 'b-got-104', 'Test pedigree (Game of Thrones).'),
  ('b-got-107', 'Talla Tarly', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-105', 'b-got-104', 'Test pedigree (Game of Thrones).'),
  ('b-got-108', 'Dickon Tarly', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-105', 'b-got-104', 'Test pedigree (Game of Thrones).'),
  ('b-got-109', 'Craster', 'Male', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-110', 'Gilly', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, 'b-got-109', 'Test pedigree (Game of Thrones).'),
  ('b-got-111', 'Ygritte', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-112', 'Hodor', 'Unsexed', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-113', 'Jeor Mormont', 'Unsexed', 'Sun Conure', (select code from species where scientific_name = 'Aratinga solstitialis' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-114', 'Bronn', 'Unsexed', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), 'Grey', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-115', 'Podrick', 'Unsexed', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), 'Blue', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-116', 'Shae', 'Unsexed', 'Sun Conure', (select code from species where scientific_name = 'Aratinga solstitialis' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-117', 'Brienne of Tarth', 'Unsexed', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-118', 'Lothar', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, 'b-got-027', 'Test pedigree (Game of Thrones).'),
  ('b-got-119', 'Jorah Mormont', 'Male', 'Sun Conure', (select code from species where scientific_name = 'Aratinga solstitialis' limit 1), null, null, 'b-got-113', 'Test pedigree (Game of Thrones).'),
  ('b-got-120', 'Missandei', 'Unsexed', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-121', 'Grey Worm', 'Unsexed', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-122', 'Melisandre', 'Unsexed', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), 'Cinnamon', null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-123', 'Gregor Clegane', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, 'b-got-126', 'b-got-125', 'Test pedigree (Game of Thrones).'),
  ('b-got-124', 'Sandor Clegane', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, 'b-got-126', 'b-got-125', 'Test pedigree (Game of Thrones).'),
  ('b-got-125', 'Unnamed Clegane', 'Male', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-126', 'Unnamed Clegane', 'Female', 'Indian Ringneck', (select code from species where scientific_name = 'Psittacula krameri' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-127', 'Varys', 'Unsexed', 'Sun Conure', (select code from species where scientific_name = 'Aratinga solstitialis' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-128', 'Maege Mormont', 'Female', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-129', 'Lyanna Mormont', 'Female', 'Peach-faced Lovebird', (select code from species where scientific_name = 'Agapornis roseicollis' limit 1), null, 'b-got-128', null, 'Test pedigree (Game of Thrones).'),
  ('b-got-130', 'Mellario of Norvos', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-131', 'Dorna Swift', 'Female', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, null, null, 'Test pedigree (Game of Thrones).'),
  ('b-got-132', 'Willem Lanniseter', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Turquoise', 'b-got-131', 'b-got-073', 'Test pedigree (Game of Thrones).'),
  ('b-got-133', 'Maetyn Lannister', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), 'Normal', 'b-got-131', 'b-got-073', 'Test pedigree (Game of Thrones).'),
  ('b-got-134', 'Maron Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-039', 'b-got-031', 'Test pedigree (Game of Thrones).'),
  ('b-got-135', 'Rodrik Greyjoy', 'Male', 'Green-cheeked Conure', (select code from species where scientific_name = 'Pyrrhura molinae' limit 1), null, 'b-got-039', 'b-got-031', 'Test pedigree (Game of Thrones).'),
  ('b-got-136', 'Joanna Tarly', 'Female', 'Cockatiel', (select code from species where scientific_name = 'Nymphicus hollandicus' limit 1), null, 'b-got-110', 'b-got-106', 'Test pedigree (Game of Thrones).')
) as v(id, name, sex, species, species_code, mutation, mother_id, father_id, notes)
on conflict (account_id, id) do nothing;

-- Places: two locations, buildings, rooms and cages.

alter table buildings add column if not exists location_id text;
alter table cages add column if not exists room_id text;

insert into locations (id, name, description) values
  ('loc-demo-home', 'Home Farm', 'Main breeding site (demo)'),
  ('loc-demo-ranch', 'Fallbrook Ranch', 'Second site (demo)')
on conflict (account_id, id) do nothing;

insert into buildings (code, nickname, description) values
  ('F1', '1', 'Demo building'), ('F2', '2', 'Demo building'), ('F3', '3', 'Demo building'), ('F5', '5', 'Demo building'), ('F6', '6', 'Demo building')
on conflict (account_id, code) do nothing;
update buildings set location_id = 'loc-demo-home' where code in ('F1', 'F2', 'F3') and location_id is null;
update buildings set location_id = 'loc-demo-ranch' where code in ('F5', 'F6') and location_id is null;

insert into rooms (id, name, description, building_code, location_id) values
  ('room-demo-flight', 'Flight Room', 'Large flight cages (demo)', 'F2', null),
  ('room-demo-quarantine', 'Quarantine', 'New arrivals (demo)', 'F1', null),
  ('room-demo-nursery', 'Nursery', 'Hand-feeding and weaning (demo)', 'F6', null),
  ('room-demo-hatchery', 'Hatchery', 'Incubators (demo) — straight on the location, no building', null, 'loc-demo-ranch')
on conflict (account_id, id) do nothing;

insert into cages (code, building_code, room_id, description) values
  ('F1-101', 'F1', null, 'Demo cage'),
  ('F2-101', null, 'room-demo-flight', 'Demo cage'),
  ('F1-102', 'F1', null, 'Demo cage'),
  ('F2-102', null, 'room-demo-flight', 'Demo cage'),
  ('F1-103', 'F1', null, 'Demo cage'),
  ('F2-103', null, 'room-demo-flight', 'Demo cage'),
  ('F1-104', 'F1', null, 'Demo cage'),
  ('F2-104', null, 'room-demo-flight', 'Demo cage'),
  ('F1-105', 'F1', null, 'Demo cage'),
  ('F2-105', null, 'room-demo-flight', 'Demo cage'),
  ('F1-106', 'F1', null, 'Demo cage'),
  ('F2-106', null, 'room-demo-flight', 'Demo cage'),
  ('F1-107', 'F1', null, 'Demo cage'),
  ('F2-107', null, 'room-demo-flight', 'Demo cage'),
  ('F1-108', 'F1', null, 'Demo cage'),
  ('F2-108', null, 'room-demo-flight', 'Demo cage'),
  ('F3-101', 'F3', null, 'Demo cage'),
  ('F3-102', 'F3', null, 'Demo cage'),
  ('F3-103', 'F3', null, 'Demo cage'),
  ('F3-104', 'F3', null, 'Demo cage'),
  ('F5-101', 'F5', null, 'Demo cage'),
  ('F5-102', 'F5', null, 'Demo cage'),
  ('F6-101', null, 'room-demo-nursery', 'Demo cage'),
  ('F6-102', null, 'room-demo-nursery', 'Demo cage'),
  ('F6-103', null, 'room-demo-nursery', 'Demo cage')
on conflict (account_id, code) do nothing;

update birds set cage = 'F1-101' where id in ('b-got-111', 'b-got-117', 'b-got-075', 'b-got-131', 'b-got-074', 'b-got-072') and cage is null;
update birds set cage = 'F2-101' where id in ('b-got-073', 'b-got-083', 'b-got-132', 'b-got-133', 'b-got-002', 'b-got-024') and cage is null;
update birds set cage = 'F1-102' where id in ('b-got-043', 'b-got-049', 'b-got-086', 'b-got-092', 'b-got-103', 'b-got-130') and cage is null;
update birds set cage = 'F2-102' where id in ('b-got-001', 'b-got-042', 'b-got-048', 'b-got-085', 'b-got-102', 'b-got-007') and cage is null;
update birds set cage = 'F1-103' where id in ('b-got-019', 'b-got-089', 'b-got-090', 'b-got-004', 'b-got-005', 'b-got-006') and cage is null;
update birds set cage = 'F2-103' where id in ('b-got-022', 'b-got-023', 'b-got-029', 'b-got-045', 'b-got-047', 'b-got-084') and cage is null;
update birds set cage = 'F1-104' where id in ('b-got-087', 'b-got-088', 'b-got-091', 'b-got-099', 'b-got-100', 'b-got-101') and cage is null;
update birds set cage = 'F2-104' where id in ('b-got-003', 'b-got-025', 'b-got-060', 'b-got-061', 'b-got-062', 'b-got-094') and cage is null;
update birds set cage = 'F1-105' where id in ('b-got-098', 'b-got-026', 'b-got-046', 'b-got-093', 'b-got-095', 'b-got-096') and cage is null;
update birds set cage = 'F2-105' where id in ('b-got-097', 'b-got-009', 'b-got-010', 'b-got-015', 'b-got-063', 'b-got-008') and cage is null;
update birds set cage = 'F1-106' where id in ('b-got-011', 'b-got-012', 'b-got-014', 'b-got-030', 'b-got-016', 'b-got-018') and cage is null;
update birds set cage = 'F2-106' where id in ('b-got-020', 'b-got-013', 'b-got-017', 'b-got-021', 'b-got-051', 'b-got-052') and cage is null;
update birds set cage = 'F1-107' where id in ('b-got-053', 'b-got-038', 'b-got-027', 'b-got-036', 'b-got-028', 'b-got-035') and cage is null;
update birds set cage = 'F2-107' where id in ('b-got-044', 'b-got-118', 'b-got-037', 'b-got-039', 'b-got-041', 'b-got-040') and cage is null;
update birds set cage = 'F1-108' where id in ('b-got-031', 'b-got-032', 'b-got-033', 'b-got-034', 'b-got-134', 'b-got-135') and cage is null;
update birds set cage = 'F2-108' where id in ('b-got-050') and cage is null;
update birds set cage = 'F3-101' where id in ('b-got-105', 'b-got-104', 'b-got-109', 'b-got-107', 'b-got-110', 'b-got-106') and cage is null;
update birds set cage = 'F3-102' where id in ('b-got-108', 'b-got-136', 'b-got-112', 'b-got-120', 'b-got-064', 'b-got-069') and cage is null;
update birds set cage = 'F3-103' where id in ('b-got-068', 'b-got-065', 'b-got-067', 'b-got-070', 'b-got-066', 'b-got-079') and cage is null;
update birds set cage = 'F3-104' where id in ('b-got-071') and cage is null;
update birds set cage = 'F5-101' where id in ('b-got-114', 'b-got-121', 'b-got-126', 'b-got-125', 'b-got-123', 'b-got-124') and cage is null;
update birds set cage = 'F5-102' where id in ('b-got-076', 'b-got-077', 'b-got-081', 'b-got-080', 'b-got-082', 'b-got-078') and cage is null;
update birds set cage = 'F6-101' where id in ('b-got-115', 'b-got-122', 'b-got-128', 'b-got-129', 'b-got-055', 'b-got-054') and cage is null;
update birds set cage = 'F6-102' where id in ('b-got-057', 'b-got-056', 'b-got-059', 'b-got-058') and cage is null;
update birds set cage = 'F6-103' where id in ('b-got-113', 'b-got-119', 'b-got-116', 'b-got-127') and cage is null;

insert into cages (code, room_id) select distinct cage, 'room-demo-quarantine' from birds where cage in ('F1-012') on conflict (account_id, code) do update set room_id = coalesce(cages.room_id, excluded.room_id);

-- Supplies, with photos that ship with the app.

alter table supplies add column if not exists images text[] not null default '{}';

insert into supplies (id, name, category, brand, unit, description, images, notes) values
  ('sup-kruse-ar-pellets', 'Avian Resources Diet pellets, 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag', 'Pelleted diet. Guaranteed analysis: crude protein min. 16.5%, crude fat min. 2.0%, crude fiber max. 4.0%. Feed free choice as the sole ration or as part of a varied diet with seed, sprouts and fresh produce. 50 lb (22.68 kg) bag.', array['images/supplies/kruse-ar-pellets-bag.jpg', 'images/supplies/kruse-ar-pellets-sample.jpg', 'images/supplies/kruse-ar-pellets-pallet.jpg', 'images/supplies/kruse-ar-pellets-label.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-kruse-sprout-mix', 'Kruse Avian Resources Sprout Mix, 50 lb', 'Feed', 'Kruse', 'bag', 'Sprouting mix: oats, Alaskan peas, paddy rice, black sunflower, Canadian peas, buckwheat, lentils, hulled peanuts, garbanzo beans, soybeans and pinto beans. Crude protein not less than 17.61%. 50 lb (22.68 kg). Manufactured for Western Milling LLC.', array['images/supplies/kruse-sprout-mix-bag.jpg', 'images/supplies/kruse-sprout-mix-sample.jpg', 'images/supplies/kruse-sprout-mix-label.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-kruse-game-bird-crumble', 'Gamebird / Turkey Grower Crumbles, 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag', 'Designed for growing and finishing gamebirds and turkeys; also used for quail, ducks, geese and pheasants. Crude protein min. 24.0%. Provide grit to aid digestion. 50 lb (22.68 kg).', array['images/supplies/kruse-game-bird-crumble-bag.jpg', 'images/supplies/kruse-game-bird-crumble-sample.jpg', 'images/supplies/kruse-game-bird-crumble-label.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-kruse-pigeon-pellets', '22% Pigeon Pellets 1/8", 50 lb', 'Feed', 'O.H. Kruse Grain and Milling', 'bag', 'Designed to be fed to pigeons as the sole ration; keep feeders about half full. Crude protein min. 22.0%. 50 lb (22.68 kg).', array['images/supplies/kruse-pigeon-pellets-bag.jpg', 'images/supplies/kruse-pigeon-pellets-label.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-fine-feathers-millet', 'Fine Feathers Parakeet Mix, 50 lb', 'Feed', 'Fine Feathers (O.H. Kruse Grain and Milling)', 'bag', 'Seed mix with canary seed, oat groats and millet. Crude protein min. 13.0%, crude fat min. 4.6%, crude fiber max. 5.3%. 50 lb (22.68 kg).', array['images/supplies/fine-feathers-millet-bag.jpg', 'images/supplies/fine-feathers-millet-sample.jpg', 'images/supplies/fine-feathers-millet-label.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-magnolia-seed-mix', 'Magnolia Bird Farm Sr. Large Hookbill mix (no sunflower), 50 lb', 'Feed', 'Magnolia Bird Farm', 'bag', 'Seed mix for large parrots, without sunflower. 50 lb bag, packaged by Magnolia Bird Farm (Anaheim / Riverside, CA).', array['images/supplies/magnolia-seed-mix-bag.jpg', 'images/supplies/magnolia-seed-mix-sample.jpg', 'images/supplies/magnolia-seed-mix-pallet.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-zupreme-pellets', 'ZuPreem AvianBreeder Diets, 40 lb', 'Feed', 'ZuPreem', 'bag', 'Balanced nutrition for health and reproduction in breeding birds. Comes in FruitBlend (natural fruit flavors) and Natural (added vitamins, minerals and amino acids) versions for large parrots, parrots and conures, and cockatiels. 40 lb (18.1 kg).', array['images/supplies/zupreme-pellets-bag.jpg', 'images/supplies/zupreme-pellets-sample.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-equine-pellets', 'Pine pellet bedding, 40 lb', 'Other', 'Tractor Supply Co', 'bag', 'Natural pine pelletized bedding for horses and small animals: absorbent, reduces cleaning time, neutralizes odor, biodegradable. 40 lb (18.14 kg) bag.', array['images/supplies/equine-pellets-bag.jpg', 'images/supplies/equine-pellets-sample.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-meal-worms', 'Mealworms (live)', 'Feed', '', 'box', 'Live mealworms. Arrive in a ventilated "Live animals" box and are kept in a bucket.', array['images/supplies/meal-worms-box.jpg', 'images/supplies/meal-worms-bucket.jpg', 'images/supplies/meal-worms-sample.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-super-worms', 'Superworms (live)', 'Feed', '', 'box', 'Live superworms, shipped in a box and kept in a bucket.', array['images/supplies/super-worms-box.jpg', 'images/supplies/super-worms-bucket.jpg', 'images/supplies/super-worms-sample.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.'),
  ('sup-mice', 'Frozen mice, small', 'Feed', '', 'bag', 'Small frozen mice, bagged (a bag is marked "100 Sm") and boxed.', array['images/supplies/mice-bag.jpg', 'images/supplies/mice-box.jpg']::text[], 'Added from the supply photos. Count and reorder level not set yet.')
on conflict (account_id, id) do nothing;

-- Team
insert into users (id, first_name, last_name, role, status, email, phone, notes) values
  ('u-demo-marta', 'Marta', 'Evers', 'Manager', 'Active', 'marta@example.com', '555-010-0141', ''),
  ('u-demo-dev', 'Dev', 'Patel', 'Staff', 'Active', 'dev@example.com', '555-010-0142', ''),
  ('u-demo-joy', 'Joy', 'Okafor', 'Volunteer', 'Active', 'joy@example.com', '555-010-0143', '')
on conflict (account_id, id) do nothing;
insert into contacts (id, name, type, email, phone, user_id) values
  ('c-u-demo-marta', 'Marta Evers', 'Team', 'marta@example.com', '555-010-0141', 'u-demo-marta'),
  ('c-u-demo-dev', 'Dev Patel', 'Team', 'dev@example.com', '555-010-0142', 'u-demo-dev'),
  ('c-u-demo-joy', 'Joy Okafor', 'Team', 'joy@example.com', '555-010-0143', 'u-demo-joy')
on conflict (account_id, id) do nothing;
-- Contacts
insert into contacts (id, name, type, company, city, state, email, phone, notes) values
  ('c-demo-hollis', 'Tessa Hollis', 'Pet Owner', 'Hollis Home', 'Portland', 'OR', 'tessa@example.com', '555-010-0201', 'Bought a conure pair last spring.'),
  ('c-demo-brightwing', 'Brightwing Aviary', 'Breeder', 'Brightwing Aviary', 'Boise', 'ID', 'hello@brightwing.example', '555-010-0202', 'Trades unrelated lines every year.'),
  ('c-demo-marquez', 'Luis Marquez', 'Breeder', '', 'Tucson', 'AZ', 'luis@example.com', '555-010-0203', ''),
  ('c-demo-feathered', 'The Feathered Friend', 'Store', 'The Feathered Friend', 'Sacramento', 'CA', 'orders@feathered.example', '555-010-0204', 'Takes hand-fed babies on consignment.'),
  ('c-demo-kruse', 'Valley Feed & Grain', 'Vendor', 'Valley Feed & Grain', 'Fallbrook', 'CA', 'sales@valleyfeed.example', '555-010-0205', 'Weekly feed delivery on Thursdays.'),
  ('c-demo-vet', 'Fallbrook Avian & Exotic', 'Vendor', 'Fallbrook Avian & Exotic', 'Fallbrook', 'CA', 'front@fallbrookvet.example', '555-010-0206', 'Dr. Reyes — our avian vet.'),
  ('c-demo-okafor', 'Grace Okafor', 'Pet Owner', '', 'Reno', 'NV', 'grace@example.com', '555-010-0207', ''),
  ('c-demo-lindqvist', 'Ingrid Lindqvist', 'Breeder', 'Nordlys Birds', 'Seattle', 'WA', 'ingrid@nordlys.example', '555-010-0208', 'Interested in Sun Conure chicks.')
on conflict (account_id, id) do nothing;
-- Money
insert into transactions (id, item, amount, date, category, funding, client_id, bird_id, notes) values
  ('tx-demo-01', 'Green-cheeked conure pair', 650, (current_date - 390), 'Sale', 'PayPal', 'c-demo-hollis', 'b-got-029', ''),
  ('tx-demo-02', 'Hand-fed cockatiel baby', 120, (current_date - 300), 'Sale', 'Cash', 'c-demo-okafor', null, ''),
  ('tx-demo-03', 'Pellets, 4 × 50 lb', -212.4, (current_date - 330), 'Expense', 'Card', 'c-demo-kruse', null, ''),
  ('tx-demo-04', 'Vet: annual wellness exams', -385, (current_date - 280), 'Expense', 'Card', 'c-demo-vet', null, ''),
  ('tx-demo-05', 'Sun Conure deposit', 150, (current_date - 250), 'Deposit', 'Zelle', 'c-demo-lindqvist', null, ''),
  ('tx-demo-06', 'Shipping crate + carrier fees', -96.5, (current_date - 200), 'Expense', 'Card', null, null, ''),
  ('tx-demo-07', 'Indian Ringneck breeding male', -900, (current_date - 190), 'Purchase', 'Check', 'c-demo-brightwing', 'b-got-092', ''),
  ('tx-demo-08', 'Consignment: 3 baby conures', 540, (current_date - 150), 'Sale', 'Check', 'c-demo-feathered', null, ''),
  ('tx-demo-09', 'Pine pellet bedding, 10 bags', -148, (current_date - 120), 'Expense', 'Card', 'c-demo-kruse', null, ''),
  ('tx-demo-10', 'Lovebird pair', 220, (current_date - 95), 'Sale', 'Cash', 'c-demo-marquez', null, ''),
  ('tx-demo-11', 'Pellets, 4 × 50 lb', -219.8, (current_date - 60), 'Expense', 'Card', 'c-demo-kruse', null, ''),
  ('tx-demo-12', 'Disease testing: 6 birds', -174, (current_date - 30), 'Expense', 'Card', 'c-demo-vet', null, ''),
  ('tx-demo-13', 'Green-cheeked conure baby', 310, (current_date - 14), 'Sale', 'Venmo', 'c-demo-hollis', null, '')
on conflict (account_id, id) do nothing;
-- Health records and disease tests
insert into health_records (id, bird_id, type, date, provider, notes, disease, result) values
  ('hr-demo-01', 'b-got-004', 'Immunization', (current_date - 400), 'Fallbrook Avian & Exotic', 'Polyoma booster.', '', ''),
  ('hr-demo-02', 'b-got-003', 'Immunization', (current_date - 400), 'Fallbrook Avian & Exotic', 'Polyoma booster.', '', ''),
  ('hr-demo-03', 'b-got-004', 'Vet Visit', (current_date - 280), 'Fallbrook Avian & Exotic', 'Annual wellness exam. Weight 74 g, body condition good.', '', ''),
  ('hr-demo-04', 'b-got-003', 'Vet Visit', (current_date - 280), 'Fallbrook Avian & Exotic', 'Annual wellness exam. Slightly overweight — adjust pellets.', '', ''),
  ('hr-demo-05', 'b-got-009', 'DNA Certificate', (current_date - 340), 'Avian Biotech International', 'DNA sexing confirmed female.', '', ''),
  ('hr-demo-06', 'b-got-010', 'DNA Certificate', (current_date - 340), 'Avian Biotech International', 'DNA sexing confirmed female.', '', ''),
  ('hr-demo-07', 'b-got-004', 'Disease Test', (current_date - 395), 'Fallbrook Avian & Exotic', 'Quarantine screening.', 'Psittacosis (Chlamydia)', 'Negative'),
  ('hr-demo-08', 'b-got-003', 'Disease Test', (current_date - 395), 'Fallbrook Avian & Exotic', 'Quarantine screening.', 'Psittacosis (Chlamydia)', 'Negative'),
  ('hr-demo-09', 'b-got-004', 'Disease Test', (current_date - 360), 'Fallbrook Avian & Exotic', '', 'PBFD', 'Negative'),
  ('hr-demo-10', 'b-got-092', 'Disease Test', (current_date - 345), 'Fallbrook Avian & Exotic', 'Before the purchase.', 'Giardia', 'Negative'),
  ('hr-demo-11', 'b-got-092', 'Disease Test', (current_date - 30), 'Fallbrook Avian & Exotic', '', 'Giardia', 'Positive'),
  ('hr-demo-12', 'b-got-092', 'Vet Visit', (current_date - 28), 'Fallbrook Avian & Exotic', 'Giardia treatment started; retest in 3 weeks.', '', ''),
  ('hr-demo-13', 'b-got-029', 'Disease Test', (current_date - 335), 'Fallbrook Avian & Exotic', '', 'Psittacosis (Chlamydia)', 'Negative'),
  ('hr-demo-14', 'b-got-010', 'Immunization', (current_date - 21), 'Fallbrook Avian & Exotic', 'Polyoma, first dose.', '', ''),
  ('hr-demo-15', 'b-got-009', 'Immunization', (current_date - 21), 'Fallbrook Avian & Exotic', 'Polyoma, first dose.', '', '')
on conflict (account_id, id) do nothing;
-- Awards
insert into show_results (id, bird_id, kind, event, date, location, category, placement, entries, judge) values
  ('sr-demo-01', 'b-got-004', 'Show', 'Pacific Coast Aviculture Expo', (current_date - 150), 'San Diego, CA', 'Conures · Pyrrhura · Adult male', 'Best of Breed', 18, 'Judge M. Alvarez'),
  ('sr-demo-02', 'b-got-003', 'Show', 'Pacific Coast Aviculture Expo', (current_date - 150), 'San Diego, CA', 'Conures · Pyrrhura · Adult female', '2nd', 15, 'Judge M. Alvarez'),
  ('sr-demo-03', 'b-got-029', 'Show', 'Inland Empire Bird Fair', (current_date - 410), 'Riverside, CA', 'Conures · Young bird', '1st', 9, '')
on conflict (account_id, id) do nothing;
-- Shipments
insert into waybills (id, waybill_number, direction, date, client_id, bird_ids, departing_airport, arriving_airport, cost, method, carrier, status, notes)
values ('wb-demo-01', 'AA-0042-7781', 'Outgoing', (current_date - 200), 'c-demo-lindqvist', array['b-got-029']::text[], 'SAN', 'SEA', 142, 'Air cargo', 'Alaska Air Cargo', 'Complete', '')
on conflict (account_id, id) do nothing;
insert into waybills (id, waybill_number, direction, date, client_id, bird_ids, departing_airport, arriving_airport, cost, method, carrier, status, notes)
values ('wb-demo-02', 'DL-0171-9920', 'Incoming', (current_date - 190), 'c-demo-brightwing', array['b-got-092']::text[], 'BOI', 'SAN', 118, 'Air cargo', 'Delta Cargo', 'Complete', '')
on conflict (account_id, id) do nothing;
insert into waybills (id, waybill_number, direction, date, client_id, bird_ids, departing_airport, arriving_airport, cost, method, carrier, status, notes)
values ('wb-demo-03', '', 'Outgoing', (current_date - -9), 'c-demo-marquez', array['b-got-043']::text[], 'SAN', 'TUS', 96, 'Air cargo', 'Southwest Cargo', 'Pending', '')
on conflict (account_id, id) do nothing;
-- Supplies: stock on hand (some low), plus cleaning and medical items
update supplies set quantity = 6, reorder_level = 3, price = 52.99, vendor_id = 'c-demo-kruse' where id = 'sup-kruse-ar-pellets';
update supplies set quantity = 1, reorder_level = 2, price = 58.5, vendor_id = 'c-demo-kruse' where id = 'sup-kruse-sprout-mix';
update supplies set quantity = 4, reorder_level = 2, price = 31.25, vendor_id = 'c-demo-kruse' where id = 'sup-kruse-game-bird-crumble';
update supplies set quantity = 2, reorder_level = 2, price = 39 where id = 'sup-kruse-pigeon-pellets';
update supplies set quantity = 9, reorder_level = 4, price = 14.8 where id = 'sup-equine-pellets';
update supplies set quantity = 3, reorder_level = 1, price = 24 where id = 'sup-meal-worms';
insert into supplies (id, name, category, brand, unit, description, quantity, reorder_level, price, vendor_id, notes) values
  ('sup-demo-disinfectant', 'F10 disinfectant concentrate', 'Cleaning', 'Health & Hygiene', 'bottle', 'Veterinary disinfectant for cages, perches and surfaces. Dilute as directed.', 1, 2, 28.5, 'c-demo-vet', 'Running low — reorder.'),
  ('sup-demo-gloves', 'Nitrile gloves, box of 100', 'Cleaning', 'Generic', 'box', '', 4, 2, 11.99, null, ''),
  ('sup-demo-paper', 'Cage liner paper, roll', 'Cleaning', 'Generic', 'roll', '', 12, 4, 6.5, 'c-demo-kruse', ''),
  ('sup-demo-probiotic', 'Avian probiotic powder', 'Medical', 'Harrison’s', 'jar', 'Added to food after treatment.', 2, 1, 19.95, 'c-demo-vet', ''),
  ('sup-demo-vetwrap', 'Vet wrap and styptic powder kit', 'Medical', 'Generic', 'kit', 'First-aid for broken blood feathers and nails.', 2, 1, 9.5, null, '')
on conflict (account_id, id) do nothing;
-- Feeding plans (the whole aviary, then the quarantine room) and cleaning jobs
insert into care_items (id, target_type, target_id, supply_id, label, amount, meal_time, plan) values
  ('care-demo-01', 'aviary', 'main', 'sup-kruse-ar-pellets', '', '¼ cup per pair', 'Morning', 'feeding'),
  ('care-demo-02', 'aviary', 'main', 'sup-kruse-sprout-mix', '', '1 tbsp per cage', 'Evening', 'feeding'),
  ('care-demo-03', 'aviary', 'main', null, 'Fresh water', 'refill', 'Morning', 'feeding'),
  ('care-demo-04', 'room', 'room-demo-nursery', 'sup-zupreme-pellets', '', 'ad lib', 'Morning', 'feeding')
on conflict (account_id, id) do nothing;
insert into care_items (id, target_type, target_id, label, amount, meal_time, plan, repeat, weekdays, start_date, assigned_to, supply_ids) values
  ('care-demo-11', 'aviary', 'main', 'Change cage paper', '1 sheet per cage', 'Morning', 'cleaning', 'Daily', '', (current_date - 30), 'u-demo-dev', 'sup-demo-paper'),
  ('care-demo-12', 'building', 'F2', 'Scrub and disinfect perches', '1 capful per gallon', 'Morning', 'cleaning', 'Weekly', '1', (current_date - 21), 'u-demo-joy', 'sup-demo-disinfectant,sup-demo-gloves'),
  ('care-demo-13', 'room', 'room-demo-quarantine', 'Deep clean quarantine room', '', 'Anytime', 'cleaning', 'Monthly', '', (current_date - 20), 'u-demo-marta', 'sup-demo-disinfectant,sup-demo-gloves')
on conflict (account_id, id) do nothing;
-- Tasks
insert into tasks (id, title, kind, notes, start_date, time_of_day, repeat, every, weekdays, assigned_to) values
  ('task-demo-01', 'Morning feeding round', 'Feeding', '', (current_date - 60), 'Morning', 'Daily', null, '', 'u-demo-dev'),
  ('task-demo-02', 'Evening feeding round', 'Feeding', '', (current_date - 60), 'Evening', 'Daily', null, '', 'u-demo-joy'),
  ('task-demo-03', 'Build a shipping crate for the Tucson order', 'Maintenance', 'Cut the plywood and line it with cage paper.', (current_date - -2), 'Anytime', 'None', null, '', 'u-demo-dev'),
  ('task-demo-04', 'Repair the leaking roof over F3', 'Maintenance', '', (current_date - -5), 'Anytime', 'None', null, '', 'u-demo-marta'),
  ('task-demo-05', 'Order feed from Valley Feed & Grain', 'General', 'Check the sprout mix — it is running low.', (current_date - 0), 'Anytime', 'Monthly', null, '', 'u-demo-marta')
on conflict (account_id, id) do nothing;
insert into task_done (id, task_id, on_date, sub_key, done_by) values
  ('done-demo-01', 'task-demo-01', (current_date - 1), '', 'u-demo-dev'),
  ('done-demo-02', 'task-demo-02', (current_date - 1), '', 'u-demo-joy'),
  ('done-demo-03', 'task-demo-01', (current_date - 2), '', 'u-demo-dev')
on conflict (account_id, id) do nothing;
-- Calendar
insert into events (id, title, kind, place, start_date, end_date, all_day, start_time, end_time, contact_id, assigned_to, notes) values
  ('ev-demo-01', 'Giardia retest — Indian Ringneck male', 'Vet appointment', 'Fallbrook Avian & Exotic', (current_date - -6), null, 'false', '10:30', '11:00', 'c-demo-vet', 'u-demo-marta', 'Bring a fresh sample.'),
  ('ev-demo-02', 'Spring Aviculture Expo', 'Show', 'Riverside Convention Center', (current_date - -24), (current_date - -25), 'true', '', '', null, 'u-demo-marta', 'Entering two conures.'),
  ('ev-demo-03', 'Aviary tour — Lindqvist family', 'Tour', 'Home Farm', (current_date - -3), null, 'false', '14:00', '15:30', 'c-demo-lindqvist', 'u-demo-marta', 'Show the Sun Conure pair.')
on conflict (account_id, id) do nothing;
insert into event_links (id, event_id, target_type, target_id) values
  ('evl-demo-01', 'ev-demo-01', 'bird', 'b-got-092'),
  ('evl-demo-02', 'ev-demo-03', 'contact', 'c-demo-lindqvist')
on conflict (account_id, id) do nothing;
-- Give the pedigree birds band numbers so the list looks lived-in
update birds set band = 'GOT ' || lpad(regexp_replace(id, '[^0-9]', '', 'g'), 3, '0') where id like 'b-got-%' and band is null;
-- A small Silkie flock: two adults, a new hatch with no bands yet, and the coop they live in
insert into buildings (account_id, code, nickname, description, location_id) values ('demo', 'C1', 'Coop yard', 'Chickens (demo)', 'loc-demo-home') on conflict (account_id, code) do nothing;
insert into cages (account_id, code, building_code, description) values ('demo', 'C1-01', 'C1', 'Silkie breeding coop'), ('demo', 'C1-02', 'C1', 'Brooder') on conflict (account_id, code) do nothing;
insert into birds (account_id, id, band, name, sex, species, species_code, subspecies, mutation, hatch_date, status, cage, mother_id, father_id, notes)
select 'demo', v.id, v.band, v.name, v.sex, 'Chicken', s.code, 'Silkie', v.mutation, current_date - v.age, 'Available', v.cage, v.mother_id, v.father_id, v.notes
from (values
  ('b-demo-chk-01', 'SLK-101', 'Pearl', 'Female', 'White', 700, 'C1-01', null, null, 'Best of Breed at the county show.'),
  ('b-demo-chk-02', 'SLK-102', 'Duke', 'Male', 'White', 620, 'C1-01', null, null, 'Naked neck carrier.'),
  ('b-demo-chk-03', null, 'Chick 1', 'Unsexed', 'White', 12, 'C1-02', 'b-demo-chk-01', 'b-demo-chk-02', 'Hatched together; no band yet.'),
  ('b-demo-chk-04', null, 'Chick 2', 'Unsexed', 'White', 12, 'C1-02', 'b-demo-chk-01', 'b-demo-chk-02', ''),
  ('b-demo-chk-05', null, 'Chick 3', 'Unsexed', 'Naked neck', 12, 'C1-02', 'b-demo-chk-01', 'b-demo-chk-02', ''),
  ('b-demo-chk-06', null, 'Chick 4', 'Unsexed', 'White', 12, 'C1-02', 'b-demo-chk-01', 'b-demo-chk-02', '')
) as v(id, band, name, sex, mutation, age, cage, mother_id, father_id, notes)
join (select code from species where scientific_name = 'Gallus gallus' limit 1) s on true
on conflict (account_id, id) do nothing;
insert into show_results (account_id, id, bird_id, kind, event, date, location, category, placement, entries)
values ('demo', 'sr-demo-chk-01', 'b-demo-chk-01', 'Show', 'County Poultry Show', (current_date - 90), 'Fairgrounds', 'Bantam · Feather Legged · Silkie · White · Hen', 'Best of Breed', 14) on conflict (account_id, id) do nothing;
insert into health_records (account_id, id, bird_id, type, date, provider, notes, disease, result) values
  ('demo', 'hr-demo-chk-01', 'b-demo-chk-01', 'Disease Test', (current_date - 200), 'State Poultry Lab', '', 'Pullorum-Typhoid', 'Negative'),
  ('demo', 'hr-demo-chk-02', 'b-demo-chk-02', 'Disease Test', (current_date - 400), 'State Poultry Lab', '', 'Pullorum-Typhoid', 'Negative')
on conflict (account_id, id) do nothing;

select set_config('app.account_id', '', false);

-- PART 1 of 3 — sql 028 to 037 (menus, phones, cleaning plans, health tests, awards…)
-- Paste this whole file into the Neon SQL editor and run it. Every step is safe to run again.
--
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

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

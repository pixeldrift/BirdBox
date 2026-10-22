-- Run once in the Neon SQL editor (after 022_supplies.sql). Care plans: what each cage, room, building,
-- location, bird — or the whole aviary — is fed and given, how much and when, linked to your Supplies.
-- The most specific plan wins: a bird's own plan overrides its cage's, a cage's overrides its room's, and so on
-- up to the aviary-wide plan.

create table if not exists care_items (
  id text primary key,
  target_type text not null check (target_type in ('aviary', 'location', 'building', 'room', 'cage', 'bird')),
  target_id text not null,
  supply_id text,
  label text not null default '',
  amount text not null default '',
  meal_time text not null default 'Anytime',
  notes text not null default ''
);
create index if not exists care_items_target_idx on care_items (target_type, target_id);
create index if not exists care_items_supply_idx on care_items (supply_id);

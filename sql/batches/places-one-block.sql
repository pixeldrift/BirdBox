-- PLACES — one statement. Paste ALL of this file into the Neon SQL editor and run it once. Safe to run again.
-- Your locations, buildings, rooms and cages become "places" (any place can be inside any other, and you choose the kinds).
-- Nothing is deleted: the old tables stay as they are. Check it afterwards with the query at the bottom.
do $places$
begin
-- Run once in the Neon SQL editor (after 039). Places: ONE kind of thing replaces Location / Building / Room / Cage. Every place has a
-- name, a type you choose (Building, Room, Cage, Coop, Box, Shelf… or your own) and a parent — any place can sit inside any other.
-- Your existing locations, buildings, rooms and cages are carried over with their birds, plans and photos. The old tables are left
-- untouched (nothing is deleted), the app just stops using them. Plain statements only; safe to run again.

create table if not exists places (
  account_id text not null default nullif(current_setting('app.account_id', true), ''),
  id text not null,
  name text not null,
  type text not null default 'Cage',
  parent_id text,
  description text not null default '',
  is_demo boolean not null default false,
  primary key (account_id, id)
);
create index if not exists places_parent_idx on places (account_id, parent_id);
create table if not exists place_types (
  account_id text not null default nullif(current_setting('app.account_id', true), ''),
  id text not null,
  name text not null,
  sort integer not null default 0,
  is_demo boolean not null default false,
  primary key (account_id, id)
);

-- links to a place are now all of one kind ('place'), whatever sort of place it is
alter table care_items drop constraint if exists care_items_target_type_check;
alter table care_items add constraint care_items_target_type_check check (target_type in ('aviary', 'location', 'building', 'room', 'cage', 'place', 'bird'));
alter table media_links drop constraint if exists media_links_target_type_check;
alter table media_links add constraint media_links_target_type_check check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact', 'aviary', 'location', 'building', 'room', 'cage', 'place', 'supply', 'award'));

-- (the tables are locked to one account at a time; for this one-off carry-over, switch that off for a moment)
alter table places no force row level security;
alter table locations no force row level security;
alter table buildings no force row level security;
alter table rooms no force row level security;
alter table cages no force row level security;
alter table care_items no force row level security;
alter table media_links no force row level security;
alter table tasks no force row level security;
alter table event_links no force row level security;

insert into places (account_id, id, name, type, parent_id, description, is_demo)
  select account_id, id, name, 'Location', null, description, is_demo from locations
  on conflict (account_id, id) do nothing;
insert into places (account_id, id, name, type, parent_id, description, is_demo)
  select account_id, 'bld-' || code, 'Building ' || nickname, 'Building', location_id, description, is_demo from buildings
  on conflict (account_id, id) do nothing;
insert into places (account_id, id, name, type, parent_id, description, is_demo)
  select account_id, id, name, 'Room', coalesce('bld-' || building_code, location_id), description, is_demo from rooms
  on conflict (account_id, id) do nothing;
insert into places (account_id, id, name, type, parent_id, description, is_demo)
  select c.account_id, c.code, c.code, 'Cage',
    coalesce(c.room_id, 'bld-' || c.building_code, (select 'bld-' || b.code from buildings b where b.account_id = c.account_id and b.code = split_part(c.code, '-', 1))),
    c.description, c.is_demo from cages c
  on conflict (account_id, id) do nothing;

update care_items set target_id = 'bld-' || target_id where target_type = 'building' and target_id not like 'bld-%';
update care_items set target_type = 'place' where target_type in ('location', 'building', 'room', 'cage');
update media_links set target_id = 'bld-' || target_id where target_type = 'building' and target_id not like 'bld-%';
update media_links set target_type = 'place' where target_type in ('location', 'building', 'room', 'cage');
update tasks set target_id = 'bld-' || target_id where target_type = 'building' and target_id not like 'bld-%';
update tasks set target_type = 'place' where target_type in ('location', 'building', 'room', 'cage');
update event_links set target_id = 'bld-' || target_id where target_type = 'building' and target_id not like 'bld-%';
update event_links set target_type = 'place' where target_type in ('location', 'building', 'room', 'cage');

alter table locations force row level security;
alter table buildings force row level security;
alter table rooms force row level security;
alter table cages force row level security;
alter table care_items force row level security;
alter table media_links force row level security;
alter table tasks force row level security;
alter table event_links force row level security;

alter table places enable row level security;
alter table places force row level security;
drop policy if exists tenant_isolation on places;
create policy tenant_isolation on places using (account_id = nullif(current_setting('app.account_id', true), '')) with check (account_id = nullif(current_setting('app.account_id', true), ''));
drop policy if exists demo_read on places;
create policy demo_read on places for select using (account_id = 'demo' and current_setting('app.loading_demo', true) = 'on');
grant select, insert, update, delete on places to birdbox_app;
alter table place_types enable row level security;
alter table place_types force row level security;
drop policy if exists tenant_isolation on place_types;
create policy tenant_isolation on place_types using (account_id = nullif(current_setting('app.account_id', true), '')) with check (account_id = nullif(current_setting('app.account_id', true), ''));
drop policy if exists demo_read on place_types;
create policy demo_read on place_types for select using (account_id = 'demo' and current_setting('app.loading_demo', true) = 'on');
grant select, insert, update, delete on place_types to birdbox_app;

end
$places$;

-- Check (run on its own afterwards; places should be more than zero, and "still pointing at the old kinds" should be 0):
-- select (select count(*) from places) as places, (select count(*) from care_items where target_type in ('location', 'building', 'room', 'cage')) as still_pointing_at_the_old_kinds;

-- Run once in the Neon SQL editor (after 017_navigation.sql).
-- 1. "My Aviary": one master record at the top of everything — your aviary's name and optional
--    public details (address, phone, website, socials). Locations, buildings, rooms and cages all
--    sit under it. Edit it any time under Account > Settings.
-- 2. Rooms: an optional level between Building and Cage (Location > Building > Room > Cage).
--    A cage can still sit directly in a building, or nowhere at all.
-- 3. Photos for locations, buildings, rooms, cages and the aviary itself, the same way birds have them.

create table if not exists aviary (
  id text primary key,
  name text not null default 'My Aviary',
  description text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  socials text not null default ''
);
insert into aviary (id, name) values ('main', 'My Aviary') on conflict (id) do nothing;

create table if not exists rooms (
  id text primary key,
  name text not null,
  description text not null default '',
  building_code text,
  location_id text
);

alter table cages add column if not exists room_id text;

alter table media_links drop constraint if exists media_links_target_type_check;
alter table media_links add constraint media_links_target_type_check
  check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact', 'aviary', 'location', 'building', 'room', 'cage'));

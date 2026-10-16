-- Run once in the Neon SQL editor.
-- Where birds live, as a hierarchy you can use as much or as little of as you like:
--   Location (a site — "Home farm", "Fallbrook")  >  Building (F1, F2…)  >  Cage (F2-001)  >  birds
-- Every level is optional. A small breeder can ignore locations entirely; a cage doesn't need a building.
-- A bird still points at its cage by the cage's code (birds.cage), so nothing about birds changes.

create table if not exists locations (
  id text primary key,
  name text not null,
  description text not null default ''
);

alter table buildings add column if not exists location_id text;

create table if not exists cages (
  code text primary key,
  building_code text,
  description text not null default ''
);

-- Turn the cage codes already on your birds into real cage records, filed under the building
-- whose code matches the start of the cage code (F2-001 -> F2).
insert into cages (code, building_code)
select c.cage, b.code
from (select distinct cage from birds where cage is not null and btrim(cage) <> '') c
left join buildings b on b.code = split_part(c.cage, '-', 1)
on conflict (code) do nothing;

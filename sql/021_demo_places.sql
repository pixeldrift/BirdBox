-- Run once in the Neon SQL editor (after 018_aviary_rooms.sql). OPTIONAL — a few demo locations, buildings
-- and rooms so you can preview the Caging explorer (Browse / Tree / All). Remove with 021_remove_demo_places.sql.
-- It only files the buildings and cages you already have; it doesn't invent cages or birds.

insert into locations (id, name, description) values
  ('loc-demo-home', 'Home Farm', 'Main breeding site (demo)'),
  ('loc-demo-ranch', 'Fallbrook Ranch', 'Second site (demo)')
on conflict (id) do nothing;

-- Some buildings go on a location; the rest are left unfiled on purpose, to show that case.
update buildings set location_id = 'loc-demo-home' where code in ('F1', 'F2', 'F3') and location_id is null;
update buildings set location_id = 'loc-demo-ranch' where code in ('F5', 'F6') and location_id is null;

-- Rooms: inside a building, and one straight on a location (no building) to show the level is optional.
insert into rooms (id, name, description, building_code, location_id) values
  ('room-demo-flight', 'Flight Room', 'Large flight cages (demo)', 'F2', null),
  ('room-demo-quarantine', 'Quarantine', 'New arrivals (demo)', 'F1', null),
  ('room-demo-nursery', 'Nursery', 'Hand-feeding and weaning (demo)', 'F6', null),
  ('room-demo-hatchery', 'Hatchery', 'Incubators (demo) — straight on the location, no building', null, 'loc-demo-ranch')
on conflict (id) do nothing;

-- Put a couple of existing cages into rooms.
insert into cages (code, room_id)
select distinct cage, 'room-demo-flight' from birds where cage in ('F2-001', 'F2-002')
on conflict (code) do update set room_id = excluded.room_id;
insert into cages (code, room_id)
select distinct cage, 'room-demo-quarantine' from birds where cage in ('F1-012')
on conflict (code) do update set room_id = excluded.room_id;

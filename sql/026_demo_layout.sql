-- Run once in the Neon SQL editor. OPTIONAL — a demo aviary layout so you can see the whole Caging explorer with
-- real-looking content: two locations, five buildings, a few rooms, and cages holding the Game of Thrones test birds
-- (run 020_test_pedigree.sql first for the birds). Families are kept together, one species per building.
-- Safe to re-run, and self-contained (creates any missing places tables). Undo with 026_remove_demo_layout.sql.

create table if not exists locations (id text primary key, name text not null, description text not null default '');
create table if not exists buildings (code text primary key, nickname text not null, description text not null default '');
alter table buildings add column if not exists location_id text;
create table if not exists rooms (id text primary key, name text not null, description text not null default '', building_code text, location_id text);
create table if not exists cages (code text primary key, building_code text, description text not null default '');
alter table cages add column if not exists room_id text;

insert into locations (id, name, description) values
  ('loc-demo-home', 'Home Farm', 'Main breeding site (demo)'),
  ('loc-demo-ranch', 'Fallbrook Ranch', 'Second site (demo)')
on conflict (id) do nothing;

-- Buildings (kept if you already have them; added if not).
insert into buildings (code, nickname, description) values
  ('F1', '1', 'Demo building'), ('F2', '2', 'Demo building'), ('F3', '3', 'Demo building'), ('F5', '5', 'Demo building'), ('F6', '6', 'Demo building')
on conflict (code) do nothing;
update buildings set location_id = 'loc-demo-home' where code in ('F1', 'F2', 'F3') and location_id is null;
update buildings set location_id = 'loc-demo-ranch' where code in ('F5', 'F6') and location_id is null;

insert into rooms (id, name, description, building_code, location_id) values
  ('room-demo-flight', 'Flight Room', 'Large flight cages (demo)', 'F2', null),
  ('room-demo-quarantine', 'Quarantine', 'New arrivals (demo)', 'F1', null),
  ('room-demo-nursery', 'Nursery', 'Hand-feeding and weaning (demo)', 'F6', null),
  ('room-demo-hatchery', 'Hatchery', 'Incubators (demo) — straight on the location, no building', null, 'loc-demo-ranch')
on conflict (id) do nothing;

-- Cages for the test birds.
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
on conflict (code) do nothing;

-- Put the test birds in them (only birds that have no cage yet).
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

-- And file a few of your existing cages into rooms, if they exist.
insert into cages (code, room_id) select distinct cage, 'room-demo-quarantine' from birds where cage in ('F1-012') on conflict (code) do update set room_id = coalesce(cages.room_id, excluded.room_id);

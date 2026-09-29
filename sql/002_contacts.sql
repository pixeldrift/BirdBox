-- Run this once in the Neon SQL editor (or via psql) against your database.
-- Creates the contacts table and seeds it with the same records that used to
-- live in js/data/contacts-sample.js. Safe to re-run: seed inserts are
-- skipped if the table already has rows.

create table if not exists contacts (
  id text primary key,
  name text not null,
  company text not null default '',
  type text not null,
  city text not null default '',
  state text not null default '',
  email text not null default '',
  phone text not null default '',
  birds_owned text[] not null default '{}',
  birds_purchasing text[] not null default '{}',
  notes text not null default ''
);

create index if not exists contacts_type_idx on contacts (type);

insert into contacts (id, name, company, type, city, state, email, phone, birds_owned, birds_purchasing, notes)
select * from (values
  ('c-001', 'Steve Duncan', 'Avian Resources', 'Breeder', 'Fallbrook', 'CA', 'steve@avianresources.com', '', array[]::text[], array[]::text[], 'Primary source breeder — most baby birds are acquired from here.'),
  ('c-002', 'Charles Hutchinson', '', 'Pet Owner', 'Reno', 'NV', 'mrclh2jr@yahoo.com', '(775) 433-5460', array['AR11101CA'], array[]::text[], ''),
  ('c-003', 'Karina Gutierrez', '', 'Pet Owner', '', '', '', '', array['AR13002CA'], array[]::text[], ''),
  ('c-004', 'Brock Stone', '', 'Pet Owner', 'Glen Burnie', 'MD', '', '(831) 236-5680', array[]::text[], array['AR11103CA'], ''),
  ('c-005', 'Michelle Hua', '', 'Pet Owner', '', '', '', '', array[]::text[], array[]::text[], ''),
  ('c-006', 'Heather Escobar', '', 'Pet Owner', '', '', '', '', array[]::text[], array[]::text[], ''),
  ('c-007', 'A&E Cage Company', 'A&E Cage Company', 'Vendor', 'Burlington', 'NJ', 'info@aecageco.com', '(800) 631-7387', array[]::text[], array[]::text[], 'Cages and supplies.'),
  ('c-008', 'Avian Biotech International', 'Avian Biotech International', 'Vendor', 'Tallahassee', 'FL', '', '(850) 386-1145', array[]::text[], array[]::text[], 'DNA sexing and testing.'),
  ('c-009', 'West Branch Aviary', 'West Branch Aviary', 'Breeder', '', '', '', '', array[]::text[], array[]::text[], ''),
  ('c-010', 'Nelson Ricardo', '', 'Pet Owner', '', '', '', '', array[]::text[], array['AR12002CA'], ''),
  ('c-011', 'Bird Fever', 'Bird Fever', 'Store', 'Indianapolis', 'IN', '', '(317) 845-7823', array[]::text[], array[]::text[], ''),
  ('c-012', 'Denise Albert', '', 'Pet Owner', '', '', '', '', array[]::text[], array[]::text[], '')
) as seed(id, name, company, type, city, state, email, phone, birds_owned, birds_purchasing, notes)
where not exists (select 1 from contacts limit 1);

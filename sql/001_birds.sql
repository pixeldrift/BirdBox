-- Run this once in the Neon SQL editor (or via psql) against your database.
-- Creates the birds table and seeds it with the same records that used to
-- live in js/data/birds-sample.js, so the app looks the same right after
-- migration. Safe to re-run: seed inserts are skipped if the table already
-- has rows.

create table if not exists birds (
  id text primary key,
  band text not null,
  name text,
  sex text not null,
  species text not null,
  subspecies text,
  mutation text,
  hatch_date date,
  status text not null,
  cage text,
  mother_id text,
  father_id text,
  paired_id text,
  cost numeric,
  price numeric,
  registry_public boolean not null default false,
  notes text not null default ''
);

create index if not exists birds_status_idx on birds (status);
create index if not exists birds_cage_idx on birds (cage);

insert into birds (id, band, name, sex, species, subspecies, mutation, hatch_date, status, cage, mother_id, father_id, paired_id, cost, price, registry_public, notes)
select * from (values
  ('AR10001CA', 'AR 10001 CA', 'Sunny', 'Male', 'Conure', 'Sun', null, date '2019-05-01', 'Available', 'F2-001', null, null, 'AR10002CA', 300, 800, true, 'Founding pair — proven breeder male.'),
  ('AR10002CA', 'AR 10002 CA', 'Daisy', 'Female', 'Conure', 'Sun', null, date '2019-06-15', 'Available', 'F2-001', null, null, 'AR10001CA', 300, 800, true, 'Founding pair — proven breeder female.'),
  ('AR11101CA', 'AR 11101 CA', null, 'Male', 'Conure', 'Sun', null, date '2021-02-24', 'Sold', null, 'AR10002CA', 'AR10001CA', null, 0, 600, false, ''),
  ('AR11102CA', 'AR 11102 CA', null, 'Female', 'Conure', 'Sun', null, date '2021-02-24', 'Available', 'F2-002', 'AR10002CA', 'AR10001CA', null, 0, 600, true, ''),
  ('AR11103CA', 'AR 11103 CA', null, 'Male', 'Conure', 'Sun', 'Red Factor', date '2022-04-05', 'Reserved', 'F2-003', 'AR10002CA', 'AR10001CA', null, 0, 1500, false, 'Reserved for Brock Stone.'),
  ('AR11104CA', 'AR 11104 CA', null, 'Unsexed', 'Conure', 'Sun', null, date '2022-04-05', 'Deceased', null, 'AR10002CA', 'AR10001CA', null, 0, null, false, 'Passed shortly after fledging.'),
  ('AR12001CA', 'AR 12001 CA', 'Kiwi', 'Male', 'Conure', 'Green-Cheeked', 'Mooncheek', date '2020-03-11', 'Available', 'F1-012', null, null, 'AR12002CA', 250, 600, false, ''),
  ('AR12002CA', 'AR 12002 CA', null, 'Female', 'Conure', 'Green-Cheeked', 'Pineapple', date '2020-04-02', 'Reserved', 'F1-012', null, null, 'AR12001CA', 225, 600, false, ''),
  ('AR12101CA', 'AR 12101 CA', null, 'Female', 'Conure', 'Green-Cheeked', 'Mooncheek, Pineapple', date '2023-01-20', 'Available', 'F1-013', 'AR12002CA', 'AR12001CA', null, 0, 900, false, ''),
  ('AR13001CA', 'AR 13001 CA', null, 'Male', 'Parakeet', 'Indian Ring-Necked', 'Blue', date '2021-07-19', 'Available', 'FLN', null, null, null, 150, 400, false, ''),
  ('AR13002CA', 'AR 13002 CA', null, 'Female', 'Parakeet', 'Indian Ring-Necked', 'Albino', date '2021-08-02', 'Sold', null, null, null, null, 150, 450, false, ''),
  ('AR14001CA', 'AR 14001 CA', 'Coco', 'Female', 'Cockatoo', 'Umbrella', null, date '2018-02-14', 'Available', 'F5-001', null, null, null, 1800, 2500, true, 'Hand-tame, does well with visitors.'),
  ('AR14002CA', 'AR 14002 CA', 'Rio', 'Male', 'Macaw', 'Blue and Gold', null, date '2017-11-30', 'Reserved', 'F6-002', null, null, null, 2200, 3200, false, 'Reserved — deposit received.'),
  ('AR15001CA', 'AR 15001 CA', null, 'Unsexed', 'Amazon', 'Yellow-Naped', null, date '2015-01-01', 'Deceased', null, null, null, null, 900, null, false, ''),
  ('AR15002CA', 'AR 15002 CA', 'Einstein', 'Male', 'African Grey', 'Congo', null, date '2016-09-09', 'Available', 'F3-002', null, null, null, 1200, 2000, true, 'Excellent talker.')
) as seed(id, band, name, sex, species, subspecies, mutation, hatch_date, status, cage, mother_id, father_id, paired_id, cost, price, registry_public, notes)
where not exists (select 1 from birds limit 1);

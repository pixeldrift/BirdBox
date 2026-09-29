-- Run once against Neon. Creates the buildings table and seeds it with the
-- rows that used to live in js/data/buildings-sample.js.

create table if not exists buildings (
  code text primary key,
  nickname text not null,
  description text not null default ''
);

insert into buildings (code, nickname, description)
select * from (values
  ('F1', '1', 'Top of the hill'),
  ('F2', '2', 'Up the hill'),
  ('F3', '3', 'Up the hill'),
  ('F4', '4', 'Up the hill'),
  ('F5', '5', 'Up the hill'),
  ('F6', '6', 'Base of the hill'),
  ('FD', 'Driveway', 'Between the two driveways'),
  ('FUN', 'Upper Nursery', 'Steve''s Garage'),
  ('FLN', 'Lower Nursery', 'Guesthouse Garage')
) as seed(code, nickname, description)
where not exists (select 1 from buildings limit 1);

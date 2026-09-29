-- Run once against Neon. Creates the waybills table and seeds it with the
-- records that used to live in js/data/waybills-sample.js.

create table if not exists waybills (
  id text primary key,
  waybill_number text not null default '',
  direction text not null,
  date date not null,
  client_id text,
  bird_ids text[] not null default '{}',
  departing_airport text not null,
  arriving_airport text not null,
  cost numeric,
  notes text not null default ''
);

create index if not exists waybills_date_idx on waybills (date);

insert into waybills (id, waybill_number, direction, date, client_id, bird_ids, departing_airport, arriving_airport, cost, notes)
select * from (values
  ('wb-001', '006-79736145', 'Outgoing', date '2021-09-10', 'c-011', array['AR13001CA'], 'LAX', 'IND', 95, ''),
  ('wb-002', '006-80115781', 'Outgoing', date '2021-09-06', 'c-003', array['AR13002CA'], 'LAX', 'DEN', 110, ''),
  ('wb-003', '006-71439336', 'Outgoing', date '2021-08-22', 'c-002', array['AR11101CA'], 'LAX', 'RNO', 90, ''),
  ('wb-004', '006-72287025', 'Incoming', date '2016-10-05', 'c-001', array['AR15002CA'], 'SAN', 'LAX', 120, 'Received from source breeder.'),
  ('wb-005', '', 'Outgoing', date '2022-05-05', null, array['AR14002CA'], 'LAX', 'ORD', 175, 'Awaiting buyer confirmation before booking the flight.'),
  ('wb-006', '', 'Outgoing', date '2022-05-20', 'c-004', array['AR11103CA'], 'LAX', 'BWI', 130, 'Scheduled once final balance is paid.')
) as seed(id, waybill_number, direction, date, client_id, bird_ids, departing_airport, arriving_airport, cost, notes)
where not exists (select 1 from waybills limit 1);

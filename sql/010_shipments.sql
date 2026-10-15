-- Run once in the Neon SQL editor (after 009_waybills_status.sql).
-- Shipments no longer have to be flights: record how it travelled, who handled it, and as much
-- or as little handoff detail as you remember. Photos, receipts and waybill copies are stored
-- with the shipment.

alter table waybills add column if not exists method text not null default '';
alter table waybills add column if not exists carrier text not null default '';

-- "Sometimes we just want to record that we shipped something" — a date is now optional.
alter table waybills alter column date drop not null;
alter table waybills alter column departing_airport set default '';
alter table waybills alter column arriving_airport set default '';

-- Existing records that name 3-letter airport codes were air shipments.
update waybills set method = 'Air cargo'
where method = '' and departing_airport ~ '^[A-Z]{3}$' and arriving_airport ~ '^[A-Z]{3}$';

create table if not exists waybill_files (
  id text primary key,
  waybill_id text not null references waybills(id) on delete cascade,
  kind text not null check (kind in ('photo', 'receipt', 'waybill')),
  filename text not null default '',
  content_type text not null,
  size integer not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create index if not exists waybill_files_waybill_idx on waybill_files (waybill_id);

-- Run once in the Neon SQL editor. Records that a bird changed hands without a shipment —
-- a local pick up, a local meet, a delivery — or any handoff you want on the bird's own record.
-- Possession moving does not automatically change ownership (boarding, breeder loans…), so
-- ownership stays on the contact (contacts.birds_owned) and is only changed when you say so.

create table if not exists bird_transfers (
  id text primary key,
  bird_id text not null,
  contact_id text,
  direction text not null check (direction in ('Out', 'In')),
  method text not null,
  date date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bird_transfers_bird_idx on bird_transfers (bird_id);

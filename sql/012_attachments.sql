-- Run once in the Neon SQL editor (after 010_shipments.sql).
-- One place for every uploaded file in BirdBox: bird photos, health records (DNA certificates,
-- immunizations…), shipment photos / receipts / waybills, and invoices / receipts on accounting
-- entries. Shipment files saved earlier are carried over.

create table if not exists attachments (
  id text primary key,
  owner_type text not null check (owner_type in ('bird', 'health', 'waybill', 'transaction')),
  owner_id text not null,
  kind text not null,
  filename text not null default '',
  content_type text not null,
  size integer not null,
  data bytea not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists attachments_owner_idx on attachments (owner_type, owner_id);

do $$
begin
  if to_regclass('public.waybill_files') is not null then
    insert into attachments (id, owner_type, owner_id, kind, filename, content_type, size, data, created_at)
    select id, 'waybill', waybill_id, kind, filename, content_type, size, data, created_at from waybill_files
    on conflict (id) do nothing;
    drop table waybill_files;
  end if;
end $$;

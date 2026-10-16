-- Run once in the Neon SQL editor (after 010_shipments.sql).
-- A media library: every uploaded file — bird photos, receipts, waybills, invoices, DNA
-- certificates and other documents — is its own record, and a file is LINKED to the things it
-- belongs to (birds, health records, shipments, accounting entries, contacts) rather than owned by
-- one of them. The same receipt can be linked to an accounting entry and a shipment; a file can be
-- found in the library on its own, searched by what it's linked to, and re-used.
--
-- Shipment files saved earlier (waybill_files from 010) are carried over.

create table if not exists media (
  id text primary key,
  type text not null check (type in ('photo', 'receipt', 'waybill', 'invoice', 'document')),
  filename text not null default '',
  title text not null default '',
  content_type text not null,
  size integer not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create table if not exists media_links (
  media_id text not null references media(id) on delete cascade,
  target_type text not null check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact')),
  target_id text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (media_id, target_type, target_id)
);

create index if not exists media_links_target_idx on media_links (target_type, target_id);

do $$
begin
  if to_regclass('public.waybill_files') is not null then
    insert into media (id, type, filename, content_type, size, data, created_at)
    select id, kind, filename, content_type, size, data, created_at from waybill_files
    on conflict (id) do nothing;
    insert into media_links (media_id, target_type, target_id, created_at)
    select id, 'waybill', waybill_id, created_at from waybill_files
    on conflict do nothing;
    drop table waybill_files;
  end if;
end $$;

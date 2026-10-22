-- Run once in the Neon SQL editor (after 021 / 019 …). Supplies: feed, supplements, cleaning products, medical
-- items and equipment you keep on hand — what it is, how much you have, when to reorder, who sells it,
-- and photos. Care plans (what each cage or bird is fed) will link to these.

create table if not exists supplies (
  id text primary key,
  name text not null,
  category text not null default 'Feed',
  brand text not null default '',
  description text not null default '',
  unit text not null default '',
  quantity numeric,
  reorder_level numeric,
  price numeric,
  vendor_id text,
  source text not null default '',
  notes text not null default ''
);
create index if not exists supplies_category_idx on supplies (category);

-- Photos can be linked to supplies.
alter table media_links drop constraint if exists media_links_target_type_check;
alter table media_links add constraint media_links_target_type_check
  check (target_type in ('bird', 'health', 'waybill', 'transaction', 'contact', 'aviary', 'location', 'building', 'room', 'cage', 'supply'));

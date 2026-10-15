-- Species reference table, keyed by the eBird / Clements species code — the same code Birds of
-- the World uses in its URLs (https://birdsoftheworld.org/bow/species/<code>/cur/introduction).
-- Run this once in the Neon SQL editor, then load the data with `npm run seed:species`
-- (scripts/seed-species.js pulls the taxonomy from eBird; it's ~11k rows, too big to paste).
--
-- Storage is not the concern at this size; what the picker *shows* is. `aviculture` marks the
-- species a breeder is likely to keep (rules in scripts/seed-species.js, editable), and
-- `aviculture_override` lets a human correct any single species without the next seed undoing it.

create extension if not exists pg_trgm;

-- One normalisation used by every name search and match (mirrored in api/_lib/species.js):
-- lower-case; hyphens, periods and apostrophes dropped; "&" -> "and"; grey -> gray.
create or replace function bb_norm(t text) returns text
language sql immutable as $$
  select btrim(regexp_replace(
    replace(replace(replace(replace(replace(replace(replace(lower(t), '-', ' '), '''', ''), '’', ''), '.', ''), '&', ' and '), 'grey', 'gray'), '  ', ' '),
    '\s+', ' ', 'g'))
$$;

create table if not exists species (
  code text primary key,
  common_name text not null,
  -- The name shown in labels when it differs from eBird's common name: US aviculture usage
  -- ("Sun Conure", "African Grey", "Quaker Parrot"). Null means use common_name.
  display_name text,
  scientific_name text not null,
  order_name text not null,
  family_code text,
  family_name text,
  family_scientific text,
  taxon_order numeric not null,
  taxonomy_version text not null,
  aviculture boolean not null default false,
  aviculture_override boolean,
  popularity integer not null default 0
);

alter table species add column if not exists display_name text;

create index if not exists species_aviculture_idx on species (aviculture);
create index if not exists species_family_idx on species (family_code);

-- Alternate names: trade names ("Sun Conure"), regional spellings ("Grey" vs "Gray"), older names
-- after a split or lump, and so on. Taxonomies disagree and names vary, so these are data, not
-- an afterthought. Scientific-name synonyms go here too (kind = 'scientific_synonym').
create table if not exists species_names (
  id serial primary key,
  species_code text not null references species(code) on delete cascade,
  name text not null,
  kind text not null default 'common'
    check (kind in ('common', 'trade', 'regional', 'historical', 'scientific_synonym', 'other')),
  source text
);

create unique index if not exists species_names_unique_idx on species_names (species_code, (lower(name)));
create index if not exists species_names_code_idx on species_names (species_code);

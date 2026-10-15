-- Links birds to the species table. Run AFTER sql/007_species.sql and `npm run seed:species`
-- (the backfill matches each bird's old free-text Species/Subspecies against species names).
--
-- birds.species / birds.subspecies stay as they were for existing birds. New birds carry a
-- species_code (the species is chosen from the species table); species becomes optional, and
-- subspecies now means a true subspecies/form ("Congo", "Timneh") rather than half of the name.

alter table birds add column if not exists species_code text;
alter table birds alter column species drop not null;
create index if not exists birds_species_code_idx on birds (species_code);

-- Pass 1: "<subspecies> <species>" read as a name, e.g. "Sun" + "Conure" -> "Sun Conure".
-- Pass 2: the species text alone, e.g. "Cockatiel". A bird is only linked when exactly one
-- species matches; ambiguous or unmatched birds are left null and listed below.
with names as (
  select code, common_name as name from species
  union all select code, display_name from species where display_name is not null
  union all select species_code, name from species_names
), pass1 as (
  select b.id, array_agg(distinct n.code) as codes
  from birds b join names n on bb_norm(n.name) = bb_norm(trim(coalesce(b.subspecies, '') || ' ' || coalesce(b.species, '')))
  where b.species_code is null and b.species is not null
  group by b.id
)
-- The subspecies text was part of that name, so it is cleared once consumed ("Sun" + "Conure" is
-- now just the species Sun Conure); subspecies is left for true subspecies/forms only.
update birds b set species_code = p.codes[1], subspecies = null from pass1 p where b.id = p.id and array_length(p.codes, 1) = 1;

with names as (
  select code, common_name as name from species
  union all select code, display_name from species where display_name is not null
  union all select species_code, name from species_names
), pass2 as (
  select b.id, array_agg(distinct n.code) as codes
  from birds b join names n on bb_norm(n.name) = bb_norm(b.species)
  where b.species_code is null and b.species is not null
  group by b.id
)
update birds b set species_code = p.codes[1] from pass2 p where b.id = p.id and array_length(p.codes, 1) = 1;

-- Birds the backfill could not link (fix these by hand, or edit the bird in the app):
select id, band, species, subspecies from birds where species_code is null;

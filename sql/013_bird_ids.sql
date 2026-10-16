-- Run once in the Neon SQL editor.
-- Every bird has its own permanent ID that has nothing to do with its band number, so a band can be
-- missing, corrected, or changed without breaking any link (parents, shipments, files, transfers…).
-- Existing birds keep the IDs they already have — they're just IDs now. New birds get a generated one.
--
-- A band is optional. When a bird has one, no other bird may share it (ignoring spaces and capitals).

alter table birds alter column band drop not null;

update birds set band = null where band is not null and btrim(band) = '';

create unique index if not exists birds_band_unique
  on birds (upper(regexp_replace(band, '[[:space:]]+', '', 'g')))
  where band is not null;

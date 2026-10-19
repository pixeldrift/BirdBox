-- Run once in the Neon SQL editor.
-- A bird's location is now one of three things (never more than one at a time):
--   a cage (birds.cage — a cage you keep, filed under a building and location),
--   with a person (birds.location_contact_id — a breeder loan, boarding, a foster home), or
--   somewhere else (birds.location_text — an address or a name, e.g. "Rental barn, 12 Oak Rd").
-- Where a bird is does not change who owns it.

alter table birds add column if not exists location_contact_id text;
alter table birds add column if not exists location_text text;

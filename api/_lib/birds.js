// Shared by api/birds/index.js and api/birds/[id].js.
const { bowUrl } = require('./species');

// A bird plus the species it is linked to (if any). Species columns are null for birds that
// haven't been linked yet (older records, until sql/008_birds_species.sql has matched them).
const WITH_SPECIES = `
  select b.*, s.common_name as sp_common_name, s.display_name as sp_display_name,
         s.scientific_name as sp_scientific_name, s.family_name as sp_family_name,
         s.family_scientific as sp_family_scientific, s.order_name as sp_order_name
  from birds b left join species s on s.code = b.species_code`;

// Postgres date columns can arrive as Date objects; the app wants plain 'YYYY-MM-DD'.
function isoDate(v) {
  if (!v) return null;
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
}

function toBird(row) {
  return {
    id: row.id,
    band: row.band,
    name: row.name,
    sex: row.sex,
    // Linked species (current model). `speciesName` is the US display name used in labels;
    // the scientific name is secondary information only.
    speciesCode: row.species_code || null,
    speciesName: row.sp_display_name || row.sp_common_name || null,
    scientificName: row.sp_scientific_name || null,
    family: row.sp_family_name || null,
    familyScientific: row.sp_family_scientific || null,
    order: row.sp_order_name || null,
    birdsOfTheWorldUrl: row.species_code ? bowUrl(row.species_code) : null,
    // Legacy free-text species, kept for birds not yet linked.
    species: row.species,
    subspecies: row.subspecies,
    mutation: row.mutation,
    hatchDate: isoDate(row.hatch_date),
    status: row.status,
    cage: row.cage,
    motherId: row.mother_id,
    fatherId: row.father_id,
    pairedId: row.paired_id,
    cost: row.cost === null ? null : Number(row.cost),
    price: row.price === null ? null : Number(row.price),
    registryPublic: row.registry_public,
    photos: [],
    notes: row.notes || '',
  };
}

function text(v) {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function money(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

module.exports = { WITH_SPECIES, isoDate, toBird, text, money };

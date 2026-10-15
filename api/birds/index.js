const { neon } = require('@neondatabase/serverless');
const { bowUrl } = require('../_lib/species');

const sql = neon(process.env.DATABASE_URL);

const SEXES = ['Male', 'Female', 'Unsexed'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

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

// Returns { bird } with cleaned fields, or { error } describing the first problem.
function cleanNewBird(input) {
  const band = text(input && input.band);
  if (!band) return { error: 'Band number is required' };
  const cleanBand = band.replace(/\s+/g, ' ');
  const id = cleanBand.replace(/\s+/g, '').toUpperCase();
  if (!SEXES.includes(input.sex)) return { error: 'Sex must be Male, Female, or Unsexed' };
  const speciesCode = text(input.speciesCode);
  if (!speciesCode) return { error: 'Choose a species' };
  const status = input.status || 'Available';
  if (!STATUSES.includes(status)) return { error: 'Status must be one of ' + STATUSES.join(', ') };
  const hatch = text(input.hatchDate);
  if (hatch) {
    const m = hatch.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!m || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
      return { error: 'Hatch date must be a real date (YYYY-MM-DD)' };
    }
  }
  const cost = money(input.cost);
  const price = money(input.price);
  if (Number.isNaN(cost) || Number.isNaN(price)) return { error: 'Cost and price must be numbers' };
  return {
    bird: {
      id, band: cleanBand, name: text(input.name), sex: input.sex, speciesCode,
      subspecies: text(input.subspecies), mutation: text(input.mutation),
      hatchDate: hatch, status, cage: text(input.cage),
      motherId: text(input.motherId), fatherId: text(input.fatherId), pairedId: text(input.pairedId),
      cost, price, registryPublic: input.registryPublic === true, notes: typeof input.notes === 'string' ? input.notes.trim() : '',
    },
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      let rows;
      try {
        rows = await sql(WITH_SPECIES + ' order by b.band');
      } catch (joinErr) {
        // Species tables not created yet (sql/007, sql/008 not run): still serve the birds.
        console.error('Birds loaded without species (run sql/007 and sql/008):', joinErr.message);
        rows = await sql`select * from birds order by band`;
      }
      res.status(200).json(rows.map(toBird));
    } catch (err) {
      res.status(500).json({ error: 'Failed to load birds' });
    }
    return;
  }

  if (req.method === 'POST') {
    // Accepts one bird or an array (batch import). Rows that fail validation, name an unknown
    // species, or already exist are reported back; the rest are inserted together.
    const body = req.body;
    const inputs = Array.isArray(body) ? body : [body];
    if (inputs.length === 0 || inputs.length > 1000) {
      res.status(400).json({ error: 'Send between 1 and 1000 birds at a time' });
      return;
    }
    const cleaned = [];
    const rejected = [];
    const seen = new Set();
    inputs.forEach((input, i) => {
      const result = cleanNewBird(input);
      if (result.error) rejected.push({ index: i, error: result.error });
      else if (seen.has(result.bird.id)) rejected.push({ index: i, error: 'Duplicate band number in this upload' });
      else { seen.add(result.bird.id); cleaned.push({ index: i, bird: result.bird }); }
    });
    try {
      const existing = cleaned.length
        ? await sql`select id from birds where id = any(${cleaned.map((c) => c.bird.id)})`
        : [];
      const taken = new Set(existing.map((r) => r.id));
      const codes = cleaned.length
        ? await sql`select code from species where code = any(${Array.from(new Set(cleaned.map((c) => c.bird.speciesCode)))})`
        : [];
      const knownCodes = new Set(codes.map((r) => r.code));
      const toInsert = [];
      cleaned.forEach((c) => {
        if (taken.has(c.bird.id)) rejected.push({ index: c.index, error: 'A bird with this band number already exists' });
        else if (!knownCodes.has(c.bird.speciesCode)) rejected.push({ index: c.index, error: 'Unknown species — pick one from the list' });
        else toInsert.push(c.bird);
      });
      if (toInsert.length) {
        await sql.transaction(toInsert.map((b) => sql`
          insert into birds (id, band, name, sex, species_code, subspecies, mutation, hatch_date, status, cage, mother_id, father_id, paired_id, cost, price, registry_public, notes)
          values (${b.id}, ${b.band}, ${b.name}, ${b.sex}, ${b.speciesCode}, ${b.subspecies}, ${b.mutation}, ${b.hatchDate}, ${b.status}, ${b.cage}, ${b.motherId}, ${b.fatherId}, ${b.pairedId}, ${b.cost}, ${b.price}, ${b.registryPublic}, ${b.notes})
        `));
      }
      const created = toInsert.length
        ? (await sql(WITH_SPECIES + ' where b.id = any($1) order by b.band', [toInsert.map((b) => b.id)])).map(toBird)
        : [];
      res.status(created.length ? 201 : 200).json({ created, rejected: rejected.sort((a, b) => a.index - b.index) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save birds' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

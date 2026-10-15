const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const SEXES = ['Male', 'Female', 'Unsexed'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

function toBird(row) {
  return {
    id: row.id,
    band: row.band,
    name: row.name,
    sex: row.sex,
    species: row.species,
    subspecies: row.subspecies,
    mutation: row.mutation,
    hatchDate: row.hatch_date,
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
  const species = text(input.species);
  if (!species) return { error: 'Species is required' };
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
      id, band: cleanBand, name: text(input.name), sex: input.sex, species,
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
      const rows = await sql`select * from birds order by band`;
      res.status(200).json(rows.map(toBird));
    } catch (err) {
      res.status(500).json({ error: 'Failed to load birds' });
    }
    return;
  }

  if (req.method === 'POST') {
    // Accepts one bird or an array (batch import). Rows that fail validation or
    // already exist are reported back; the rest are inserted together.
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
      const toInsert = [];
      cleaned.forEach((c) => {
        if (taken.has(c.bird.id)) rejected.push({ index: c.index, error: 'A bird with this band number already exists' });
        else toInsert.push(c.bird);
      });
      if (toInsert.length) {
        await sql.transaction(toInsert.map((b) => sql`
          insert into birds (id, band, name, sex, species, subspecies, mutation, hatch_date, status, cage, mother_id, father_id, paired_id, cost, price, registry_public, notes)
          values (${b.id}, ${b.band}, ${b.name}, ${b.sex}, ${b.species}, ${b.subspecies}, ${b.mutation}, ${b.hatchDate}, ${b.status}, ${b.cage}, ${b.motherId}, ${b.fatherId}, ${b.pairedId}, ${b.cost}, ${b.price}, ${b.registryPublic}, ${b.notes})
        `));
      }
      const created = toInsert.length
        ? (await sql`select * from birds where id = any(${toInsert.map((b) => b.id)}) order by band`).map(toBird)
        : [];
      res.status(created.length ? 201 : 200).json({ created, rejected: rejected.sort((a, b) => a.index - b.index) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save birds' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

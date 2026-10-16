const { neon } = require('@neondatabase/serverless');
const { WITH_SPECIES, toBird, text, money, bandKey, newBirdId } = require('../_lib/birds');

const sql = neon(process.env.DATABASE_URL);

const SEXES = ['Male', 'Female', 'Unsexed'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

// Returns { bird } with cleaned fields, or { error } describing the first problem.
function cleanNewBird(input) {
  // A band number is optional — some birds don't have one. The bird's ID is its own: the app may
  // suggest one (so a CSV can link parents inside the same file); otherwise one is generated.
  const band = text(input && input.band);
  const cleanBand = band ? band.replace(/\s+/g, ' ') : null;
  const suggested = text(input && input.id);
  const id = suggested && /^b-[a-z0-9]{6,30}$/.test(suggested) ? suggested : newBirdId();
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
        rows = await sql(WITH_SPECIES + ' order by b.band nulls last, b.name');
      } catch (joinErr) {
        // Species tables not created yet (sql/007, sql/008 not run): still serve the birds.
        console.error('Birds loaded without species (run sql/007 and sql/008):', joinErr.message);
        rows = await sql`select * from birds order by band nulls last, name`;
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
      else if (result.bird.band && seen.has(bandKey(result.bird.band))) rejected.push({ index: i, error: 'Duplicate band number in this upload' });
      else { if (result.bird.band) seen.add(bandKey(result.bird.band)); cleaned.push({ index: i, bird: result.bird }); }
    });
    try {
      const keys = cleaned.map((c) => c.bird.band ? bandKey(c.bird.band) : null).filter(Boolean);
      const bandRows = keys.length
        ? await sql`select upper(regexp_replace(band, '[[:space:]]+', '', 'g')) as k from birds where upper(regexp_replace(band, '[[:space:]]+', '', 'g')) = any(${keys})`
        : [];
      const takenBands = new Set(bandRows.map((r) => r.k));
      const idRows = cleaned.length
        ? await sql`select id from birds where id = any(${cleaned.map((c) => c.bird.id)})`
        : [];
      const takenIds = new Set(idRows.map((r) => r.id));
      const codes = cleaned.length
        ? await sql`select code from species where code = any(${Array.from(new Set(cleaned.map((c) => c.bird.speciesCode)))})`
        : [];
      const knownCodes = new Set(codes.map((r) => r.code));
      const toInsert = [];
      cleaned.forEach((c) => {
        if (takenBands.has(c.bird.band ? bandKey(c.bird.band) : '') ) rejected.push({ index: c.index, error: 'A bird with this band number already exists' });
        else if (takenIds.has(c.bird.id)) rejected.push({ index: c.index, error: 'Could not save this bird — please try again' });
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
        ? (await sql(WITH_SPECIES + ' where b.id = any($1) order by b.band nulls last, b.name', [toInsert.map((b) => b.id)])).map(toBird)
        : [];
      res.status(created.length ? 201 : 200).json({ created, rejected: rejected.sort((a, b) => a.index - b.index) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save birds' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

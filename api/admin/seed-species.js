const crypto = require('crypto');
const { neon } = require('@neondatabase/serverless');
const { seed, loadTaxonomy } = require('../../scripts/seed-species');

const sql = neon(process.env.DATABASE_URL);

// One-time admin endpoint: loads the species list into the database from inside Vercel, for when
// `npm run seed:species` can't be run from a computer (e.g. setting up from a phone).
//
// Off unless a SEED_TOKEN environment variable is set. Visit
//   /api/admin/seed-species?token=<SEED_TOKEN>
// once sql/007_species.sql has been run. It only downloads the public eBird taxonomy and upserts
// it, so running it twice is harmless. Delete SEED_TOKEN afterwards to switch it off again.

function tokenMatches(given, expected) {
  const a = crypto.createHash('sha256').update(String(given || '')).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  const expected = process.env.SEED_TOKEN;
  if (!expected) {
    res.status(404).json({ error: 'Not enabled' });
    return;
  }
  const query = req.query || {};
  const headers = req.headers || {};
  if (!tokenMatches(query.token || headers['x-seed-token'], expected)) {
    res.status(401).json({ error: 'Wrong or missing token' });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    try {
      await sql('select 1 from species limit 1');
    } catch (e) {
      res.status(409).json({ error: 'The species table does not exist yet — run sql/007_species.sql in the Neon SQL editor first.' });
      return;
    }
    const { taxonomy, version } = await loadTaxonomy();
    const started = Date.now();
    const lines = [];
    const result = await seed({ query: (text, params) => sql(text, params), taxonomy, version, log: (l) => lines.push(l) });
    const counts = await sql('select (select count(*) from species)::int as species, (select count(*) from species_names)::int as alternate_names, (select count(*) from species where aviculture)::int as aviculture');
    res.status(200).json({
      ok: true,
      taxonomyVersion: version,
      seconds: Math.round((Date.now() - started) / 100) / 10,
      inDatabase: counts[0],
      aliasesNotFound: result.unresolved,
      next: 'Now run sql/008_birds_species.sql in the Neon SQL editor, then delete SEED_TOKEN in Vercel.',
    });
  } catch (err) {
    console.error('Species seed failed:', err);
    res.status(500).json({ error: 'Seeding failed: ' + err.message });
  }
};

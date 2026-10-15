const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// POST { birdIds: [...], ownerId: "c-001" | null }
// Sets who owns these birds. A contact id makes that contact the owner; null means you own them.
// Only called when the person says "yes, update ownership" — handing a bird over never does this
// by itself (boarding, breeder loans and so on change possession, not ownership).
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const b = req.body || {};
  const birdIds = Array.isArray(b.birdIds) ? Array.from(new Set(b.birdIds.map(String))) : [];
  const ownerId = b.ownerId ? String(b.ownerId) : null;
  if (!birdIds.length || birdIds.length > 100) {
    res.status(400).json({ error: 'Choose at least one bird' });
    return;
  }
  try {
    const found = await sql`select id from birds where id = any(${birdIds})`;
    if (found.length !== birdIds.length) { res.status(400).json({ error: 'One of those birds isn’t in your flock' }); return; }
    if (ownerId) {
      const c = await sql`select 1 from contacts where id = ${ownerId}`;
      if (!c.length) { res.status(400).json({ error: 'That person isn’t in your contacts' }); return; }
    }
    const steps = [
      // Nobody else owns them any more...
      sql`update contacts set birds_owned = array(select x from unnest(birds_owned) x where x <> all(${birdIds}))
          where birds_owned && ${birdIds}`,
    ];
    if (ownerId) {
      // ...the new owner does, and they're no longer "purchasing" them.
      steps.push(sql`update contacts set
          birds_owned = birds_owned || array(select x from unnest(${birdIds}::text[]) x where x <> all(birds_owned)),
          birds_purchasing = array(select x from unnest(birds_purchasing) x where x <> all(${birdIds}))
        where id = ${ownerId}`);
    }
    await sql.transaction(steps);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ownership' });
  }
};

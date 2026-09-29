const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Maps the camelCase fields the frontend sends to their DB columns. Only
// fields listed here can be updated through this endpoint.
const EDITABLE_FIELDS = {
  registryPublic: 'registry_public',
  status: 'status',
  cage: 'cage',
  notes: 'notes',
};

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const updates = Object.keys(req.body || {}).filter((k) => EDITABLE_FIELDS[k]);
    if (updates.length === 0) {
      res.status(400).json({ error: 'No editable fields provided' });
      return;
    }
    try {
      // @neondatabase/serverless only parameterizes values, not identifiers,
      // so the column name is interpolated directly — safe here because it
      // only ever comes from the EDITABLE_FIELDS whitelist above, never from
      // req.body itself.
      for (const key of updates) {
        const column = EDITABLE_FIELDS[key];
        const value = req.body[key];
        await sql(`update birds set ${column} = $1 where id = $2`, [value, id]);
      }
      const rows = await sql`select * from birds where id = ${id}`;
      if (rows.length === 0) {
        res.status(404).json({ error: 'Bird not found' });
        return;
      }
      res.status(200).json({ id: rows[0].id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update bird' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

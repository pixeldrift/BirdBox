const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function toRecord(row) {
  return {
    id: row.id,
    birdId: row.bird_id,
    type: row.type,
    date: row.date,
    provider: row.provider,
    notes: row.notes,
    attachments: row.attachments,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`select * from health_records order by date desc`;
      res.status(200).json(rows.map(toRecord));
    } catch (err) {
      res.status(500).json({ error: 'Failed to load health records' });
    }
    return;
  }

  if (req.method === 'POST') {
    var body = req.body || {};
    if (!body.id || !body.birdId || !body.type || !body.date) {
      res.status(400).json({ error: 'id, birdId, type, and date are required' });
      return;
    }
    try {
      await sql`
        insert into health_records (id, bird_id, type, date, provider, notes, attachments)
        values (${body.id}, ${body.birdId}, ${body.type}, ${body.date}, ${body.provider || ''}, ${body.notes || ''}, ${JSON.stringify(body.attachments || [])})
      `;
      res.status(201).json({ id: body.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save health record' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function toTransaction(row) {
  return {
    id: row.id,
    item: row.item,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    funding: row.funding,
    clientId: row.client_id,
    birdId: row.bird_id,
    notes: row.notes,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const rows = await sql`select * from transactions order by date desc`;
    res.status(200).json(rows.map(toTransaction));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transactions' });
  }
};

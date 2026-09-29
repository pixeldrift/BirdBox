const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function toContact(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    type: row.type,
    city: row.city,
    state: row.state,
    email: row.email,
    phone: row.phone,
    birdsOwned: row.birds_owned,
    birdsPurchasing: row.birds_purchasing,
    notes: row.notes,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const rows = await sql`select * from contacts order by name`;
    res.status(200).json(rows.map(toContact));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contacts' });
  }
};

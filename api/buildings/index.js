const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function toBuilding(row) {
  return {
    code: row.code,
    nickname: row.nickname,
    description: row.description,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const rows = await sql`select * from buildings order by code`;
    res.status(200).json(rows.map(toBuilding));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load buildings' });
  }
};

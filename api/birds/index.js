const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const rows = await sql`select * from birds order by band`;
    res.status(200).json(rows.map(toBird));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load birds' });
  }
};

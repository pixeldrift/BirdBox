const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function toWaybill(row) {
  return {
    id: row.id,
    waybillNumber: row.waybill_number,
    direction: row.direction,
    date: row.date,
    clientId: row.client_id,
    birdIds: row.bird_ids,
    departingAirport: row.departing_airport,
    arrivingAirport: row.arriving_airport,
    cost: row.cost === null ? null : Number(row.cost),
    notes: row.notes,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const rows = await sql`select * from waybills order by date desc`;
    res.status(200).json(rows.map(toWaybill));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load waybills' });
  }
};

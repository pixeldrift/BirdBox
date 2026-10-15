const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const DIRECTIONS = ['Out', 'In'];
const METHODS = ['Local pick up', 'Local meet', 'Delivery', 'Shipped'];

function isoDate(v) {
  if (!v) return null;
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
}

function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function toTransfer(row) {
  return {
    id: row.id,
    birdId: row.bird_id,
    contactId: row.contact_id,
    direction: row.direction,
    method: row.method,
    date: isoDate(row.date),
    notes: row.notes,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`select * from bird_transfers order by date desc nulls last, created_at desc`;
      res.status(200).json(rows.map(toTransfer));
    } catch (err) {
      // Table not created yet (sql/011_transfers.sql): behave as "no transfers" rather than failing the app.
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    const direction = DIRECTIONS.find((d) => d === b.direction);
    const method = METHODS.find((m) => m === b.method);
    if (!direction) { res.status(400).json({ error: 'Choose whether the bird went to someone or came from someone' }); return; }
    if (!method) { res.status(400).json({ error: 'Choose how it was handed over' }); return; }
    const date = String(b.date || '').trim() || null;
    if (date && !isRealDate(date)) { res.status(400).json({ error: 'Enter a real date' }); return; }
    const birdId = String(b.birdId || '');
    const contactId = String(b.contactId || '') || null;
    if (!contactId) { res.status(400).json({ error: 'Choose who it ' + (direction === 'Out' ? 'went to' : 'came from') }); return; }
    try {
      const bird = await sql`select 1 from birds where id = ${birdId}`;
      if (!bird.length) { res.status(400).json({ error: 'That bird isn’t in your flock' }); return; }
      const contact = await sql`select 1 from contacts where id = ${contactId}`;
      if (!contact.length) { res.status(400).json({ error: 'That person isn’t in your contacts' }); return; }
      const id = 'tr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const notes = String(b.notes || '').trim().slice(0, 2000);
      const rows = await sql`
        insert into bird_transfers (id, bird_id, contact_id, direction, method, date, notes)
        values (${id}, ${birdId}, ${contactId}, ${direction}, ${method}, ${date}, ${notes})
        returning *`;
      res.status(201).json(toTransfer(rows[0]));
    } catch (err) {
      const missing = /bird_transfers/.test(String(err && err.message));
      res.status(missing ? 409 : 500).json({ error: missing ? 'This needs one more setup step — run sql/011_transfers.sql in Neon.' : 'Failed to save transfer' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

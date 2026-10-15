const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const DIRECTIONS = ['Outgoing', 'Incoming'];
const STATUSES = ['Pending', 'Complete'];
// In-person handoffs aren't shipments: they're recorded as transfers on the bird.
const METHODS = ['Air cargo', 'Courier', 'Ground delivery', 'Other'];

const SETUP_NEEDED = 'This needs one more setup step — run sql/009_waybills_status.sql and sql/010_shipments.sql in Neon.';

function isoDate(v) {
  if (!v) return null;
  return v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
}

function toWaybill(row, files) {
  return {
    id: row.id,
    waybillNumber: row.waybill_number,
    method: row.method || '',
    carrier: row.carrier || '',
    direction: row.direction,
    // Rows from before sql/009_waybills_status.sql have no status: they already happened.
    status: row.status || 'Complete',
    date: isoDate(row.date),
    clientId: row.client_id,
    birdIds: row.bird_ids,
    departingAirport: row.departing_airport,
    arrivingAirport: row.arriving_airport,
    cost: row.cost === null ? null : Number(row.cost),
    notes: row.notes,
    files: (files || []).map(toFile),
  };
}

function toFile(f) {
  return { id: f.id, kind: f.kind, filename: f.filename, contentType: f.content_type, size: f.size, url: '/api/waybills/files?id=' + encodeURIComponent(f.id) };
}

// File details only (never the bytes). Empty if the files table hasn't been created yet.
async function loadFiles(ids) {
  if (!ids.length) return [];
  try {
    return await sql`select id, waybill_id, kind, filename, content_type, size from waybill_files where waybill_id = any(${ids}) order by created_at`;
  } catch (err) {
    return [];
  }
}

function withFiles(rows, files) {
  return rows.map((r) => toWaybill(r, files.filter((f) => f.waybill_id === r.id)));
}

function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function str(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

function cleanNewWaybill(input) {
  const b = input || {};
  const direction = DIRECTIONS.find((d) => d === b.direction);
  if (!direction) return { error: 'Choose Shipped or Received' };
  const status = b.status === undefined ? 'Complete' : STATUSES.find((s) => s === b.status);
  if (!status) return { error: 'Status must be Pending or Complete' };
  const date = str(b.date, 10) || null;
  if (date && !isRealDate(date)) return { error: 'Enter a real date' };
  const method = b.method ? METHODS.find((m) => m === b.method) : '';
  if (method === undefined) return { error: 'Choose how it travelled from the list' };
  let cost = null;
  if (b.cost !== undefined && b.cost !== null && String(b.cost).trim() !== '') {
    cost = Number(b.cost);
    if (!isFinite(cost) || cost < 0) return { error: 'Cost must be a number' };
  }
  const birdIds = Array.isArray(b.birdIds) ? Array.from(new Set(b.birdIds.map((x) => str(x, 40)).filter(Boolean))) : [];
  if (birdIds.length > 100) return { error: 'Too many birds in one shipment' };
  // The two things a shipment record needs: which bird(s), and who it came from / went to.
  if (!birdIds.length) return { error: 'Choose at least one bird' };
  const who = str(b.clientId, 40) || str(b.departingAirport, 60) || str(b.arrivingAirport, 60);
  if (!who) return { error: 'Choose who it ' + (direction === 'Outgoing' ? 'went to' : 'came from') };
  return {
    waybill: {
      direction, status, date, cost, birdIds, method,
      carrier: str(b.carrier, 120),
      waybillNumber: str(b.waybillNumber, 60),
      clientId: str(b.clientId, 40) || null,
      departingAirport: str(b.departingAirport, 60),
      arrivingAirport: str(b.arrivingAirport, 60),
      notes: str(b.notes, 2000),
    },
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`select * from waybills order by date desc nulls last, id`;
      res.status(200).json(withFiles(rows, await loadFiles(rows.map((r) => r.id))));
    } catch (err) {
      res.status(500).json({ error: 'Failed to load waybills' });
    }
    return;
  }

  if (req.method === 'POST') {
    const result = cleanNewWaybill(req.body);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    const w = result.waybill;
    try {
      if (w.clientId) {
        const c = await sql`select 1 from contacts where id = ${w.clientId}`;
        if (!c.length) { res.status(400).json({ error: 'That client isn’t in your contacts' }); return; }
      }
      if (w.birdIds.length) {
        const found = await sql`select id from birds where id = any(${w.birdIds})`;
        if (found.length !== w.birdIds.length) { res.status(400).json({ error: 'One of the birds isn’t in your flock' }); return; }
      }
      const id = 'wb-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      let rows;
      try {
        rows = await sql`
          insert into waybills (id, waybill_number, direction, status, method, carrier, date, client_id, bird_ids, departing_airport, arriving_airport, cost, notes)
          values (${id}, ${w.waybillNumber}, ${w.direction}, ${w.status}, ${w.method}, ${w.carrier}, ${w.date}, ${w.clientId}, ${w.birdIds}, ${w.departingAirport}, ${w.arrivingAirport}, ${w.cost}, ${w.notes})
          returning *`;
      } catch (err) {
        if (/column "(status|method|carrier)"|null value in column "date"/.test(String(err && err.message))) {
          res.status(409).json({ error: SETUP_NEEDED });
          return;
        }
        throw err;
      }
      res.status(201).json(toWaybill(rows[0], []));
    } catch (err) {
      res.status(500).json({ error: 'Failed to save shipment' });
    }
    return;
  }

  // Mark a pending shipment as having happened (and optionally set the date).
  if (req.method === 'PATCH') {
    const id = String((req.query && req.query.id) || '');
    const b = req.body || {};
    const date = String(b.date || '').trim() || null;
    if (b.status !== 'Complete') { res.status(400).json({ error: 'Only marking a shipment complete is supported' }); return; }
    if (date && !isRealDate(date)) { res.status(400).json({ error: 'Enter a real date' }); return; }
    try {
      const rows = await sql`update waybills set status = 'Complete', date = coalesce(${date}::date, date) where id = ${id} returning *`;
      if (!rows.length) { res.status(404).json({ error: 'Shipment not found' }); return; }
      res.status(200).json(toWaybill(rows[0], await loadFiles([id])));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update shipment' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

const { neon } = require('@neondatabase/serverless');
const { SCHEMAS } = require('../_lib/schemas');

const sql = neon(process.env.DATABASE_URL);

// One endpoint for contacts, transactions, health records and buildings (the type comes from
// ?type=). It exists so these share code — and so adding more record types doesn't use up the
// host's limit on API functions. Field lists live in api/_lib/schemas.js.
//
//   GET    ?type=contacts               list
//   POST   ?type=contacts               create  (body = the fields)
//   PATCH  ?type=contacts&id=c-001      change some fields
//   DELETE ?type=contacts&id=c-001      delete (links to it are cleaned up)

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

function toRecord(schema, row, type) {
  const out = { [schema.pk]: row[schema.pk] };
  Object.keys(schema.fields).forEach((k) => {
    const f = schema.fields[k];
    let v = row[f.col];
    if (f.type === 'date') v = isoDate(v);
    else if (f.type === 'number') v = v === null || v === undefined ? null : Number(v);
    out[k] = v;
  });
  if (type === 'health') out.attachments = []; // files are linked media now (api/media)
  return out;
}

// Checks the fields in `input` against the schema. Returns { values: {col: value} } or { error }.
// On create every required field must be present; on update only the ones sent are checked.
function clean(schema, input, creating) {
  const values = {};
  for (const key of Object.keys(schema.fields)) {
    const f = schema.fields[key];
    if (f.readOnly) continue;
    const present = input[key] !== undefined;
    if (!present) {
      if (creating && f.required) return { error: label(key) + ' is required' };
      if (creating) values[f.col] = f.type === 'text' || f.type === 'enum' ? (f.ref ? null : '') : null;
      continue;
    }
    let v = input[key];
    if (f.type === 'number') {
      if (v === '' || v === null) { if (f.required) return { error: label(key) + ' is required' }; values[f.col] = null; continue; }
      v = Number(v);
      if (!isFinite(v)) return { error: label(key) + ' must be a number' };
    } else if (f.type === 'date') {
      v = String(v == null ? '' : v).trim();
      if (!v) { if (f.required) return { error: label(key) + ' is required' }; values[f.col] = null; continue; }
      if (!isRealDate(v)) return { error: label(key) + ' must be a real date' };
    } else if (f.type === 'enum') {
      v = String(v == null ? '' : v).trim();
      if (!v && !f.required) { values[f.col] = ''; continue; }
      if (!f.options.includes(v)) return { error: label(key) + ' must be one of: ' + f.options.join(', ') };
    } else {
      v = String(v == null ? '' : v).trim().slice(0, f.max || 500);
      if (!v && f.required) return { error: label(key) + ' is required' };
      if (!v && f.ref) v = null; // an empty link is "no link", not an empty string
    }
    values[f.col] = v;
  }
  return { values };
}

function label(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

async function checkRefs(schema, values) {
  for (const key of Object.keys(schema.fields)) {
    const f = schema.fields[key];
    const v = values[f.col];
    if (!f.ref || !v) continue;
    const target = { contact: ['contacts', 'id'], bird: ['birds', 'id'], location: ['locations', 'id'], building: ['buildings', 'code'] }[f.ref];
    const found = await sql(`select 1 from ${target[0]} where ${target[1]} = $1`, [v]);
    if (!found.length) return 'That ' + f.ref + ' isn’t in your records';
  }
  return null;
}

// Things that point at a record are tidied up when it's deleted.
async function cleanupAfterDelete(type, id) {
  const targetType = { contacts: 'contact', transactions: 'transaction', health: 'health' }[type];
  const steps = [];
  if (targetType) steps.push(['delete from media_links where target_type = $1 and target_id = $2', [targetType, id]]);
  if (type === 'contacts') {
    steps.push(['update transactions set client_id = null where client_id = $1', [id]]);
    steps.push(['update waybills set client_id = null where client_id = $1', [id]]);
    steps.push(['update bird_transfers set contact_id = null where contact_id = $1', [id]]);
    steps.push(['update birds set location_contact_id = null where location_contact_id = $1', [id]]);
  }
  if (type === 'cages') steps.push(['update birds set cage = null where cage = $1', [id]]);
  if (type === 'buildings') steps.push(['update cages set building_code = null where building_code = $1', [id]]);
  if (type === 'locations') steps.push(['update buildings set location_id = null where location_id = $1', [id]]);
  for (const [text, params] of steps) {
    try { await sql(text, params); } catch (err) { /* that table may not exist yet */ }
  }
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  const type = String(query.type || '');
  const schema = SCHEMAS[type];
  if (!schema) { res.status(400).json({ error: 'Unknown record type' }); return; }
  const id = String(query.id || '');

  try {
    if (req.method === 'GET') {
      const rows = await sql(`select * from ${schema.table} order by ${schema.order}`);
      res.status(200).json(rows.map((r) => toRecord(schema, r, type)));
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const result = clean(schema, body, true);
      if (result.error) { res.status(400).json({ error: result.error }); return; }
      const refError = await checkRefs(schema, result.values);
      if (refError) { res.status(400).json({ error: refError }); return; }
      let newId;
      if (schema.pk === 'code') { // buildings and cages are identified by a short code the person chooses
        newId = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
        if (!newId) { res.status(400).json({ error: 'Code is required (letters and numbers, e.g. F7 or F2-010)' }); return; }
        const taken = await sql(`select 1 from ${schema.table} where code = $1`, [newId]);
        if (taken.length) { res.status(409).json({ error: 'There is already one with that code' }); return; }
      } else {
        newId = schema.idPrefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      }
      const cols = [schema.pk].concat(Object.keys(result.values));
      const vals = [newId].concat(Object.keys(result.values).map((c) => result.values[c]));
      const rows = await sql(
        `insert into ${schema.table} (${cols.join(', ')}) values (${cols.map((_, i) => '$' + (i + 1)).join(', ')}) returning *`, vals);
      res.status(201).json(toRecord(schema, rows[0], type));
      return;
    }

    if (req.method === 'PATCH') {
      const result = clean(schema, req.body || {}, false);
      if (result.error) { res.status(400).json({ error: result.error }); return; }
      const cols = Object.keys(result.values);
      if (!cols.length) { res.status(400).json({ error: 'Nothing to change' }); return; }
      const refError = await checkRefs(schema, result.values);
      if (refError) { res.status(400).json({ error: refError }); return; }
      const rows = await sql(
        `update ${schema.table} set ${cols.map((c, i) => c + ' = $' + (i + 1)).join(', ')} where ${schema.pk} = $${cols.length + 1} returning *`,
        cols.map((c) => result.values[c]).concat([id]));
      if (!rows.length) { res.status(404).json({ error: 'Record not found' }); return; }
      res.status(200).json(toRecord(schema, rows[0], type));
      return;
    }

    if (req.method === 'DELETE') {
      const rows = await sql(`delete from ${schema.table} where ${schema.pk} = $1 returning ${schema.pk}`, [id]);
      if (!rows.length) { res.status(404).json({ error: 'Record not found' }); return; }
      await cleanupAfterDelete(type, id);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not handle that record' });
  }
};

const { neon } = require('@neondatabase/serverless');
const { WITH_SPECIES, toBird, bandKey } = require('../_lib/birds');

const sql = neon(process.env.DATABASE_URL);

const SEXES = ['Male', 'Female', 'Unsexed'];
const STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

// Fields that can be changed through this endpoint (camelCase from the app -> DB column).
// The band number can be added, corrected or removed: a bird's id is its own and doesn't depend on it.
const COLUMNS = {
  band: 'band', name: 'name', sex: 'sex', speciesCode: 'species_code', subspecies: 'subspecies', mutation: 'mutation',
  hatchDate: 'hatch_date', status: 'status', cage: 'cage', locationContactId: 'location_contact_id', locationText: 'location_text', motherId: 'mother_id', fatherId: 'father_id',
  pairedId: 'paired_id', cost: 'cost', price: 'price', registryPublic: 'registry_public', notes: 'notes',
};

function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function blankToNull(v) {
  const t = String(v == null ? '' : v).trim();
  return t || null;
}

// Cleans the fields sent for an update. Returns { values: {column: value} } or { error }.
async function clean(id, body) {
  const values = {};
  for (const key of Object.keys(body)) {
    const col = COLUMNS[key];
    if (!col) continue;
    const v = body[key];
    if (key === 'band') {
      const t = blankToNull(v);
      if (t) {
        const clash = await sql`select id from birds where upper(regexp_replace(band, '[[:space:]]+', '', 'g')) = ${bandKey(t)} and id <> ${id}`;
        if (clash.length) return { error: 'Another bird already has that band number' };
      }
      values[col] = t ? t.replace(/\s+/g, ' ').slice(0, 60) : null;
    } else if (key === 'sex') {
      if (!SEXES.includes(v)) return { error: 'Sex must be Male, Female, or Unsexed' };
      values[col] = v;
    } else if (key === 'status') {
      if (!STATUSES.includes(v)) return { error: 'Status must be one of ' + STATUSES.join(', ') };
      values[col] = v;
    } else if (key === 'hatchDate') {
      const t = blankToNull(v);
      if (t && !isRealDate(t)) return { error: 'Hatch date must be a real date' };
      values[col] = t;
    } else if (key === 'cost' || key === 'price') {
      if (v === null || v === '' || v === undefined) { values[col] = null; continue; }
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return { error: 'Cost and price must be numbers' };
      values[col] = n;
    } else if (key === 'registryPublic') {
      values[col] = v === true;
    } else if (key === 'notes') {
      values[col] = String(v == null ? '' : v).trim().slice(0, 4000);
    } else if (key === 'speciesCode') {
      const code = blankToNull(v);
      if (!code) return { error: 'Choose a species' };
      const found = await sql`select 1 from species where code = ${code}`;
      if (!found.length) return { error: 'Unknown species — pick one from the list' };
      values[col] = code;
    } else if (key === 'locationContactId') {
      const ref = blankToNull(v);
      if (ref) {
        const found = await sql`select 1 from contacts where id = ${ref}`;
        if (!found.length) { return { error: 'That person isn’t in your contacts' }; }
      }
      values[col] = ref;
    } else if (key === 'motherId' || key === 'fatherId' || key === 'pairedId') {
      const ref = blankToNull(v);
      if (ref) {
        if (ref === id) return { error: 'A bird can’t be its own parent or partner' };
        const found = await sql`select 1 from birds where id = ${ref}`;
        if (!found.length) return { error: 'That bird isn’t in your flock' };
      }
      values[col] = ref;
    } else {
      values[col] = blankToNull(v) === null ? null : String(v).trim().slice(0, 200); // name, subspecies, mutation, cage
    }
  }
  return { values };
}

// Everything that pointed at a deleted bird is tidied up. (Its photos and files stay in the Media
// library, just unlinked.)
async function cleanupAfterDelete(id) {
  const steps = [
    ['update birds set mother_id = null where mother_id = $1', [id]],
    ['update birds set father_id = null where father_id = $1', [id]],
    ['update birds set paired_id = null where paired_id = $1', [id]],
    ['update transactions set bird_id = null where bird_id = $1', [id]],
    ['update waybills set bird_ids = array_remove(bird_ids, $1) where $1 = any(bird_ids)', [id]],
    ['update contacts set birds_owned = array_remove(birds_owned, $1) where $1 = any(birds_owned)', [id]],
    ['update contacts set birds_purchasing = array_remove(birds_purchasing, $1) where $1 = any(birds_purchasing)', [id]],
    ['delete from bird_transfers where bird_id = $1', [id]],
    ["delete from media_links where target_type = 'health' and target_id in (select id from health_records where bird_id = $1)", [id]],
    ['delete from health_records where bird_id = $1', [id]],
    ["delete from media_links where target_type = 'bird' and target_id = $1", [id]],
  ];
  for (const [text, params] of steps) {
    try { await sql(text, params); } catch (err) { /* a table that doesn't exist yet has nothing to tidy */ }
  }
}

module.exports = async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PATCH') {
    const body = req.body || {};
    try {
      const result = await clean(id, body);
      if (result.error) { res.status(400).json({ error: result.error }); return; }
      const cols = Object.keys(result.values);
      if (cols.length === 0) { res.status(400).json({ error: 'No editable fields provided' }); return; }
      const updated = await sql(
        `update birds set ${cols.map((c, i) => c + ' = $' + (i + 1)).join(', ')} where id = $${cols.length + 1} returning id`,
        cols.map((c) => result.values[c]).concat([id]));
      if (!updated.length) { res.status(404).json({ error: 'Bird not found' }); return; }
      const rows = await sql(WITH_SPECIES + ' where b.id = $1', [id]);
      res.status(200).json(toBird(rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update bird' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const rows = await sql`delete from birds where id = ${id} returning id`;
      if (!rows.length) { res.status(404).json({ error: 'Bird not found' }); return; }
      await cleanupAfterDelete(id);
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete bird' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

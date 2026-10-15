const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// What can be attached to what.
const OWNERS = {
  bird:        { table: 'birds',          kinds: ['photo'] },
  health:      { table: 'health_records', kinds: ['document'] },
  waybill:     { table: 'waybills',       kinds: ['photo', 'receipt', 'waybill'] },
  transaction: { table: 'transactions',   kinds: ['invoice', 'receipt', 'document'] },
};
const MAX_BYTES = 3 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB, and base64 adds a third
const MAX_FILES = 60;

function allowedType(kind, type) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(type)) return true;
  return kind !== 'photo' && type === 'application/pdf';
}

function toMeta(r) {
  return {
    id: r.id, ownerType: r.owner_type, ownerId: r.owner_id, kind: r.kind, filename: r.filename,
    contentType: r.content_type, size: r.size, isPrimary: r.is_primary,
    url: '/api/files?id=' + encodeURIComponent(r.id),
  };
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  try {
    if (req.method === 'GET') {
      // One file's bytes...
      if (query.id) {
        const rows = await sql`select filename, content_type, data from attachments where id = ${String(query.id)}`;
        if (!rows.length) { res.status(404).json({ error: 'File not found' }); return; }
        const f = rows[0];
        res.setHeader('Content-Type', f.content_type);
        res.setHeader('Content-Disposition', 'inline; filename="' + String(f.filename).replace(/[^\w.\- ]/g, '_') + '"');
        res.setHeader('Cache-Control', 'private, max-age=3600');
        // The driver hands bytea back as a Buffer, or as '\x…' hex text.
        const bytes = typeof f.data === 'string' && f.data.startsWith('\\x') ? Buffer.from(f.data.slice(2), 'hex') : Buffer.from(f.data);
        res.status(200).send(bytes);
        return;
      }
      // ...or the list of every file (details only, never the bytes).
      try {
        const rows = await sql`select id, owner_type, owner_id, kind, filename, content_type, size, is_primary from attachments order by created_at`;
        res.status(200).json(rows.map(toMeta));
      } catch (err) {
        res.status(200).json([]); // table not created yet (sql/012_attachments.sql)
      }
      return;
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const owner = OWNERS[b.ownerType];
      if (!owner) { res.status(400).json({ error: 'Unknown record type' }); return; }
      const kind = owner.kinds.find((k) => k === b.kind);
      if (!kind) { res.status(400).json({ error: 'Unknown file type' }); return; }
      const type = String(b.contentType || '').toLowerCase();
      if (!allowedType(kind, type)) {
        res.status(400).json({ error: kind === 'photo' ? 'Photos must be JPG, PNG, WebP or GIF images' : 'Use a photo (JPG, PNG, WebP) or a PDF' });
        return;
      }
      const data = Buffer.from(String(b.data || ''), 'base64');
      if (!data.length) { res.status(400).json({ error: 'That file is empty' }); return; }
      if (data.length > MAX_BYTES) { res.status(413).json({ error: 'That file is too big — keep it under 3 MB' }); return; }
      const ownerId = String(b.ownerId || '');
      const exists = await sql(`select 1 from ${owner.table} where id = $1`, [ownerId]); // table name comes from OWNERS, never from the request
      if (!exists.length) { res.status(404).json({ error: 'That record wasn’t found' }); return; }
      const count = await sql`select count(*)::int as n, count(*) filter (where is_primary) as p from attachments where owner_type = ${b.ownerType} and owner_id = ${ownerId}`;
      if (count[0].n >= MAX_FILES) { res.status(400).json({ error: 'This record has the maximum number of files' }); return; }
      const id = 'f-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const primary = kind === 'photo' && b.ownerType === 'bird' && Number(count[0].p) === 0;
      const filename = String(b.filename || '').slice(0, 120);
      await sql`insert into attachments (id, owner_type, owner_id, kind, filename, content_type, size, data, is_primary)
                values (${id}, ${b.ownerType}, ${ownerId}, ${kind}, ${filename}, ${type}, ${data.length}, ${data}, ${primary})`;
      res.status(201).json(toMeta({ id, owner_type: b.ownerType, owner_id: ownerId, kind, filename, content_type: type, size: data.length, is_primary: primary }));
      return;
    }

    // Make this photo the bird's main picture.
    if (req.method === 'PATCH') {
      const id = String(query.id || '');
      const rows = await sql`select owner_type, owner_id, kind from attachments where id = ${id}`;
      if (!rows.length || rows[0].kind !== 'photo') { res.status(404).json({ error: 'Photo not found' }); return; }
      await sql.transaction([
        sql`update attachments set is_primary = (id = ${id}) where owner_type = ${rows[0].owner_type} and owner_id = ${rows[0].owner_id} and kind = 'photo'`,
      ]);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const id = String(query.id || '');
      const rows = await sql`delete from attachments where id = ${id} returning owner_type, owner_id, kind, is_primary`;
      // If the main photo went, the oldest remaining photo takes over.
      if (rows.length && rows[0].is_primary) {
        await sql`update attachments set is_primary = true where id = (
          select id from attachments where owner_type = ${rows[0].owner_type} and owner_id = ${rows[0].owner_id} and kind = 'photo' order by created_at limit 1)`;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not handle that file' });
  }
};

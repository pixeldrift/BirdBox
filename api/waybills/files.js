const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const KINDS = ['photo', 'receipt', 'waybill'];
const MAX_BYTES = 3 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB, and base64 adds a third
const MAX_FILES = 40;

function allowedType(kind, type) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(type)) return true;
  return kind !== 'photo' && type === 'application/pdf';
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  try {
    if (req.method === 'GET') {
      const rows = await sql`select filename, content_type, data from waybill_files where id = ${String(query.id || '')}`;
      if (!rows.length) { res.status(404).json({ error: 'File not found' }); return; }
      const f = rows[0];
      res.setHeader('Content-Type', f.content_type);
      res.setHeader('Content-Disposition', 'inline; filename="' + String(f.filename).replace(/[^\w.\- ]/g, '_') + '"');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      // The driver hands bytea back as a Buffer, or as '\\x…' hex text.
      const bytes = typeof f.data === 'string' && f.data.startsWith('\\x') ? Buffer.from(f.data.slice(2), 'hex') : Buffer.from(f.data);
      res.status(200).send(bytes);
      return;
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const kind = KINDS.find((k) => k === b.kind);
      if (!kind) { res.status(400).json({ error: 'Unknown file type' }); return; }
      const type = String(b.contentType || '').toLowerCase();
      if (!allowedType(kind, type)) {
        res.status(400).json({ error: kind === 'photo' ? 'Photos must be JPG, PNG, WebP or GIF images' : 'Use a photo (JPG, PNG, WebP) or a PDF' });
        return;
      }
      const data = Buffer.from(String(b.data || ''), 'base64');
      if (!data.length) { res.status(400).json({ error: 'That file is empty' }); return; }
      if (data.length > MAX_BYTES) { res.status(413).json({ error: 'That file is too big — keep it under 3 MB' }); return; }
      const wb = await sql`select 1 from waybills where id = ${String(b.waybillId || '')}`;
      if (!wb.length) { res.status(404).json({ error: 'Shipment not found' }); return; }
      const count = await sql`select count(*)::int as n from waybill_files where waybill_id = ${b.waybillId}`;
      if (count[0].n >= MAX_FILES) { res.status(400).json({ error: 'This shipment has the maximum number of files' }); return; }
      const id = 'wf-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const filename = String(b.filename || '').slice(0, 120);
      await sql`insert into waybill_files (id, waybill_id, kind, filename, content_type, size, data)
                values (${id}, ${b.waybillId}, ${kind}, ${filename}, ${type}, ${data.length}, ${data})`;
      res.status(201).json({ id, kind, filename, contentType: type, size: data.length, url: '/api/waybills/files?id=' + id });
      return;
    }

    if (req.method === 'DELETE') {
      await sql`delete from waybill_files where id = ${String(query.id || '')}`;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not handle that file' });
  }
};

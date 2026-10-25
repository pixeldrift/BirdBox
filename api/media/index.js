const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Records a file can be linked to (table names come from here, never from the request).
const TARGETS = { bird: 'birds', health: 'health_records', waybill: 'waybills', transaction: 'transactions', contact: 'contacts', aviary: 'aviary', location: 'locations', building: 'buildings', room: 'rooms', cage: 'cages', supply: 'supplies' };
const TARGET_PK = { building: 'code', cage: 'code' }; // everything else is keyed by id
const TYPES = ['photo', 'receipt', 'waybill', 'invoice', 'document'];
const MAX_BYTES = 3 * 1024 * 1024; // Vercel caps request bodies at ~4.5 MB, and base64 adds a third

function allowedType(type, contentType) {
  if (/^image\/(jpeg|png|webp|gif)$/.test(contentType)) return true;
  return type !== 'photo' && contentType === 'application/pdf';
}

function toMedia(m, links) {
  return {
    id: m.id, type: m.type, filename: m.filename, title: m.title, contentType: m.content_type,
    size: m.size, createdAt: m.created_at, url: '/api/media?id=' + encodeURIComponent(m.id),
    links: (links || []).map((l) => ({ targetType: l.target_type, targetId: l.target_id, isPrimary: l.is_primary, at: l.created_at })),
  };
}

function cleanLink(l) {
  const t = l && TARGETS[l.targetType] ? l.targetType : null;
  const id = l ? String(l.targetId || '') : '';
  return t && id ? { targetType: t, targetId: id } : null;
}

async function targetExists(link) {
  const rows = await sql(`select 1 from ${TARGETS[link.targetType]} where ${TARGET_PK[link.targetType] || 'id'} = $1`, [link.targetId]);
  return rows.length > 0;
}

// A bird always has one main photo as long as it has any photo: if it lost it, the oldest takes over.
async function ensureMainPhoto(targetType, targetId) {
  const has = await sql`select 1 from media_links l join media m on m.id = l.media_id
    where l.target_type = ${targetType} and l.target_id = ${targetId} and m.type = 'photo' and l.is_primary`;
  if (has.length) return;
  await sql`update media_links set is_primary = true where (media_id, target_type, target_id) = (
    select l.media_id, l.target_type, l.target_id from media_links l join media m on m.id = l.media_id
    where l.target_type = ${targetType} and l.target_id = ${targetId} and m.type = 'photo' order by l.created_at limit 1)`;
}
const HAS_MAIN_PHOTO = ['bird', 'aviary', 'location', 'building', 'room', 'cage', 'supply', 'contact', 'waybill'];

module.exports = async function handler(req, res) {
  const query = req.query || {};
  try {
    if (req.method === 'GET') {
      if (query.id) { // one file's bytes
        const rows = await sql`select filename, content_type, data from media where id = ${String(query.id)}`;
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
      try { // the whole library (details and links, never the bytes)
        const items = await sql`select id, type, filename, title, content_type, size, created_at from media order by created_at desc`;
        const links = await sql`select media_id, target_type, target_id, is_primary, created_at from media_links`;
        const by = {};
        links.forEach((l) => { (by[l.media_id] = by[l.media_id] || []).push(l); });
        res.status(200).json(items.map((m) => toMedia(m, by[m.id])));
      } catch (err) {
        res.status(200).json([]); // tables not created yet (sql/012_attachments.sql)
      }
      return;
    }

    // Upload a new file, optionally linking it to records right away.
    if (req.method === 'POST') {
      const b = req.body || {};
      const type = TYPES.find((t) => t === b.type);
      if (!type) { res.status(400).json({ error: 'Choose what kind of file this is' }); return; }
      const contentType = String(b.contentType || '').toLowerCase();
      if (!allowedType(type, contentType)) {
        res.status(400).json({ error: type === 'photo' ? 'Photos must be JPG, PNG, WebP or GIF images' : 'Use a photo (JPG, PNG, WebP) or a PDF' });
        return;
      }
      const data = Buffer.from(String(b.data || ''), 'base64');
      if (!data.length) { res.status(400).json({ error: 'That file is empty' }); return; }
      if (data.length > MAX_BYTES) { res.status(413).json({ error: 'That file is too big — keep it under 3 MB' }); return; }
      const links = (Array.isArray(b.links) ? b.links : []).map(cleanLink).filter(Boolean).slice(0, 20);
      for (const l of links) {
        if (!(await targetExists(l))) { res.status(404).json({ error: 'One of the records to link to wasn’t found' }); return; }
      }
      const id = 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const filename = String(b.filename || '').slice(0, 120);
      const title = String(b.title || '').trim().slice(0, 160);
      await sql`insert into media (id, type, filename, title, content_type, size, data)
                values (${id}, ${type}, ${filename}, ${title}, ${contentType}, ${data.length}, ${data})`;
      for (const l of links) {
        await sql`insert into media_links (media_id, target_type, target_id) values (${id}, ${l.targetType}, ${l.targetId}) on conflict do nothing`;
        if (type === 'photo' && HAS_MAIN_PHOTO.includes(l.targetType)) await ensureMainPhoto(l.targetType, l.targetId);
      }
      const rows = await sql`select media_id, target_type, target_id, is_primary, created_at from media_links where media_id = ${id}`;
      res.status(201).json(toMedia({ id, type, filename, title, content_type: contentType, size: data.length, created_at: new Date().toISOString() }, rows));
      return;
    }

    // One change per request: rename, link, unlink, or make a bird's main photo.
    if (req.method === 'PATCH') {
      const id = String(query.id || '');
      const b = req.body || {};
      const found = await sql`select type from media where id = ${id}`;
      if (!found.length) { res.status(404).json({ error: 'File not found' }); return; }
      if (typeof b.title === 'string') {
        await sql`update media set title = ${b.title.trim().slice(0, 160)} where id = ${id}`;
      } else if (b.link) {
        const l = cleanLink(b.link);
        if (!l || !(await targetExists(l))) { res.status(404).json({ error: 'That record wasn’t found' }); return; }
        await sql`insert into media_links (media_id, target_type, target_id) values (${id}, ${l.targetType}, ${l.targetId}) on conflict do nothing`;
        if (found[0].type === 'photo' && HAS_MAIN_PHOTO.includes(l.targetType)) await ensureMainPhoto(l.targetType, l.targetId);
      } else if (b.unlink) {
        const l = cleanLink(b.unlink);
        if (!l) { res.status(400).json({ error: 'Nothing to unlink' }); return; }
        await sql`delete from media_links where media_id = ${id} and target_type = ${l.targetType} and target_id = ${l.targetId}`;
        if (HAS_MAIN_PHOTO.includes(l.targetType)) await ensureMainPhoto(l.targetType, l.targetId);
      } else if (b.primary) {
        const l = cleanLink(b.primary);
        if (!l || !HAS_MAIN_PHOTO.includes(l.targetType)) { res.status(400).json({ error: 'That doesn’t have a main photo' }); return; }
        await sql`update media_links set is_primary = (media_id = ${id}) where target_type = ${l.targetType} and target_id = ${l.targetId}
                  and media_id in (select id from media where type = 'photo')`;
      } else if (b.order) { // drag-to-reorder: the first photo becomes the main one
        const t = b.order.targetType;
        const tid = String(b.order.targetId || '');
        const ids = Array.isArray(b.order.ids) ? b.order.ids.map(String).slice(0, 100) : [];
        if (!HAS_MAIN_PHOTO.includes(t) || !tid || !ids.length) { res.status(400).json({ error: 'Nothing to reorder' }); return; }
        for (let i = 0; i < ids.length; i++) { // the order is kept in each link's timestamp (oldest = first)
          await sql`update media_links set created_at = '2000-01-01T00:00:00Z'::timestamptz + (${i} * interval '1 second'), is_primary = ${i === 0}
                    where media_id = ${ids[i]} and target_type = ${t} and target_id = ${tid}`;
        }
      } else {
        res.status(400).json({ error: 'Nothing to change' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    // Delete the file itself (every link goes with it).
    if (req.method === 'DELETE') {
      const id = String(query.id || '');
      const birds = await sql`select target_type, target_id from media_links where media_id = ${id} and target_type = any(${HAS_MAIN_PHOTO})`;
      await sql`delete from media where id = ${id}`;
      for (const r of birds) await ensureMainPhoto(r.target_type, r.target_id);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Could not handle that file' });
  }
};

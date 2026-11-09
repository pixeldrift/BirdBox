// Signed media links. An <img> or a PDF link can't send the login header, so each file URL the API hands out carries a
// short-lived signature naming the account and the file; the file endpoint checks it. (In 'off' mode there is one account and
// no signing.)  The key is MEDIA_SECRET, or — if that isn't set — derived from the database URL, which is already secret.
const crypto = require('crypto');
const auth = require('./auth');

const LIFETIME_MS = 12 * 60 * 60 * 1000;

function key() { return process.env.MEDIA_SECRET || crypto.createHash('sha256').update('media|' + (process.env.DATABASE_URL || 'dev')).digest('hex'); }
function mac(account, id, exp) { return crypto.createHmac('sha256', key()).update(account + '|' + id + '|' + exp).digest('hex').slice(0, 32); }

// '' when signing isn't needed, else '&a=…&e=…&s=…' to add to a file URL.
function signature(account, id) {
  if (!auth.required()) return '';
  const exp = Date.now() + LIFETIME_MS;
  return '&a=' + encodeURIComponent(account) + '&e=' + exp + '&s=' + mac(account, id, exp);
}

// The account a signed file request is for, or null if the link isn't signed, has expired or was tampered with.
function accountFromRequest(req) {
  if (req.method !== 'GET') return null; // a signed link only ever reads the file
  const q = req.query || {};
  if (!q.id || !q.s || !q.a || !q.e) return null;
  if (Number(q.e) < Date.now()) return null;
  const want = mac(String(q.a), String(q.id), String(q.e));
  const got = String(q.s);
  if (got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return null;
  return String(q.a);
}

module.exports = { signature, accountFromRequest };

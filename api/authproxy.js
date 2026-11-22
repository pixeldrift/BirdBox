// A same-origin door to Neon Auth, as in Lilac. The browser calls /api/auth/... on this site (vercel.json rewrites it to
// /api/authproxy?p=...) and this passes the request on to the auth service, so the session cookie it sets belongs to this site —
// a first-party cookie. Called straight, the auth service's cookie is third-party, which Safari and iPhone home-screen apps refuse
// to keep (sign-in seems to work, then there is no session). This site's address must still be a trusted origin in Neon Auth.
const { authUrl } = require('./_lib/auth');

// headers that describe the hop, not the message
const SKIP_REQUEST = new Set(['host', 'connection', 'content-length', 'accept-encoding', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-vercel-id', 'x-real-ip', 'forwarded']);
const SKIP_RESPONSE = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie']);

function targetFor(req, base) {
  const upstream = new URL(base);
  const q = req.query || {};
  const rest = '/' + String(q.p || '').replace(/^\/+/, '');
  const search = new URLSearchParams(String(req.url || '').split('?')[1] || '');
  search.delete('p');
  return upstream.origin + upstream.pathname.replace(/\/$/, '') + rest + (search.toString() ? '?' + search.toString() : '');
}

module.exports = async function handler(req, res) {
  const base = authUrl();
  if (!base) { res.status(503).json({ error: 'The auth URL is not set on the server (NEON_AUTH_BASE_URL).' }); return; }
  try {
    const headers = {};
    Object.keys(req.headers || {}).forEach((k) => { if (!SKIP_REQUEST.has(k.toLowerCase())) headers[k] = req.headers[k]; });
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (Buffer.isBuffer(req.body) || typeof req.body === 'string') body = req.body;
      else if (req.body && typeof req.body === 'object') body = JSON.stringify(req.body);
    }
    const upstream = await fetch(targetFor(req, base), { method: req.method, headers, body, redirect: 'manual' });

    upstream.headers.forEach((v, k) => { if (!SKIP_RESPONSE.has(k.toLowerCase())) res.setHeader(k, v); });
    // cookies: drop any Domain so each one stays with this site's own host
    const cookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : [];
    if (cookies.length) res.setHeader('set-cookie', cookies.map((c) => c.replace(/;\s*domain=[^;]*/i, '')));
    // a redirect back to the auth service stays on this site
    const loc = upstream.headers.get('location');
    const upBase = new URL(base);
    if (loc && loc.startsWith(upBase.origin)) {
      const host = (req.headers['x-forwarded-host'] || req.headers.host || '');
      const proto = req.headers['x-forwarded-proto'] || 'https';
      res.setHeader('location', proto + '://' + host + '/api/auth' + loc.slice(upBase.origin.length + upBase.pathname.replace(/\/$/, '').length));
    }
    if (!upstream.headers.get('cache-control')) res.setHeader('cache-control', 'no-store');
    res.status(upstream.status);
    res.send(upstream.status === 204 || upstream.status === 304 ? '' : Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error('auth proxy failed:', err.message);
    res.status(502).json({ error: 'Could not reach the sign-in service.' });
  }
};

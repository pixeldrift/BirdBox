// Who is making this request? BirdBox uses Neon Auth (Neon's managed Better Auth): the browser sends the signed-in user's JWT as
// `Authorization: Bearer …` and we check its signature against the auth service's public keys. Modes (env AUTH_MODE):
//   (unset)  off  — no logins yet: every request is the 'legacy' account, as before accounts existed.
//   neon          — verify the Neon Auth token. Needs NEON_AUTH_URL (the same value as VITE_NEON_AUTH_URL in your other apps,
//                   e.g. https://ep-xxx.neonauth.<region>.aws.neon.tech/neondb/auth). Optional NEON_AUTH_JWKS_URL overrides the keys URL.
//   test          — trust x-test-auth-id / x-test-email headers (or a `test:<id>:<email>` token). Automated tests only; never in production.
//
// Neon Auth tokens: EdDSA (Ed25519), 15 minutes, `sub` = user id, `email`, and `iss` / `aud` both equal to the ORIGIN of the auth URL
// (scheme + host, no path). Keys live at <auth url>/.well-known/jwks.json.
const { createRemoteJWKSet, jwtVerify } = require('jose');

let remoteKeys = null;
function keysFor(url) {
  if (!remoteKeys || remoteKeys.url !== url) remoteKeys = { url, set: createRemoteJWKSet(new URL(url)) };
  return remoteKeys.set;
}

function mode() { return process.env.AUTH_MODE || 'off'; }
function required() { return mode() !== 'off'; }

function tokenFrom(req) {
  const h = req.headers || {};
  const bearer = String(h.authorization || '');
  return /^bearer /i.test(bearer) ? bearer.slice(7).trim() : '';
}

// -> { authId, email } for a valid login, or null when there isn't one (or auth is off). Throws on a bad token.
// `getKeys` lets tests supply their own key set instead of fetching the real one.
async function identify(req, getKeys) {
  const m = mode();
  if (m === 'off') return null;
  const h = req.headers || {};
  if (m === 'test') { // 'test:<id>:<email>' as the token, or the two headers
    const t = tokenFrom(req);
    if (/^test:/.test(t)) { const p = t.split(':'); return { authId: p[1], email: p.slice(2).join(':') }; }
    return h['x-test-auth-id'] ? { authId: String(h['x-test-auth-id']), email: String(h['x-test-email'] || '') } : null;
  }
  const token = tokenFrom(req);
  if (!token) return null;
  const base = (process.env.NEON_AUTH_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('Logins are not configured (NEON_AUTH_URL)');
  const origin = new URL(base).origin;
  const jwks = process.env.NEON_AUTH_JWKS_URL || base + '/.well-known/jwks.json';
  const { payload } = await jwtVerify(token, getKeys ? getKeys : keysFor(jwks), { algorithms: ['EdDSA'], issuer: origin, audience: origin });
  if (!payload.sub) throw new Error('Token has no user');
  return { authId: String(payload.sub), email: String(payload.email || '') };
}

module.exports = { identify, required, mode };

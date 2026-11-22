// Who is making this request? Same method as Lilac: Neon Auth (managed Better Auth). The browser sends the signed-in user's JWT as
// `Authorization: Bearer …`; we check its signature against the auth service's public keys and that the issuer is that service, and
// use the token's `sub` as the user.
//
//   NEON_AUTH_BASE_URL  the Auth URL from the Neon console (also read from VITE_NEON_AUTH_URL if that is what you have set)
//   NEON_AUTH_JWKS_URL  optional: where the keys are, if not <auth url>/.well-known/jwks.json
//   AUTH_MODE           optional: 'off' forces logins off, 'test' is for automated tests. Left unset, logins are on exactly when an
//                       auth URL is set — and off (one account, no sign-in) when it isn't, which is how the app ran before accounts.
// Tokens: EdDSA (Ed25519), about 15 minutes; `iss` is the origin of the auth URL (scheme + host, no path).
const { createRemoteJWKSet, jwtVerify } = require('jose');

function authUrl() { return (process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL || '').replace(/\/+$/, ''); }

let remoteKeys = null;
function keysFor(url) {
  if (!remoteKeys || remoteKeys.url !== url) remoteKeys = { url, set: createRemoteJWKSet(new URL(url)) };
  return remoteKeys.set;
}

function mode() {
  const m = process.env.AUTH_MODE;
  if (m === 'off' || m === 'test') return m;
  return authUrl() ? 'neon' : 'off';
}
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
  const base = authUrl();
  if (!base) throw new Error('Logins are not configured (NEON_AUTH_BASE_URL)');
  const jwks = process.env.NEON_AUTH_JWKS_URL || base + '/.well-known/jwks.json';
  const { payload } = await jwtVerify(token, getKeys ? getKeys : keysFor(jwks), { algorithms: ['EdDSA'], issuer: new URL(base).origin });
  if (!payload.sub) throw new Error('Token has no user');
  return { authId: String(payload.sub), email: String(payload.email || '') };
}

module.exports = { identify, required, mode, authUrl };

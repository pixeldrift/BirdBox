// Who is making this request? BirdBox uses Neon Auth (Stack Auth): the browser sends the signed-in user's access token and
// we check its signature against the project's public keys. Modes (env AUTH_MODE):
//   (unset)  off  — no logins yet: every request is the 'legacy' account, as before accounts existed.
//   stack         — verify the Stack Auth / Neon Auth token (needs STACK_PROJECT_ID, or STACK_JWKS_URL).
//   test          — trust x-test-auth-id / x-test-email headers. For automated tests only; never set in production.
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
  return h['x-stack-access-token'] || (/^bearer /i.test(bearer) ? bearer.slice(7) : '');
}

// -> { authId, email } for a valid login, or null when there isn't one (or auth is off). Throws on a bad token.
// `getKeys` lets tests supply their own key set instead of fetching Stack's.
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
  const project = process.env.STACK_PROJECT_ID;
  const url = process.env.STACK_JWKS_URL || (project ? 'https://api.stack-auth.com/api/v1/projects/' + project + '/.well-known/jwks.json' : '');
  if (!url && !getKeys) throw new Error('Logins are not configured (STACK_PROJECT_ID)');
  const { payload } = await jwtVerify(token, getKeys ? getKeys : keysFor(url), project ? { audience: project } : {});
  if (!payload.sub) throw new Error('Token has no user');
  return { authId: String(payload.sub), email: String(payload.email || payload.primary_email || '') };
}

module.exports = { identify, required, mode };

// The one way API handlers talk to the database. Each request gets its own connection, switches to the low-privilege role
// birdbox_app and tells Postgres which account it is (app.account_id) — from then on row-level security (sql/038) hides every
// other account's rows, so a handler can't leak another account's data even by mistake. Handlers just use `sql` as before.
//
//   module.exports = withAccount(async function handler(req, res) { const rows = await sql`select * from birds`; … });
//   withAccount(handler, { allowNew: true })   also serves a login that has no account yet (the account bootstrap)
//   withAccount(handler, { public: true })     no login needed (the shared species list)
//   sql`…` / sql(text, params)  →  rows;  sql.transaction([sql`…`, sql`…`])  →  all or nothing
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { AsyncLocalStorage } = require('async_hooks');
const auth = require('./auth');

try { neonConfig.webSocketConstructor = require('ws'); } catch (err) { /* Node 22+ has WebSocket built in */ }

// Each request keeps its own connection and sets its account on it, so this needs a DIRECT Neon connection string — not the
// pooled one (host contains "-pooler"). A shared pooled backend could carry one request's account setting into another's.
let pool = null;
function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || '';
    if (/-pooler\./.test(url)) throw new Error('DATABASE_URL must be the direct (non-pooled) Neon connection string — the host should not contain "-pooler".');
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

const store = new AsyncLocalStorage();
function session() {
  const s = store.getStore();
  if (!s) throw new Error('Database used outside a request');
  return s;
}

// A query that runs when awaited — or, handed to sql.transaction, together with the others in one transaction.
function lazy(text, params) {
  let promise = null;
  const q = { text, params, then(resolve, reject) {
    if (!promise) promise = session().client.query(text, params).then((r) => r.rows);
    return promise.then(resolve, reject);
  } };
  return q;
}

function sql(strings, ...vals) {
  if (typeof strings === 'string') return lazy(strings, vals[0] || []);
  let text = '';
  strings.forEach((s, i) => { text += s + (i < vals.length ? '$' + (i + 1) : ''); });
  return lazy(text, vals);
}

sql.transaction = async function transaction(queries) {
  const { client } = session();
  await client.query('begin');
  try {
    const out = [];
    for (const q of queries) out.push((await client.query(q.text, q.params)).rows);
    await client.query('commit');
    return out;
  } catch (err) {
    try { await client.query('rollback'); } catch (e) { /* connection already gone */ }
    throw err;
  }
};

function account() { return session().accountId; }
function identity() { return session().identity; }

// Used by the account bootstrap, which creates the account a login belongs to.
async function setAccount(accountId) {
  const s = session();
  s.accountId = accountId;
  await s.client.query("select set_config('app.account_id', $1, false)", [accountId]);
}
async function setSetting(name, value) {
  await session().client.query('select set_config($1, $2, false)', [name, value]);
}

//   withAccount(handler, { signed: function (req) → accountId | null })   also serves requests that carry a valid signed link
//     (image and PDF links can't send a login header, so media URLs are signed — see api/_lib/signing.js)
function withAccount(handler, opts) {
  opts = opts || {};
  return async function (req, res) {
    let who = null;
    const signedAccount = opts.signed ? opts.signed(req) : null;
    if (!opts.public && !signedAccount) {
      try { who = await auth.identify(req); } catch (err) { res.status(401).json({ error: 'Please sign in again', code: 'signin' }); return; }
      if (auth.required() && !who) { res.status(401).json({ error: 'Please sign in', code: 'signin' }); return; }
    }
    const client = await getPool().connect();
    let broken = false;
    try {
      try {
        await client.query('set role birdbox_app');
      } catch (err) {
        // sql/038 hasn't been run yet: until it is, behave as before accounts existed (one account, no logins).
        if (err.code === '22023' || err.code === '42704') { if (auth.required()) throw err; } else throw err;
      }
      const s = { client, identity: who, accountId: null };
      if (signedAccount) s.accountId = signedAccount;
      else if (!opts.public) {
        if (!auth.required()) s.accountId = 'legacy';
        else {
          await client.query("select set_config('app.auth_id', $1, false)", [who.authId]);
          const link = (await client.query('select account_id, user_id from auth_links where auth_id = $1', [who.authId])).rows[0];
          if (link) { s.accountId = link.account_id; s.userId = link.user_id; }
          else if (!opts.allowNew) { res.status(403).json({ error: 'No account yet', code: 'no_account' }); return; }
        }
      }
      if (s.accountId) await client.query("select set_config('app.account_id', $1, false)", [s.accountId]);
      await store.run(s, () => handler(req, res));
    } catch (err) {
      broken = true;
      throw err;
    } finally {
      try { await client.query('discard all'); } catch (e) { broken = true; }
      client.release(broken ? true : undefined);
    }
  };
}

module.exports = { sql, withAccount, account, identity, setAccount, setSetting };

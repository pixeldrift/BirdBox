const { sql, withAccount, account, identity, setAccount, setSetting } = require('../_lib/db');
const auth = require('../_lib/auth');

// Your account: who you are, what the aviary is called, and the sample data.
//   GET   → { account: { id, name }, me: { userId, role, name }, demo: { loaded } }. The first time a login is seen, this creates
//           its account (an owner, an aviary, and — by default — a copy of the sample aviary to look around in).
//   POST  { action: 'load-demo' | 'remove-demo' | 'rename', name? }
//
// The sample data lives in the 'demo' account (see sql/039_demo_data.sql); loading copies it into yours, flagged is_demo so
// "remove sample data" deletes exactly those rows and nothing you added.

// Tables copied from the demo account, in a safe order. (Photos, menus and your own settings are never copied.)
const DEMO_TABLES = ['locations', 'buildings', 'rooms', 'cages', 'contacts', 'users', 'birds', 'transactions', 'health_records', 'show_results',
  'waybills', 'waybill_files', 'bird_transfers', 'supplies', 'care_items', 'tasks', 'task_done', 'events', 'event_links'];

async function columnsOf(table) {
  const rows = await sql(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [table]);
  return rows.map((r) => r.column_name).filter((c) => c !== 'account_id' && c !== 'is_demo');
}

async function loadDemo() {
  await setSetting('app.loading_demo', 'on');
  try {
    for (const t of DEMO_TABLES) {
      const cols = await columnsOf(t);
      if (!cols.length) continue; // that table isn't there yet
      const list = cols.map((c) => '"' + c + '"').join(', ');
      await sql(`insert into ${t} (account_id, is_demo, ${list}) select current_setting('app.account_id'), true, ${list} from ${t} where account_id = 'demo' on conflict do nothing`);
    }
  } finally {
    await setSetting('app.loading_demo', 'off');
  }
}

async function removeDemo() {
  for (const t of DEMO_TABLES.slice().reverse()) {
    try { await sql(`delete from ${t} where is_demo`); } catch (err) { /* table not there yet */ }
  }
}

async function demoLoaded() {
  return (await sql`select 1 from birds where is_demo limit 1`).length > 0 || (await sql`select 1 from cages where is_demo limit 1`).length > 0;
}

function newAccountId() { return 'acct-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// A login we haven't seen before: make its account (or, for the one email named in LEGACY_OWNER_EMAIL, adopt the data that
// existed before accounts did).
async function bootstrap() {
  const who = identity();
  const legacyOwner = (process.env.LEGACY_OWNER_EMAIL || '').trim().toLowerCase();
  let claimLegacy = false;
  if (legacyOwner && who.email && who.email.toLowerCase() === legacyOwner) {
    await setAccount('legacy');
    claimLegacy = true;
  }
  const accountId = claimLegacy ? 'legacy' : newAccountId();
  await setAccount(accountId);
  const first = (who.email || 'You').split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let userId;
  if (claimLegacy) {
    const owner = (await sql`select id from users where role = 'Owner' order by id limit 1`)[0];
    userId = owner ? owner.id : null;
  } else {
    await sql`insert into accounts (id, name) values (${accountId}, 'My Aviary')`;
    await sql`insert into aviary (id, name) values ('main', 'My Aviary')`;
  }
  if (!userId) {
    userId = 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await sql`insert into users (id, first_name, last_name, role, status, email, phone, notes) values (${userId}, ${first}, '', 'Owner', 'Active', ${who.email || ''}, '', '')`;
    await sql`insert into contacts (id, name, type, email, phone, user_id) values (${'c-' + userId}, ${first}, 'Team', ${who.email || ''}, '', ${userId}) on conflict do nothing`;
  }
  await sql`insert into auth_links (auth_id, account_id, user_id, email) values (${who.authId}, ${accountId}, ${userId}, ${who.email || ''})`;
  if (!claimLegacy) await loadDemo(); // new accounts start with the sample aviary so there's something to look at
  return accountId;
}

async function profile() {
  const acct = (await sql`select id, name from accounts where id = ${account()}`)[0] || { id: account(), name: 'My Aviary' };
  const av = (await sql`select name from aviary where id = 'main'`)[0];
  const link = identity() ? (await sql`select user_id from auth_links where auth_id = ${identity().authId}`)[0] : null;
  const me = link && link.user_id ? (await sql`select id, first_name, last_name, role from users where id = ${link.user_id}`)[0] : null;
  return {
    account: { id: acct.id, name: av ? av.name : acct.name, signedIn: auth.required() },
    me: me ? { userId: me.id, role: me.role, name: (me.first_name + ' ' + me.last_name).trim() } : null,
    demo: { loaded: await demoLoaded() },
  };
}

module.exports = withAccount(async function handler(req, res) {
  try {
    if (!account()) await bootstrap();
    if (req.method === 'GET') { res.status(200).json(await profile()); return; }
    if (req.method === 'POST') {
      const action = String((req.body || {}).action || '');
      if (action === 'load-demo') {
        if (await demoLoaded()) { res.status(409).json({ error: 'The sample data is already loaded' }); return; }
        await loadDemo();
      } else if (action === 'remove-demo') {
        await removeDemo();
      } else if (action === 'rename') {
        const name = String((req.body || {}).name || '').trim().slice(0, 120);
        if (!name) { res.status(400).json({ error: 'Give it a name' }); return; }
        await sql`update accounts set name = ${name} where id = ${account()}`;
        await sql`update aviary set name = ${name} where id = 'main'`;
      } else { res.status(400).json({ error: 'Unknown action' }); return; }
      res.status(200).json(await profile());
      return;
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('account:', err.message);
    res.status(500).json({ error: 'Could not handle that request' });
  }
}, { allowNew: true });

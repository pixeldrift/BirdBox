// Health records (DNA certificates, immunizations, surgical sexing reports, vet
// visits), loaded from Postgres (via /api/health) instead of hardcoded here —
// see sql/004_health.sql for the schema and the seed data this replaced. Added
// records POST to the same endpoint (js/screens/health.js) and get pushed into
// this array on success so they show up immediately.
//
// Attachments (DNA certificates, vaccine records…) are stored in the database like every other
// uploaded file — see js/data/files.js and sql/012_attachments.sql.
const RECORD_TYPES = ['DNA Certificate', 'Disease Test', 'Immunization', 'Surgical Sexing', 'Vet Visit', 'Other'];

// Disease tests: each one is a record (type 'Disease Test') with the disease tested for, the result, the date and the lab.
// A bird can have many; the newest result per disease is its current status.
const TEST_RESULTS = ['Negative', 'Positive', 'Inconclusive', 'Pending'];
const DISEASE_SUGGESTIONS = [
  'Pullorum-Typhoid', 'Avian Influenza', 'Mycoplasma gallisepticum', 'Mycoplasma synoviae', 'Salmonella', 'Newcastle Disease',
  'Psittacosis (Chlamydia)', 'PBFD', 'Polyomavirus', 'Aspergillosis', 'Giardia', 'Macrorhabdus (AGY)', 'Mites / lice', 'Worms (fecal)',
];

var HEALTH_RECORDS_SAMPLE = [];

var healthLoaded = fetch('/api/records?type=health')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load health records');
    return res.json();
  })
  .then(function (records) {
    HEALTH_RECORDS_SAMPLE.length = 0;
    Array.prototype.push.apply(HEALTH_RECORDS_SAMPLE, records);
  })
  .catch(function (err) {
    console.error('Could not load health records from the server:', err);
  });

function healthRecordsForBird(birdId) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.birdId === birdId; });
}

function isTest(r) { return r.type === 'Disease Test'; }

function healthTestsForBird(birdId) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.birdId === birdId && isTest(r); })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
}

// The most recent test per disease for a bird: [{ disease, latest, history: [newest first] }], diseases A–Z.
function latestTests(birdId) {
  var by = {};
  healthTestsForBird(birdId).forEach(function (r) {
    var key = (r.disease || 'Unspecified').trim();
    (by[key] = by[key] || { disease: key, history: [] }).history.push(r);
  });
  return Object.keys(by).sort().map(function (k) { by[k].latest = by[k].history[0]; return by[k]; });
}

// Every disease that has been tested for on any bird, A–Z.
function testedDiseases() {
  var seen = {};
  HEALTH_RECORDS_SAMPLE.filter(isTest).forEach(function (r) { if (r.disease) seen[r.disease] = true; });
  return Object.keys(seen).sort();
}

function testResultClass(result) {
  return 'result-' + String(result || 'pending').toLowerCase();
}

function getHealthRecord(id) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.id === id; })[0] || null;
}

// Saves a new health record (the server chooses its id) and adds it to the local list.
// Resolves to the saved record.
function addHealthRecord(record) {
  return createRecord('health', {
    birdId: record.birdId, type: record.type, date: record.date,
    provider: record.provider, notes: record.notes, disease: record.disease || '', result: record.result || '',
  });
}


// ---- when a test is due again ----
// Starting defaults (months between tests; 0 = no routine retest). These are common practice, not rules — they vary by
// disease, program (NPIP, club, buyer) and state — so each one can be changed in Account → Settings → Test reminders.
const DEFAULT_TEST_INTERVALS = {
  'Pullorum-Typhoid': 12, 'Avian Influenza': 12, 'Mycoplasma gallisepticum': 12, 'Mycoplasma synoviae': 12, 'Salmonella': 12,
  'Psittacosis (Chlamydia)': 12, 'Giardia': 12, 'Worms (fecal)': 12, 'Macrorhabdus (AGY)': 12, 'Mites / lice': 12,
  'Newcastle Disease': 0, 'PBFD': 0, 'Polyomavirus': 0, 'Aspergillosis': 0,
};
const DUE_SOON_DAYS = 30;

var TEST_RULES = []; // the intervals you've changed: [{ id, disease, intervalMonths }]

var testRulesLoaded = fetch('/api/records?type=testrules')
  .then(function (res) { if (!res.ok) throw new Error('not ready'); return res.json(); })
  .then(function (list) { TEST_RULES.length = 0; Array.prototype.push.apply(TEST_RULES, list); })
  .catch(function () { /* sql/034 not run yet: the defaults apply */ });

// Months between tests for a disease (0 = no reminder): your setting, else the default, else none.
function testIntervalMonths(disease) {
  var rule = TEST_RULES.filter(function (r) { return r.disease === disease; })[0];
  if (rule) return Number(rule.intervalMonths) || 0;
  return DEFAULT_TEST_INTERVALS[disease] || 0;
}

function addMonthsISO(iso, n) {
  var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  var day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

// Where a test stands: { state: 'positive' | 'overdue' | 'soon' | 'ok' | 'pending' | 'none', due: ISO | '', days: days until due (negative = late), label }
function testStatus(r) {
  if (r.result === 'Positive') return { state: 'positive', due: '', days: 0, label: 'Positive' };
  if (r.result === 'Pending') return { state: 'pending', due: '', days: 0, label: 'Waiting on result' };
  var months = testIntervalMonths(r.disease);
  if (!months) return { state: 'none', due: '', days: 0, label: '' };
  var due = addMonthsISO(r.date, months);
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var days = Math.round((new Date(due + 'T00:00:00') - today) / 86400000);
  if (days < 0) return { state: 'overdue', due: due, days: days, label: 'Overdue by ' + (-days === 1 ? '1 day' : -days < 60 ? -days + ' days' : Math.round(-days / 30.4) + ' months') };
  if (days <= DUE_SOON_DAYS) return { state: 'soon', due: due, days: days, label: days === 0 ? 'Due today' : 'Due in ' + (days === 1 ? '1 day' : days + ' days') };
  return { state: 'ok', due: due, days: days, label: 'Next due ' + due };
}

// Is this record the newest test for its bird and disease? (Older ones are history; only the newest can be overdue.)
function isLatestTest(r) {
  if (!isTest(r)) return false;
  var newest = healthTestsForBird(r.birdId).filter(function (x) { return x.disease === r.disease; })[0];
  return !!newest && newest.id === r.id;
}

// Everything that needs a look, for birds still in the flock: positives, overdue and due-soon tests.
// -> [{ bird, test, status }], most urgent first.
function testAlerts() {
  var out = [];
  BIRDS_SAMPLE.forEach(function (bird) {
    if (birdIsArchived(bird)) return;
    latestTests(bird.id).forEach(function (g) {
      var st = testStatus(g.latest);
      if (st.state === 'positive' || st.state === 'overdue' || st.state === 'soon') out.push({ bird: bird, test: g.latest, status: st });
    });
  });
  var rank = { positive: 0, overdue: 1, soon: 2 };
  return out.sort(function (a, b) { return rank[a.status.state] - rank[b.status.state] || a.status.days - b.status.days; });
}

// Every disease we know about (defaults, ones you've logged, ones you've set), A–Z.
function knownDiseases() {
  var seen = {};
  Object.keys(DEFAULT_TEST_INTERVALS).concat(testedDiseases(), TEST_RULES.map(function (r) { return r.disease; })).forEach(function (d) { if (d) seen[d] = true; });
  return Object.keys(seen).sort();
}

// Saves your interval for a disease (creating or updating its row).
function setTestInterval(disease, months) {
  var rule = TEST_RULES.filter(function (r) { return r.disease === disease; })[0];
  return rule ? updateRecord('testrules', rule.id, { intervalMonths: months }) : createRecord('testrules', { disease: disease, intervalMonths: months });
}

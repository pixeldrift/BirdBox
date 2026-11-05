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

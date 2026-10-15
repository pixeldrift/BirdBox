// Health records (DNA certificates, immunizations, surgical sexing reports, vet
// visits), loaded from Postgres (via /api/health) instead of hardcoded here —
// see sql/004_health.sql for the schema and the seed data this replaced. Added
// records POST to the same endpoint (js/screens/health.js) and get pushed into
// this array on success so they show up immediately.
//
// Attachments (DNA certificates, vaccine records…) are stored in the database like every other
// uploaded file — see js/data/files.js and sql/012_attachments.sql.
const RECORD_TYPES = ['DNA Certificate', 'Immunization', 'Surgical Sexing', 'Vet Visit', 'Other'];

var HEALTH_RECORDS_SAMPLE = [];

var healthLoaded = fetch('/api/health')
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

function getHealthRecord(id) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.id === id; })[0] || null;
}

var _healthRecordSeq = 0;
function nextHealthRecordId() {
  _healthRecordSeq += 1;
  return 'hr-' + Date.now().toString(36) + '-' + _healthRecordSeq;
}

// Posts a new record to the server, then adds it to the local array on
// success so the caller can navigate straight to it.
function addHealthRecord(record) {
  return fetch('/api/health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  }).then(function (res) {
    if (!res.ok) throw new Error('Save failed');
    HEALTH_RECORDS_SAMPLE.push(record);
  });
}

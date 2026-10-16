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

function getHealthRecord(id) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.id === id; })[0] || null;
}

// Saves a new health record (the server chooses its id) and adds it to the local list.
// Resolves to the saved record.
function addHealthRecord(record) {
  return createRecord('health', {
    birdId: record.birdId, type: record.type, date: record.date,
    provider: record.provider, notes: record.notes,
  });
}

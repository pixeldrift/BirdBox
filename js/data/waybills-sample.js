// Shipping records (waybills), loaded from Postgres (via /api/waybills)
// instead of hardcoded here — see sql/006_waybills.sql for the schema and
// the seed data this replaced.
var WAYBILLS_SAMPLE = [];

var waybillsLoaded = fetch('/api/waybills')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load waybills');
    return res.json();
  })
  .then(function (waybills) {
    WAYBILLS_SAMPLE.length = 0;
    Array.prototype.push.apply(WAYBILLS_SAMPLE, waybills);
  })
  .catch(function (err) {
    console.error('Could not load waybills from the server:', err);
  });

function waybillClient(wb) {
  return wb.clientId ? getContact(wb.clientId) : null;
}

function waybillBirds(wb) {
  return wb.birdIds.map(getBird).filter(Boolean);
}

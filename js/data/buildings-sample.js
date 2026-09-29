// Lightweight building lookup, loaded from Postgres (via /api/buildings)
// instead of hardcoded here — see sql/005_buildings.sql for the schema and
// the seed data this replaced. Just enough to give a cage a friendly location
// name; BirdBox doesn't need a full Buildings/Cages entity yet — Birds.cage
// (a plain code like "F2-001" or "FLN") is grouped directly into "cages in
// use" by the Caging screen.
var BUILDINGS_SAMPLE = [];

var buildingsLoaded = fetch('/api/buildings')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load buildings');
    return res.json();
  })
  .then(function (buildings) {
    BUILDINGS_SAMPLE.length = 0;
    Array.prototype.push.apply(BUILDINGS_SAMPLE, buildings);
  })
  .catch(function (err) {
    console.error('Could not load buildings from the server:', err);
  });

function buildingForCage(cageCode) {
  if (!cageCode) return null;
  var prefix = cageCode.indexOf('-') !== -1 ? cageCode.split('-')[0] : cageCode;
  return BUILDINGS_SAMPLE.filter(function (b) { return b.code === prefix; })[0] || null;
}

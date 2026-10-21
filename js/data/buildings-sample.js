// Lightweight building lookup, loaded from Postgres (via /api/buildings)
// instead of hardcoded here — see sql/005_buildings.sql for the schema and
// the seed data this replaced. Just enough to give a cage a friendly location
// name; BirdBox doesn't need a full Buildings/Cages entity yet — Birds.cage
// (a plain code like "F2-001" or "FLN") is grouped directly into "cages in
// use" by the Caging screen.
var BUILDINGS_SAMPLE = [];
var LOCATIONS_SAMPLE = [];
var CAGES_SAMPLE = [];

var buildingsLoaded = fetch('/api/records?type=buildings')
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

// Where birds live: Location > Building > Cage > birds. Every level is optional. A bird points at
// its cage by the cage's code (bird.cage); cages are records of their own (sql/014_locations_cages.sql),
// but a code on a bird with no cage record yet still counts as a cage ("not set up").
function loadList(type, target) {
  return fetch('/api/records?type=' + type)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + type);
      return res.json();
    })
    .then(function (list) {
      target.length = 0;
      Array.prototype.push.apply(target, list);
    })
    .catch(function (err) {
      console.error('Could not load ' + type + ' from the server:', err);
    });
}

var ROOMS_SAMPLE = [];
// "My Aviary": the one master record every location, building, room and cage sits under (sql/018_aviary_rooms.sql).
var AVIARY = { id: 'main', name: 'My Aviary', description: '', address: '', phone: '', email: '', website: '', socials: '' };
var AVIARY_ROWS = [];
var aviaryLoaded = loadList('aviary', AVIARY_ROWS).then(function () {
  if (AVIARY_ROWS[0]) Object.assign(AVIARY, AVIARY_ROWS[0]);
});
var roomsLoaded = loadList('rooms', ROOMS_SAMPLE);
var locationsLoaded = loadList('locations', LOCATIONS_SAMPLE);
var cagesLoaded = loadList('cages', CAGES_SAMPLE);

function getCage(code) {
  return CAGES_SAMPLE.filter(function (c) { return c.code === code; })[0] || null;
}

function getBuilding(code) {
  return BUILDINGS_SAMPLE.filter(function (b) { return b.code === code; })[0] || null;
}

function getLocation(id) {
  return LOCATIONS_SAMPLE.filter(function (l) { return l.id === id; })[0] || null;
}

function getRoom(id) {
  return ROOMS_SAMPLE.filter(function (r) { return r.id === id; })[0] || null;
}

// The room a cage is in, if it was filed under one.
function roomForCage(cageCode) {
  var rec = cageCode ? getCage(cageCode) : null;
  return rec && rec.roomId ? getRoom(rec.roomId) : null;
}

// The building a room is in: the one it was filed under, else the one its location... none.
function buildingForRoom(room) {
  return room && room.buildingCode ? getBuilding(room.buildingCode) : null;
}

// The location a room is on: directly, or through its building.
function roomLocation(room) {
  if (!room) return null;
  if (room.locationId) return getLocation(room.locationId);
  return buildingLocation(buildingForRoom(room));
}

// The building a cage is in: the one it was filed under (directly or through its room), else the one its code starts with.
function buildingForCage(cageCode) {
  if (!cageCode) return null;
  var rec = getCage(cageCode);
  var room = roomForCage(cageCode);
  if (room) return buildingForRoom(room);
  if (rec && rec.buildingCode) return getBuilding(rec.buildingCode);
  var prefix = cageCode.indexOf('-') !== -1 ? cageCode.split('-')[0] : cageCode;
  return getBuilding(prefix);
}

function buildingLocation(building) {
  return building && building.locationId ? getLocation(building.locationId) : null;
}

// Every cage: the set-up ones plus any code used on a bird that has no record yet.
function allCages() {
  var out = CAGES_SAMPLE.map(function (c) { return { code: c.code, buildingCode: c.buildingCode, roomId: c.roomId, description: c.description, setUp: true }; });
  var have = {};
  out.forEach(function (c) { have[c.code] = true; });
  BIRDS_SAMPLE.forEach(function (b) {
    if (b.cage && !have[b.cage]) {
      have[b.cage] = true;
      out.push({ code: b.cage, buildingCode: null, description: '', setUp: false });
    }
  });
  return out.sort(function (a, b) { return a.code.localeCompare(b.code); });
}

function birdsInCage(code) {
  return BIRDS_SAMPLE.filter(function (b) { return b.cage === code; });
}

// "Building 2 · Home farm" for a cage — whatever of it is known.
function cagePlaceLabel(cageCode) {
  var b = buildingForCage(cageCode);
  var room = roomForCage(cageCode);
  var loc = room ? roomLocation(room) : buildingLocation(b);
  return [b ? 'Building ' + b.nickname : '', room ? room.name : '', loc ? loc.name : ''].filter(Boolean).join(' · ') || 'No building set';
}

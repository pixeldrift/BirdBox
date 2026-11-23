// Places — buildings, rooms, cages, coops, shelves… anything — loaded from Postgres (see sql/040_places.sql). Also My Aviary, the master record.
// Where birds live: one tree of PLACES. A place is a name, a type you choose (Building, Room, Cage, Coop, Box, Shelf… or your own) and a parent —
// any place can sit inside any other (sql/040_places.sql). A bird points at its place by the place's id (bird.cage), and a code on a bird with
// no place record yet still counts as a place ("not set up").
var PLACES = [];
var PLACE_TYPE_ROWS = [];
var BUILDINGS_SAMPLE = []; // (kept empty: buildings are places now)
var LOCATIONS_SAMPLE = [];
var CAGES_SAMPLE = [];
var ROOMS_SAMPLE = [];

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

// "My Aviary": the one master record every location, building, room and cage sits under (sql/018_aviary_rooms.sql).
var AVIARY = { id: 'main', name: 'My Aviary', description: '', address: '', phone: '', email: '', website: '', socials: '', keeps: '' };
var AVIARY_ROWS = [];
var aviaryLoaded = loadList('aviary', AVIARY_ROWS).then(function () {
  if (AVIARY_ROWS[0]) Object.assign(AVIARY, AVIARY_ROWS[0]);
});
var placesLoaded = loadList('places', PLACES);
var placeTypesLoaded = loadList('placeTypes', PLACE_TYPE_ROWS);
var buildingsLoaded = placesLoaded, roomsLoaded = placesLoaded, locationsLoaded = placesLoaded, cagesLoaded = placesLoaded;

// ---- the types ----
// What the app ships with. "Cage" is shown as "Coop" (etc.) for people who keep chickens — see js/terms.js.
var PLACE_TYPE_DEFAULTS = ['Location', 'Building', 'Room', 'Cage', 'Coop', 'Run', 'Pen', 'Box', 'Shelf', 'Flight', 'Brooder', 'Nest Box'];

function placeTypeLabel(type) {
  return type === 'Cage' ? T('Cage') : type;
}

// Every type to pick from: the ones that ship with the app, the ones you've added, and any already in use.
function placeTypes() {
  var seen = {}, out = [];
  function add(t) {
    var label = placeTypeLabel(t);
    if (!t || seen[label.toLowerCase()]) return;
    seen[label.toLowerCase()] = true;
    out.push(t);
  }
  PLACE_TYPE_DEFAULTS.forEach(add);
  PLACE_TYPE_ROWS.slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(b.name); }).forEach(function (r) { add(r.name); });
  PLACES.forEach(function (p) { add(p.type); });
  return out;
}

// ---- the tree ----
function getPlace(id) {
  if (!id) return null;
  for (var i = 0; i < PLACES.length; i++) if (PLACES[i].id === id) return PLACES[i];
  return null;
}

// What to call a place when all you have is its id (a code on a bird with no place record just shows as itself).
function placeName(id) {
  var p = getPlace(id);
  return p ? p.name : id || '';
}

function placeParent(place) {
  return place && place.parentId ? getPlace(place.parentId) : null;
}

// The places above one, outermost first: [Home farm, Building 6, Flight room].
function placeAncestors(place) {
  var out = [], cur = placeParent(place), guard = 0;
  while (cur && guard++ < 100) { out.unshift(cur); cur = placeParent(cur); }
  return out;
}

function placeChildren(id) {
  return PLACES.filter(function (p) { return p.parentId === id; });
}

// Everything inside a place, however deep.
function placeDescendants(id) {
  var out = [];
  (function rec(pid, depth) {
    if (depth > 100) return;
    placeChildren(pid).forEach(function (c) { out.push(c); rec(c.id, depth + 1); });
  })(id, 0);
  return out;
}

// "Home farm › Building 6" — where a place is, not counting the place itself.
function placePathLabel(id) {
  var p = getPlace(id);
  return p ? placeAncestors(p).map(function (a) { return a.name; }).join(' › ') : '';
}

// Places you'd think of as holding birds directly: the ones with nothing inside, plus any that have birds in them, plus codes used on birds
// that have no record yet. [{ code (the id), name, parentId, description, type, setUp }]
function allCages() {
  var hasKids = {};
  PLACES.forEach(function (p) { if (p.parentId) hasKids[p.parentId] = true; });
  var hasBirds = {};
  BIRDS_SAMPLE.forEach(function (b) { if (b.cage && !birdIsArchived(b)) hasBirds[b.cage] = true; });
  var out = PLACES.filter(function (p) { return !hasKids[p.id] || hasBirds[p.id]; })
    .map(function (p) { return { code: p.id, name: p.name, parentId: p.parentId, description: p.description, type: p.type, setUp: true }; });
  var have = {};
  PLACES.forEach(function (p) { have[p.id] = true; });
  BIRDS_SAMPLE.forEach(function (b) {
    if (b.cage && !have[b.cage]) { have[b.cage] = true; out.push({ code: b.cage, name: b.cage, parentId: null, description: '', type: 'Cage', setUp: false }); }
  });
  return out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
}

function birdsInCage(id) {
  return BIRDS_SAMPLE.filter(function (b) { return b.cage === id && !birdIsArchived(b); });
}

// "Home farm › Building 6" for a place — whatever of it is known.
function cagePlaceLabel(id) {
  return placePathLabel(id) || 'Not inside anything';
}

// A hint (never a rule) for what kind of place to offer when adding one inside `parentId` ('' = at the top): what its neighbours are,
// else the usual next step down.
function suggestedPlaceType(parentId) {
  var kids = PLACES.filter(function (p) { return (p.parentId || '') === (parentId || ''); });
  if (kids.length) {
    var count = {};
    kids.forEach(function (k) { count[k.type] = (count[k.type] || 0) + 1; });
    return Object.keys(count).sort(function (a, b) { return count[b] - count[a]; })[0];
  }
  var parent = getPlace(parentId);
  var next = { Location: 'Building', Building: 'Room', Room: 'Cage', Coop: 'Nest Box', Run: 'Cage', Shelf: 'Box' };
  return parent ? next[parent.type] || 'Cage' : 'Building';
}

// A place given as text (a CSV import, say): the place with that id, else the one with that name, else the text itself (a name not set up yet).
function placeIdForText(text) {
  var t = String(text || '').trim();
  if (!t) return '';
  if (getPlace(t)) return t;
  var same = PLACES.filter(function (p) { return p.name.toLowerCase() === t.toLowerCase(); })[0];
  return same ? same.id : t;
}

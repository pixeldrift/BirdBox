// Bird records, loaded from Postgres (via /api/birds) instead of hardcoded here —
// see sql/001_birds.sql for the schema and the seed data this replaced.
//
// registryPublic: opt-in flag (default false — privacy-first, matches the product doc's
// "breeders are notoriously suspicious of online recordkeeping") controlling whether this
// bird's basic info is searchable in Registry -> Search. There's no separate registry
// entity: the public record is generated live from this same object, so toggling it (from
// the bird's own detail page, or from Registry -> Register's manage list) is the whole
// story — "automatic" inclusion, per the user's ask. See docs/roadmap.md for the planned
// granular (field-level) privacy this will grow into.
//
// photos: [{ id, url, isPrimary }]. Not persisted — these are session-only
// URL.createObjectURL() blobs (same pattern as Health Record attachments), so they're
// always empty right after a fetch. When no photo exists, avatars fall back to the
// taxonomy icon system in js/data/icon-taxonomy.js.
var BIRDS_SAMPLE = [];
var BIRDS_BY_ID = {};

function reindexBirds() {
  BIRDS_BY_ID = {};
  BIRDS_SAMPLE.forEach(function (b) { BIRDS_BY_ID[b.id] = b; });
}

// Resolved once the initial /api/birds fetch lands; js/app.js waits on this
// before the first route render so screens never see a half-loaded list.
var birdsLoaded = fetch('/api/birds')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load birds');
    return res.json();
  })
  .then(function (birds) {
    BIRDS_SAMPLE.length = 0;
    Array.prototype.push.apply(BIRDS_SAMPLE, birds);
    reindexBirds();
  })
  .catch(function (err) {
    console.error('Could not load birds from the server:', err);
  });

// Persists an edit to one bird (e.g. the Registry toggle) — updates the local
// copy immediately, then syncs to the server, reverting on failure.
function updateBird(id, changes) {
  var bird = getBird(id);
  if (!bird) return Promise.resolve();
  var previous = {};
  Object.keys(changes).forEach(function (key) { previous[key] = bird[key]; });
  Object.assign(bird, changes);

  return fetch('/api/birds/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  }).then(function (res) {
    if (!res.ok) throw new Error('Update failed');
  }).catch(function (err) {
    Object.assign(bird, previous);
    console.error('Could not save bird update, reverted:', err);
    throw err;
  });
}

function getBird(id) {
  return BIRDS_BY_ID[id] || null;
}

function birdChildren(id) {
  return BIRDS_SAMPLE.filter(function (b) { return b.motherId === id || b.fatherId === id; });
}

const SEX_LETTER = { Male: 'M', Female: 'F', Unsexed: 'U' };

function birdIdentifier(bird) {
  var sexPart = SEX_LETTER[bird.sex] || '?';
  var namePart = bird.name ? '"' + bird.name + '" ' : '';
  var mutationPart = bird.mutation ? bird.mutation + ' ' : '';
  return bird.band + ' - (' + sexPart + ') ' + namePart + mutationPart + bird.subspecies + ' ' + bird.species;
}

// Shorter label for chips/rows elsewhere (no band #, no sex letter).
function birdShortLabel(bird) {
  return (bird.name ? '"' + bird.name + '" ' : '') + bird.subspecies + ' ' + bird.species;
}

function birdPrimaryPhoto(bird) {
  if (!bird.photos.length) return null;
  return bird.photos.filter(function (p) { return p.isPrimary; })[0] || bird.photos[0];
}

var _photoSeq = 0;
function nextPhotoId() {
  _photoSeq += 1;
  return 'photo-' + _photoSeq;
}

// Awards and results: shows, races and trials a bird has been entered in (sql/036_show_results.sql). Each is a record with the
// event, date, class / category and placement. A bird's page lists its own and — as pedigree credentials — its parents' and
// grandparents'.
var AWARDS_SAMPLE = [];

var PLACEMENTS = ['1st', '2nd', '3rd', '4th', '5th', 'Best of Breed', 'Best of Variety', 'Best Opposite Sex', 'Champion', 'Reserve Champion', 'Best in Show', 'Participated'];
var AWARD_KINDS = ['Show', 'Race', 'Trial'];

var awardsLoaded = fetch('/api/records?type=awards')
  .then(function (res) { if (!res.ok) throw new Error('not ready'); return res.json(); })
  .then(function (list) { AWARDS_SAMPLE.length = 0; Array.prototype.push.apply(AWARDS_SAMPLE, list); })
  .catch(function () { /* sql/036 not run yet: no awards to show */ });

function getAward(id) {
  return AWARDS_SAMPLE.filter(function (a) { return a.id === id; })[0] || null;
}

function awardsForBird(birdId) {
  return AWARDS_SAMPLE.filter(function (a) { return a.birdId === birdId; })
    .sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
}

// Did it actually win something? (A placing, a best-of or a title — not just being entered.)
function isAwardWon(a) {
  return !!(a.placement && !/^(participat|entered|dnp|nq)/i.test(a.placement));
}

// The same show shows up under slightly different typing; compare names without case or stray spaces.
function normShow(name) { return String(name || '').trim().toLowerCase().replace(/\s+/g, ' '); }

// The awards from one show on one day (every bird that was entered).
function awardsAtShow(name, dateISO) {
  var key = normShow(name), d = String(dateISO).slice(0, 10);
  return AWARDS_SAMPLE.filter(function (a) { return normShow(a.event) === key && String(a.date || '').slice(0, 10) === d; });
}

// A result that's worth a badge: first place, a best-of, a champion.
function isTopPlacement(a) {
  return /^(1st|first)\b|best|champion/i.test(a.placement || '');
}

// "Best of Breed · Ohio National 2026"
function awardLabel(a) {
  var year = a.date ? String(a.date).slice(0, 4) : '';
  return [a.placement || 'Entered', a.event].filter(Boolean).join(' · ') + (year ? ' ' + year : '');
}

// The awards in a bird's pedigree: its parents' and grandparents'. -> [{ relation: 'Mother', bird, awards: [...] }]
function pedigreeAwards(bird) {
  var out = [];
  function walk(b, label, depth) {
    if (!b || depth > 2) return;
    var list = awardsForBird(b.id);
    if (list.length) out.push({ relation: label, bird: b, awards: list });
    if (depth < 2) {
      walk(b.motherId ? getBird(b.motherId) : null, depth === 0 ? 'Mother' : label + '’s mother', depth + 1);
      walk(b.fatherId ? getBird(b.fatherId) : null, depth === 0 ? 'Father' : label + '’s father', depth + 1);
    }
  }
  [['Mother', bird.motherId], ['Father', bird.fatherId]].forEach(function (p) {
    var parent = p[1] ? getBird(p[1]) : null;
    if (!parent) return;
    walk(parent, p[0], 1);
  });
  return out;
}

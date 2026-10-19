// Species lookup (the eBird/Clements list Birds of the World uses), served by /api/species.
// Species are *chosen* from this list, never typed free-hand — see docs/data-model.md.
// A species here looks like { code, name, scientificName, family, aviculture, matchedName,
// birdsOfTheWorldUrl }. `name` is the US common name used in labels; the scientific name is
// secondary information; `matchedName` is the alternate name the search text matched, if any.
var SpeciesApi = (function () {
  function json(res) {
    if (!res.ok) throw new Error('Species lookup failed');
    return res.json();
  }

  function search(q, signal) {
    return fetch('/api/species?limit=12&q=' + encodeURIComponent(q), { signal: signal }).then(json);
  }

  // One level of the taxonomy: kind = root | order | family | genus. Groups come back as
  // { name, species, kept }; a genus returns its species.
  function tree(kind, value, avicultureOnly) {
    return fetch('/api/species?tree=' + encodeURIComponent(kind) + '&value=' + encodeURIComponent(value || '') +
      (avicultureOnly ? '&scope=aviculture' : '')).then(json);
  }

  // [{ input, status: exact | ambiguous | close | none, species?, candidates? }, ...]
  function resolve(names) {
    return fetch('/api/species/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: names }),
    }).then(json);
  }

  var RECENT_KEY = 'birdbox.recentSpecies';

  function recent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function remember(species) {
    try {
      var list = recent().filter(function (s) { return s.code !== species.code; });
      list.unshift({ code: species.code, name: species.name, scientificName: species.scientificName,
        birdsOfTheWorldUrl: species.birdsOfTheWorldUrl });
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
    } catch (e) {
      // Remembering recent picks is a convenience; never block saving a bird on it.
    }
  }

  // Species already in the user's flock, most common first — shown before they type anything,
  // and used to put "their" species ahead of the rest in search results.
  function flockSpecies() {
    var counts = {}, info = {};
    BIRDS_SAMPLE.forEach(function (b) {
      if (!b.speciesCode) return;
      counts[b.speciesCode] = (counts[b.speciesCode] || 0) + 1;
      info[b.speciesCode] = { code: b.speciesCode, name: b.speciesName, scientificName: b.scientificName,
        birdsOfTheWorldUrl: b.birdsOfTheWorldUrl };
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })
      .map(function (code) { return Object.assign({ flockCount: counts[code] }, info[code]); });
  }

  // Stable re-rank of server results: species in the user's flock first (most birds first), then
  // recently picked ones, then the server's order (likely-kept and popular species first).
  function personalize(results) {
    var flock = {}, rec = {};
    flockSpecies().forEach(function (s) { flock[s.code] = s.flockCount; });
    recent().forEach(function (s, i) { rec[s.code] = 100 - i; });
    return results.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) {
      var fa = flock[a.s.code] || 0, fb = flock[b.s.code] || 0;
      if (fa !== fb) return fb - fa;
      var ra = rec[a.s.code] || 0, rb = rec[b.s.code] || 0;
      if (ra !== rb) return rb - ra;
      return a.i - b.i;
    }).map(function (x) { return x.s; });
  }

  return { search: search, tree: tree, resolve: resolve, remember: remember, recent: recent, flockSpecies: flockSpecies, personalize: personalize };
})();

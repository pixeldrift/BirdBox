// What you keep (Account → Settings → My Aviary → "What I keep") — parrots & exotic birds, chickens & poultry, both, or neither ticked —
// decides what the menus offer first (see placeTypes() in js/data/buildings-sample.js) and a few words. A cage and a coop are different kinds
// of place; they are never swapped for each other. A batch of chicks is a "hatch" only for people who keep nothing but chickens.
//
//   T(text)        the text with its words swapped for what you keep        Terms.profile()   'exotic' | 'poultry'
//   Terms.keeps()  { exotic, poultry } — what's ticked                      Terms.word(k)     one word, e.g. Terms.word('clutch')
const Terms = (function () {
  // What you keep is a set: parrots & exotic birds, chickens & poultry, both, or neither ticked (= show everything).
  var LABELS = ['Parrots & exotic birds', 'Chickens & poultry'];
  // Only people who keep nothing but chickens get the chicken word for a batch of chicks; with both (or nothing ticked) the usual word stays.
  var POULTRY_ONLY = { clutch: 'hatch', clutches: 'hatches' };

  function keeps() {
    var raw = typeof AVIARY !== 'undefined' && AVIARY ? String(AVIARY.keeps || '') : '';
    var list = raw.split(',').map(function (x) { return x.trim(); });
    return { exotic: list.indexOf(LABELS[0]) !== -1, poultry: list.indexOf(LABELS[1]) !== -1 };
  }

  // 'poultry' only when chickens are all you keep, otherwise 'exotic' (the default wording).
  function profile() {
    var k = keeps();
    return k.poultry && !k.exotic ? 'poultry' : 'exotic';
  }

  function activeMap() { return profile() === 'poultry' ? POULTRY_ONLY : {}; }

  function word(key) {
    return activeMap()[key] || key;
  }

  function matchCase(from, to) {
    if (from === from.toUpperCase() && from.length > 1) return to.toUpperCase();
    return from.charAt(0) === from.charAt(0).toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to;
  }

  function translate(text) {
    var map = activeMap();
    var keys = Object.keys(map);
    if (!keys.length || typeof text !== 'string') return text;
    var re = new RegExp('\\b(' + keys.join('|') + ')\\b', 'gi');
    return text.replace(re, function (m) { return matchCase(m, map[m.toLowerCase()]); });
  }

  return { profile: profile, keeps: keeps, word: word, translate: translate, labels: LABELS };
})();

function T(text) { return Terms.translate(text); }

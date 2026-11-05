// The words the app uses, looked up from one table so they can change with what you keep. Parrot and exotic breeders say
// "cage" and "clutch"; chicken keepers say "coop" and "hatch". Set it in Account → Settings → My Aviary ("What I keep").
// Write the everyday word in a string (cage, clutch) and wrap it: T('Put this cage in a room') → "Put this coop in a room".
// To add a word, add a row to WORDS (singular and plural); to add a kind of keeper, add a column.
//
//   T(text)        the text with its words swapped for what you keep        Terms.profile()   'exotic' | 'poultry'
//   Terms.word(k)  one word, e.g. Terms.word('cages') → 'coops'
const Terms = (function () {
  var PROFILES = {
    exotic: { label: 'Parrots & exotic birds', map: {} },
    poultry: { label: 'Chickens & poultry', map: { cage: 'coop', cages: 'coops', clutch: 'hatch', clutches: 'hatches' } },
  };
  var LABELS = Object.keys(PROFILES).map(function (k) { return PROFILES[k].label; });

  function profile() {
    var keeps = typeof AVIARY !== 'undefined' && AVIARY ? AVIARY.keeps : '';
    return Object.keys(PROFILES).filter(function (k) { return PROFILES[k].label === keeps; })[0] || 'exotic';
  }

  function word(key) {
    var map = PROFILES[profile()].map;
    return map[key] || key;
  }

  function matchCase(from, to) {
    if (from === from.toUpperCase() && from.length > 1) return to.toUpperCase();
    return from.charAt(0) === from.charAt(0).toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to;
  }

  function translate(text) {
    var map = PROFILES[profile()].map;
    var keys = Object.keys(map);
    if (!keys.length || typeof text !== 'string') return text;
    var re = new RegExp('\\b(' + keys.join('|') + ')\\b', 'gi');
    return text.replace(re, function (m) { return matchCase(m, map[m.toLowerCase()]); });
  }

  return { profile: profile, word: word, translate: translate, labels: LABELS };
})();

function T(text) { return Terms.translate(text); }

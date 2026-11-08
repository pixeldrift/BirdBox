// Starter breed lists for domestic birds, offered as suggestions in the "Breed / form" field (you can always type your own —
// crosses, hatchery names and local strains aren't in any standard). Keyed by scientific name, so ducks, geese, turkeys and
// the rest can be added the same way.
//
// Chickens: the breeds recognized by the American Poultry Association (APA), grouped by APA class, with whether the APA
// lists them as large fowl, bantam, or both — from the Wikipedia summary of the APA Standard of Perfection
// (https://en.wikipedia.org/wiki/Chicken_breeds_recognized_by_the_American_Poultry_Association), cross-checked with
// university extension breed guides. Plus a few very popular backyard and hatchery types the APA doesn't list as breeds.
// `popular` marks the ones that recur in backyard surveys and hatchery best-seller lists (Heritage Acres Market 2021,
// Poultry Science 2014, APA show entries 2022) — shown first. No official popularity census exists.
// Satin isn't an APA breed: it's a feather type (the "satin" gene) found in several breeds, e.g. Satin Silkie.
const DOMESTIC_BREEDS = (function () {
  function make(group, large, bantam, names, popular) {
    return names.map(function (n) { return { name: n, group: group, large: large.indexOf(n) !== -1, bantam: bantam.indexOf(n) !== -1, popular: popular.indexOf(n) !== -1 }; });
  }
  var LARGE = ['Buckeye', 'Chantecler', 'Delaware', 'Dominique', 'Holland', 'Java', 'Jersey Giant', 'Lamona', 'New Hampshire', 'Plymouth Rock', 'Rhode Island Red', 'Rhode Island White', 'Wyandotte',
    'Brahma', 'Cochin', 'Langshan', 'Barnevelder', 'Campine', 'Crevecoeur', 'Faverolles', 'Hamburg', 'Houdan', 'La Fleche', 'Lakenvelder', 'Marans', 'Polish', 'Welsummer',
    'Australorp', 'Cornish', 'Dorking', 'Orpington', 'Redcap', 'Sussex', 'Ancona', 'Andalusian', 'Catalana', 'Leghorn', 'Minorca', 'Sicilian Buttercup', 'White-faced Black Spanish',
    'Modern Game', 'Old English Game', 'American Game', 'Aseel', 'Cubalaya', 'Malay', 'Phoenix', 'Shamo', 'Sumatra', 'Yokohama', 'Ameraucana', 'Araucana', 'Naked Neck (Turken)', 'Sultan'];
  var BANTAM = ['Modern Game', 'American Game', 'Old English Game', 'Ancona', 'Andalusian', 'Australorp', 'Campine', 'Catalana', 'Delaware', 'Dorking', 'Dutch', 'Holland', 'Japanese', 'Java', 'Jersey Giant',
    'Lakenvelder', 'Lamona', 'Leghorn', 'Minorca', 'Naked Neck (Turken)', 'Nankin', 'New Hampshire', 'Orpington', 'Phoenix', 'Plymouth Rock', 'Rhode Island Red', 'Serama', 'Spanish', 'Sussex', 'Welsummer',
    'Bearded d’Anvers', 'Dominique', 'Hamburg', 'Redcap', 'Rhode Island White', 'Rosecomb', 'Sebright', 'Wyandotte', 'Belgian Bearded d’Uccle', 'Booted', 'Brahma', 'Cochin', 'Faverolles', 'Langshan', 'Silkie',
    'Sultan', 'Ameraucana', 'Araucana', 'Buckeye', 'Chantecler', 'Cornish', 'Crevecoeur', 'Cubalaya', 'Houdan', 'La Fleche', 'Malay', 'Polish', 'Shamo', 'Sicilian Buttercup', 'Sumatra', 'Yokohama'];
  var POPULAR = ['Rhode Island Red', 'Plymouth Rock', 'Orpington', 'Wyandotte', 'Ameraucana', 'Marans', 'Welsummer', 'Brahma', 'Australorp', 'Cochin', 'Dominique', 'Jersey Giant', 'Silkie',
    'Old English Game', 'Modern Game', 'Faverolles', 'Ancona', 'Easter Egger', 'Olive Egger', 'Red Star', 'Cornish Cross'];
  var G = function (group, names) { return make(group, LARGE, BANTAM, names, POPULAR); };
  var chickens = [].concat(
    G('American', ['Buckeye', 'Chantecler', 'Delaware', 'Dominique', 'Holland', 'Java', 'Jersey Giant', 'Lamona', 'New Hampshire', 'Plymouth Rock', 'Rhode Island Red', 'Rhode Island White', 'Wyandotte']),
    G('Asiatic', ['Brahma', 'Cochin', 'Langshan']),
    G('Continental', ['Barnevelder', 'Campine', 'Crevecoeur', 'Faverolles', 'Hamburg', 'Houdan', 'La Fleche', 'Lakenvelder', 'Marans', 'Polish', 'Welsummer']),
    G('English', ['Australorp', 'Cornish', 'Dorking', 'Orpington', 'Redcap', 'Sussex']),
    G('Mediterranean', ['Ancona', 'Andalusian', 'Catalana', 'Leghorn', 'Minorca', 'Sicilian Buttercup', 'White-faced Black Spanish']),
    G('Game', ['Modern Game', 'Old English Game', 'American Game']),
    G('Oriental', ['Aseel', 'Cubalaya', 'Malay', 'Phoenix', 'Shamo', 'Sumatra', 'Yokohama']),
    G('Miscellaneous', ['Ameraucana', 'Araucana', 'Naked Neck (Turken)', 'Sultan']),
    G('Bantam only', ['Silkie', 'Belgian Bearded d’Uccle', 'Booted', 'Dutch', 'Japanese', 'Nankin', 'Rosecomb', 'Sebright', 'Serama', 'Spanish', 'Bearded d’Anvers']),
    [ // popular types that aren't APA breeds
      { name: 'Easter Egger', group: 'Backyard / hatchery', large: false, bantam: false, popular: true },
      { name: 'Olive Egger', group: 'Backyard / hatchery', large: false, bantam: false, popular: true },
      { name: 'Red Star', group: 'Hybrid (sex link)', large: false, bantam: false, popular: true },
      { name: 'Black Star', group: 'Hybrid (sex link)', large: false, bantam: false, popular: false },
      { name: 'Cornish Cross', group: 'Meat hybrid', large: false, bantam: false, popular: true },
      { name: 'Satin Silkie', group: 'Feather type', large: false, bantam: false, popular: false },
      { name: 'Mixed / unknown', group: 'Other', large: false, bantam: false, popular: false },
    ]
  );
  var seen = {};
  chickens = chickens.filter(function (b) { if (seen[b.name]) return false; seen[b.name] = true; return true; });
  chickens.forEach(function (b) { b.hint = b.group === 'Bantam only' ? 'Bantam' : b.group + (b.large && b.bantam ? ' · large fowl & bantam' : b.bantam ? ' · bantam' : b.large ? ' · large fowl' : ''); });
  chickens.sort(function (a, b) { return (b.popular - a.popular) || a.name.localeCompare(b.name); });
  return { 'Gallus gallus': chickens };
})();

// Breed suggestions for a species: [{ name, hint, popular }] or [].
function domesticBreedsFor(species) {
  var sci = species && species.scientificName ? species.scientificName : '';
  var key = Object.keys(DOMESTIC_BREEDS).filter(function (k) { return sci.indexOf(k) === 0; })[0];
  return key ? DOMESTIC_BREEDS[key] : [];
}

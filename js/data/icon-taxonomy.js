// Hierarchical icon fallback system, split into two independent pieces:
//
//   TAXONOMY_NODES  — the STRUCTURE. Which category is a parent of which
//                      (Conure -> Small Parrot -> Parrot -> Hookbill -> Bird).
//                      Pack-agnostic: this never changes when you switch styles.
//
//   ICON_PACKS      — the SKIN. Which actual image file represents each node, for
//                      a given illustration style. Switching packs is meant to feel
//                      like switching a color scheme: the hierarchy and every bird's
//                      place in it stay identical, only the artwork changes. Per the
//                      user: some people will want simple/minimal icons, others
//                      cartoons, others realistic illustrations — this is the
//                      architecture for that, built now against the one real pack
//                      we have (the set extracted from NestBox Icons.psd). Adding a
//                      pack later is just adding an entry to ICON_PACKS; nothing
//                      else in the app changes, since every screen resolves a bird's
//                      icon through resolveBirdIcon() rather than hardcoding a path.
//
// A bird's icon resolves from most specific to least specific: mutation+subspecies
// -> subspecies -> species -> functional/size category -> broader functional
// category -> ... -> the generic bird icon at the root. Most nodes intentionally
// have no art in the "line" pack — that's the normal case (17 icons; almost every
// leaf falls back), not a bug. The tree blends scientific-ish groupings (Conure,
// Macaw, Amazon) with the folk/functional categories real bird keepers use
// (Poultry, Waterfowl, Ground Bird, Songbird, Bird of Prey, ...) per the user's ask.

const TAXONOMY_NODES = {
  'bird': { label: 'Bird', parent: null },

  // Hookbill / Parrots
  'hookbill': { label: 'Hookbill', parent: 'bird' },
  'parrot': { label: 'Parrot', parent: 'hookbill' },
  'small-parrot': { label: 'Small Parrot', parent: 'parrot' },
  'medium-parrot': { label: 'Medium Parrot', parent: 'parrot' },
  'large-parrot': { label: 'Large Parrot', parent: 'parrot' },
  'conure': { label: 'Conure', parent: 'small-parrot' },
  'parakeet': { label: 'Parakeet', parent: 'small-parrot' },
  'lovebird': { label: 'Lovebird', parent: 'small-parrot' },
  'cockatiel': { label: 'Cockatiel', parent: 'small-parrot' },
  'caique': { label: 'Caique', parent: 'small-parrot' },
  'amazon': { label: 'Amazon', parent: 'medium-parrot' },
  'african-grey': { label: 'African Grey', parent: 'medium-parrot' },
  'eclectus': { label: 'Eclectus', parent: 'medium-parrot' },
  'poicephalus': { label: 'Poicephalus', parent: 'medium-parrot' },
  'macaw': { label: 'Macaw', parent: 'large-parrot' },
  'cockatoo': { label: 'Cockatoo', parent: 'large-parrot' },
  'budgie': { label: 'Budgie', parent: 'small-parrot' },
  'parrotlet': { label: 'Parrotlet', parent: 'small-parrot' },
  'quaker': { label: 'Quaker (Monk Parakeet)', parent: 'small-parrot' },
  'linnie': { label: 'Linnie (Lineolated Parakeet)', parent: 'small-parrot' },
  'kakariki': { label: 'Kakariki', parent: 'small-parrot' },
  'bourkes-parakeet': { label: "Bourke's Parakeet", parent: 'small-parrot' },

  // Softbills (non-parrot tropical/ornamental)
  'softbill': { label: 'Softbill', parent: 'bird' },
  'toucan': { label: 'Toucan', parent: 'softbill' },
  'hornbill': { label: 'Hornbill', parent: 'softbill' },
  'turaco': { label: 'Turaco', parent: 'softbill' },
  'kingfisher': { label: 'Kingfisher', parent: 'softbill' },

  // Songbirds
  'songbird': { label: 'Songbird', parent: 'bird' },
  'finch': { label: 'Finch', parent: 'songbird' },

  // Birds of prey — real category, no icon yet in any pack (honest gap)
  'bird-of-prey': { label: 'Bird of Prey', parent: 'bird' },

  // Poultry
  'poultry': { label: 'Poultry', parent: 'bird' },
  'chicken': { label: 'Chicken', parent: 'poultry' },
  'turkey': { label: 'Turkey', parent: 'poultry' },
  'peafowl': { label: 'Peafowl', parent: 'poultry' },

  // Ground birds (wild/game, distinct from domestic poultry)
  'ground-bird': { label: 'Ground Bird', parent: 'bird' },
  'quail': { label: 'Quail', parent: 'ground-bird' },

  // Ratites
  'ratite': { label: 'Ratite', parent: 'bird' },
  'ostrich': { label: 'Ostrich', parent: 'ratite' },
  'emu': { label: 'Emu', parent: 'ratite' },

  // Water birds
  'water-bird': { label: 'Water Bird', parent: 'bird' },
  'waterfowl': { label: 'Waterfowl', parent: 'water-bird' },
  'duck': { label: 'Duck', parent: 'waterfowl' },
  'goose': { label: 'Goose', parent: 'waterfowl' },
  'wading-bird': { label: 'Wading Bird', parent: 'water-bird' },
  'flamingo': { label: 'Flamingo', parent: 'wading-bird' },
  'sea-bird': { label: 'Sea Bird', parent: 'water-bird' },
};

// Which node a Birds.species value starts its walk from. Covers every species-level
// leaf node in TAXONOMY_NODES (not just the ones already in js/data/birds-sample.js)
// so a pack's art shows up the moment a bird with that species is entered — add more
// as new species/nodes show up.
const SPECIES_NODE = {
  'Conure': 'conure',
  'Parakeet': 'parakeet',
  'Cockatoo': 'cockatoo',
  'Macaw': 'macaw',
  'Amazon': 'amazon',
  'African Grey': 'african-grey',
  'Eclectus': 'eclectus',
  'Lovebird': 'lovebird',
  'Cockatiel': 'cockatiel',
  'Caique': 'caique',
  'Toucan': 'toucan',
  'Hornbill': 'hornbill',
  'Turaco': 'turaco',
  'Kingfisher': 'kingfisher',
  'Finch': 'finch',
  'Chicken': 'chicken',
  'Turkey': 'turkey',
  'Peafowl': 'peafowl',
  'Quail': 'quail',
  'Ostrich': 'ostrich',
  'Emu': 'emu',
  'Duck': 'duck',
  'Goose': 'goose',
  'Flamingo': 'flamingo',
  'Budgie': 'budgie',
  'Parrotlet': 'parrotlet',
  'Quaker': 'quaker',
  'Linnie': 'linnie',
  'Kakariki': 'kakariki',
  "Bourke's Parakeet": 'bourkes-parakeet',
  'Senegal Parrot': 'poicephalus',
  "Meyer's Parrot": 'poicephalus',
};

// Every pack must at minimum cover the 'bird' root — that's the guaranteed final
// fallback. subspeciesOverrides/mutationOverrides are keyed "Species|Subspecies" /
// "Species|Subspecies|Mutation", for illustrating one specific bird without adding
// a taxonomy node for it.
const ICON_PACKS = [
  {
    id: 'line',
    label: 'Line Art',
    description: 'Simple black outline icons — the default set, extracted from NestBox Icons.psd.',
    icons: {
      'bird': 'icons/transparent/Birds.png',
      'small-parrot': 'icons/transparent/Bird01.png',
      'cockatoo': 'icons/transparent/Bird02.png',
      'medium-parrot': 'icons/transparent/Bird03.png',
      'macaw': 'icons/transparent/Bird04.png',
      'conure': 'icons/transparent/Bird05.png',
      'poultry': 'icons/transparent/Bird06.png',
      'chicken': 'icons/transparent/Bird06.png',
      'waterfowl': 'icons/transparent/Bird07.png',
      'turkey': 'icons/transparent/Bird08.png',
      'wading-bird': 'icons/transparent/Bird09.png',
      'ground-bird': 'icons/transparent/Bird10.png',
      'peafowl': 'icons/transparent/Bird11.png',
      'ratite': 'icons/transparent/Bird12.png',
      'songbird': 'icons/transparent/Bird13.png',
      'hornbill': 'icons/transparent/Bird14.png',
      'kingfisher': 'icons/transparent/Bird15.png',
      'toucan': 'icons/transparent/Bird16.png',
      'turaco': 'icons/transparent/Bird17.png',
    },
    subspeciesOverrides: {},
    mutationOverrides: {},
  },
  {
    id: 'teratiger',
    label: 'Hand-Drawn',
    description: 'Warm hand-drawn illustrations by TeraTigerStudio, one per species/subspecies.',
    icons: {
      'african-grey': 'src/images/TeraTiger/African Greys/Congo African Grey.png',
      'amazon': 'src/images/TeraTiger/Amazons/Double Yellow-Headed Amazon.png',
      'budgie': 'src/images/TeraTiger/Budgies/Green Budgie.png',
      'caique': 'src/images/TeraTiger/Caiques/Black-headed Caique.png',
      'cockatiel': 'src/images/TeraTiger/Cockatiels/Pearl Cockatiel.png',
      'cockatoo': 'src/images/TeraTiger/Cockatoos/Umbrella Cockatoo.png',
      'eclectus': 'src/images/TeraTiger/Eclectus/Male Eclectus.png',
      'kakariki': 'src/images/TeraTiger/Misc/Kakariki.png',
      'bourkes-parakeet': "src/images/TeraTiger/Misc/Rosey Bourke's.png",
      'poicephalus': 'src/images/TeraTiger/Misc/Senegal Parrot.png',
      'linnie': 'src/images/TeraTiger/Linnies/Green Linnie.png',
      'lovebird': 'src/images/TeraTiger/Lovebirds/Peach-faced Lovebird.png',
      'macaw': 'src/images/TeraTiger/Macaws/Blue and Gold Macaw.png',
      'parakeet': 'src/images/TeraTiger/Indian Ringnecks/Green Indian Ringneck.png',
      'parrotlet': 'src/images/TeraTiger/Parottlets/Green Parottlet.png',
      'quaker': 'src/images/TeraTiger/Quakers/Green Quaker.png',
      'toucan': 'src/images/TeraTiger/Toucans/Toco Toucan.png',
    },
    // Exact subspecies/mutation matches to our sample birds, so specific individuals
    // (Coco the Umbrella Cockatoo, Rio the Blue & Gold Macaw, ...) get their precise
    // portrait instead of the species-level generic above.
    subspeciesOverrides: {
      'Cockatoo|Umbrella': 'src/images/TeraTiger/Cockatoos/Umbrella Cockatoo.png',
      'Macaw|Blue and Gold': 'src/images/TeraTiger/Macaws/Blue and Gold Macaw.png',
      'Amazon|Yellow-Naped': 'src/images/TeraTiger/Amazons/Yellow-Naped Amazon.png',
      'African Grey|Congo': 'src/images/TeraTiger/African Greys/Congo African Grey.png',
    },
    mutationOverrides: {
      'Parakeet|Indian Ring-Necked|Blue': 'src/images/TeraTiger/Indian Ringnecks/Blue Indian Ringneck.png',
    },
  },
  // Add more packs here as they're illustrated — e.g. a "cartoon" or "realistic"
  // style. Each just needs an id/label/description and an `icons` map using the
  // same TAXONOMY_NODES keys; it doesn't need full coverage (it'll fall back to
  // whatever nodes it does have art for, same as "line" does).
  //
  // NOTE on the TeraTiger source folder: its "Conures" subfolder (src/images/
  // TeraTiger/Conures/) was skipped entirely — it turned out to be an Etsy
  // product-listing screenshot (stickers photographed on a wood background) and
  // a couple of stray .textClipping/.webloc files, not individual transparent
  // icons, so there's no usable conure art in this pack yet.
];

const ICON_PACK_STORAGE_KEY = 'birdbox.iconPack';

function getIconPacks() {
  return ICON_PACKS;
}

function getActiveIconPackId() {
  try {
    var stored = localStorage.getItem(ICON_PACK_STORAGE_KEY);
    if (stored && ICON_PACKS.some(function (p) { return p.id === stored; })) return stored;
  } catch (e) {
    // localStorage unavailable (private browsing, storage blocked, etc.) — fall through.
  }
  return ICON_PACKS[0].id;
}

function setActiveIconPackId(id) {
  try {
    localStorage.setItem(ICON_PACK_STORAGE_KEY, id);
  } catch (e) {
    // Non-fatal — the pack just won't persist across reloads this session.
  }
}

function getActiveIconPack() {
  var id = getActiveIconPackId();
  return ICON_PACKS.filter(function (p) { return p.id === id; })[0] || ICON_PACKS[0];
}

function resolveBirdIcon(bird) {
  var pack = getActiveIconPack();

  var mutKey = bird.species + '|' + bird.subspecies + '|' + (bird.mutation || '');
  if (bird.mutation && pack.mutationOverrides[mutKey]) return pack.mutationOverrides[mutKey];

  var subKey = bird.species + '|' + bird.subspecies;
  if (bird.subspecies && pack.subspeciesOverrides[subKey]) return pack.subspeciesOverrides[subKey];

  var key = SPECIES_NODE[bird.species] || null;
  while (key) {
    if (pack.icons[key]) return pack.icons[key];
    var node = TAXONOMY_NODES[key];
    if (!node) break;
    key = node.parent;
  }
  return pack.icons['bird'] || ICON_PACKS[0].icons['bird'];
}

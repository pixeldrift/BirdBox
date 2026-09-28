// Hierarchical icon fallback system. A bird's thumbnail resolves from most specific
// to least specific: mutation+subspecies -> subspecies -> species -> functional/size
// category -> broader functional category -> ... -> the generic bird icon at the root.
// Most nodes below intentionally have icon: null — that's not a bug, it's the normal
// case (we have 17 species icons total; almost every leaf falls back). The tree blends
// scientific-ish groupings (Conure, Macaw, Amazon) with the folk/functional categories
// real bird keepers use (Poultry, Waterfowl, Ground Bird, Songbird, Bird of Prey, ...)
// per the user's ask, even where a branch has no illustrated icon yet.
//
// To add a more specific icon later: draw it, drop the file in icons/transparent/,
// and either add a new node (with the right `parent`) or add an entry to
// SUBSPECIES_ICON_OVERRIDES / MUTATION_ICON_OVERRIDES below — no resolver code changes.
const TAXONOMY_NODES = {
  'bird': { label: 'Bird', icon: 'icons/transparent/Birds.png', parent: null },

  // Hookbill / Parrots
  'hookbill': { label: 'Hookbill', icon: null, parent: 'bird' },
  'parrot': { label: 'Parrot', icon: null, parent: 'hookbill' },
  'small-parrot': { label: 'Small Parrot', icon: 'icons/transparent/Bird01.png', parent: 'parrot' },
  'medium-parrot': { label: 'Medium Parrot', icon: 'icons/transparent/Bird03.png', parent: 'parrot' },
  'large-parrot': { label: 'Large Parrot', icon: null, parent: 'parrot' },
  'conure': { label: 'Conure', icon: 'icons/transparent/Bird05.png', parent: 'small-parrot' },
  'parakeet': { label: 'Parakeet', icon: null, parent: 'small-parrot' },
  'lovebird': { label: 'Lovebird', icon: null, parent: 'small-parrot' },
  'cockatiel': { label: 'Cockatiel', icon: null, parent: 'small-parrot' },
  'caique': { label: 'Caique', icon: null, parent: 'small-parrot' },
  'amazon': { label: 'Amazon', icon: null, parent: 'medium-parrot' },
  'african-grey': { label: 'African Grey', icon: null, parent: 'medium-parrot' },
  'eclectus': { label: 'Eclectus', icon: null, parent: 'medium-parrot' },
  'macaw': { label: 'Macaw', icon: 'icons/transparent/Bird04.png', parent: 'large-parrot' },
  'cockatoo': { label: 'Cockatoo', icon: 'icons/transparent/Bird02.png', parent: 'large-parrot' },

  // Softbills (non-parrot tropical/ornamental)
  'softbill': { label: 'Softbill', icon: null, parent: 'bird' },
  'toucan': { label: 'Toucan', icon: 'icons/transparent/Bird16.png', parent: 'softbill' },
  'hornbill': { label: 'Hornbill', icon: 'icons/transparent/Bird14.png', parent: 'softbill' },
  'turaco': { label: 'Turaco', icon: 'icons/transparent/Bird17.png', parent: 'softbill' },
  'kingfisher': { label: 'Kingfisher', icon: 'icons/transparent/Bird15.png', parent: 'softbill' },

  // Songbirds
  'songbird': { label: 'Songbird', icon: 'icons/transparent/Bird13.png', parent: 'bird' },
  'finch': { label: 'Finch', icon: null, parent: 'songbird' },

  // Birds of prey — real category, no icon yet (honest gap)
  'bird-of-prey': { label: 'Bird of Prey', icon: null, parent: 'bird' },

  // Poultry
  'poultry': { label: 'Poultry', icon: 'icons/transparent/Bird06.png', parent: 'bird' },
  'chicken': { label: 'Chicken', icon: 'icons/transparent/Bird06.png', parent: 'poultry' },
  'turkey': { label: 'Turkey', icon: 'icons/transparent/Bird08.png', parent: 'poultry' },
  'peafowl': { label: 'Peafowl', icon: 'icons/transparent/Bird11.png', parent: 'poultry' },

  // Ground birds (wild/game, distinct from domestic poultry)
  'ground-bird': { label: 'Ground Bird', icon: 'icons/transparent/Bird10.png', parent: 'bird' },
  'quail': { label: 'Quail', icon: null, parent: 'ground-bird' },

  // Ratites
  'ratite': { label: 'Ratite', icon: 'icons/transparent/Bird12.png', parent: 'bird' },
  'ostrich': { label: 'Ostrich', icon: null, parent: 'ratite' },
  'emu': { label: 'Emu', icon: null, parent: 'ratite' },

  // Water birds
  'water-bird': { label: 'Water Bird', icon: null, parent: 'bird' },
  'waterfowl': { label: 'Waterfowl', icon: 'icons/transparent/Bird07.png', parent: 'water-bird' },
  'duck': { label: 'Duck', icon: null, parent: 'waterfowl' },
  'goose': { label: 'Goose', icon: null, parent: 'waterfowl' },
  'wading-bird': { label: 'Wading Bird', icon: 'icons/transparent/Bird09.png', parent: 'water-bird' },
  'flamingo': { label: 'Flamingo', icon: null, parent: 'wading-bird' },
  'sea-bird': { label: 'Sea Bird', icon: null, parent: 'water-bird' },
};

// Which node a Birds.species value starts its walk from. Only the species actually
// used in js/data/birds-sample.js are mapped today — add more as new species show up.
const SPECIES_NODE = {
  'Conure': 'conure',
  'Parakeet': 'parakeet',
  'Cockatoo': 'cockatoo',
  'Macaw': 'macaw',
  'Amazon': 'amazon',
  'African Grey': 'african-grey',
};

// Hooks for illustrating a specific subspecies or mutation later — keyed by
// "Species|Subspecies" / "Species|Subspecies|Mutation". Empty until something is
// actually drawn; the resolver checks these before falling into the taxonomy tree.
const SUBSPECIES_ICON_OVERRIDES = {};
const MUTATION_ICON_OVERRIDES = {};

function resolveBirdIcon(bird) {
  var mutKey = bird.species + '|' + bird.subspecies + '|' + (bird.mutation || '');
  if (bird.mutation && MUTATION_ICON_OVERRIDES[mutKey]) return MUTATION_ICON_OVERRIDES[mutKey];

  var subKey = bird.species + '|' + bird.subspecies;
  if (bird.subspecies && SUBSPECIES_ICON_OVERRIDES[subKey]) return SUBSPECIES_ICON_OVERRIDES[subKey];

  var key = SPECIES_NODE[bird.species] || null;
  while (key) {
    var node = TAXONOMY_NODES[key];
    if (!node) break;
    if (node.icon) return node.icon;
    key = node.parent;
  }
  return TAXONOMY_NODES['bird'].icon;
}

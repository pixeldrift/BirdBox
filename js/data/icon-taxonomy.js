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
  'lory': { label: 'Lory', parent: 'small-parrot' },
  'rosella': { label: 'Rosella', parent: 'small-parrot' },
  'pionus-parrot': { label: 'Pionus Parrot', parent: 'medium-parrot' },
  'vasa-parrot': { label: 'Vasa Parrot', parent: 'medium-parrot' },
  'kea': { label: 'Kea', parent: 'medium-parrot' },
  'pesquets-parrot': { label: "Pesquet's Parrot", parent: 'medium-parrot' },
  'kakapo': { label: 'Kakapo', parent: 'parrot' },

  // Softbills (non-parrot tropical/ornamental)
  'softbill': { label: 'Softbill', parent: 'bird' },
  'toucan': { label: 'Toucan', parent: 'softbill' },
  'hornbill': { label: 'Hornbill', parent: 'softbill' },
  'turaco': { label: 'Turaco', parent: 'softbill' },
  'kingfisher': { label: 'Kingfisher', parent: 'softbill' },

  // Pigeons & doves — commonly kept, so a group of their own
  'pigeon': { label: 'Pigeon & Dove', parent: 'bird' },

  // Songbirds
  'songbird': { label: 'Songbird', parent: 'bird' },
  'finch': { label: 'Finch', parent: 'songbird' },

  // Birds of prey — real category, no icon yet in any pack (honest gap)
  'bird-of-prey': { label: 'Bird of Prey', parent: 'bird' },
  'eagle': { label: 'Eagle', parent: 'bird-of-prey' },
  'hawk': { label: 'Hawk', parent: 'bird-of-prey' },
  'falcon': { label: 'Falcon', parent: 'bird-of-prey' },
  'owl': { label: 'Owl', parent: 'bird-of-prey' },

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
  'gull': { label: 'Gull', parent: 'sea-bird' },
  'swan': { label: 'Swan', parent: 'waterfowl' },
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
  'Lory': 'lory',
  'Rosella': 'rosella',
  'Pionus Parrot': 'pionus-parrot',
  'Vasa Parrot': 'vasa-parrot',
  'Kea': 'kea',
  "Pesquet's Parrot": 'pesquets-parrot',
  'Kakapo': 'kakapo',
  'Eagle': 'eagle',
  'Hawk': 'hawk',
  'Falcon': 'falcon',
  'Owl': 'owl',
  'Gull': 'gull',
  'Swan': 'swan',
};

// Which category node a bird starts from when its species has no icon of its own, derived from
// the species' taxonomy (scientific genus, then family, then order) so every species in the list
// gets a sensible fallback without hand-mapping thousands of them. Genus wins over family.
var GENUS_NODE = {
  Aratinga: 'conure', Eupsittula: 'conure', Psittacara: 'conure', Pyrrhura: 'conure', Thectocercus: 'conure', Guaruba: 'conure',
  Ara: 'macaw', Anodorhynchus: 'macaw', Cyanopsitta: 'macaw', Primolius: 'macaw', Orthopsittaca: 'macaw', Diopsittaca: 'macaw',
  Cacatua: 'cockatoo', Eolophus: 'cockatoo', Probosciger: 'cockatoo', Calyptorhynchus: 'cockatoo', Callocephalon: 'cockatoo', Zanda: 'cockatoo',
  Nymphicus: 'cockatiel', Amazona: 'amazon', Psittacus: 'african-grey', Eclectus: 'eclectus', Poicephalus: 'poicephalus',
  Agapornis: 'lovebird', Pionites: 'caique', Pionus: 'pionus-parrot', Melopsittacus: 'budgie', Forpus: 'parrotlet',
  Myiopsitta: 'quaker', Bolborhynchus: 'linnie', Cyanoramphus: 'kakariki', Neopsephotus: 'bourkes-parakeet',
  Psittacula: 'parakeet', Platycercus: 'rosella', Trichoglossus: 'lory', Lorius: 'lory', Eos: 'lory', Chalcopsitta: 'lory',
  Pseudeos: 'lory', Strigops: 'kakapo', Nestor: 'kea', Coracopsis: 'vasa-parrot', Psittrichas: 'pesquets-parrot',
  Gallus: 'chicken', Meleagris: 'turkey', Pavo: 'peafowl', Afropavo: 'peafowl',
  Coturnix: 'quail', Callipepla: 'quail', Colinus: 'quail', Cyrtonyx: 'quail', Excalfactoria: 'quail',
  Struthio: 'ostrich', Dromaius: 'emu', Cygnus: 'swan', Anser: 'goose', Branta: 'goose',
  Aquila: 'eagle', Haliaeetus: 'eagle', Hieraaetus: 'eagle', Harpia: 'eagle', Buteo: 'hawk', Accipiter: 'hawk', Parabuteo: 'hawk',
};
var FAMILY_NODE = {
  Columbidae: 'pigeon', Estrildidae: 'finch', Fringillidae: 'finch', Ploceidae: 'finch', Viduidae: 'finch', Sturnidae: 'songbird',
  Anatidae: 'duck', Phasianidae: 'ground-bird', Numididae: 'poultry', Cracidae: 'ground-bird',
  Struthionidae: 'ratite', Casuariidae: 'ratite', Rheidae: 'ratite', Apterygidae: 'ratite',
  Ramphastidae: 'toucan', Bucerotidae: 'hornbill', Musophagidae: 'turaco', Alcedinidae: 'kingfisher', Halcyonidae: 'kingfisher',
  Cerylidae: 'kingfisher', Phoenicopteridae: 'flamingo', Falconidae: 'falcon', Accipitridae: 'bird-of-prey',
  Strigidae: 'owl', Tytonidae: 'owl', Laridae: 'gull', Ardeidae: 'wading-bird', Threskiornithidae: 'wading-bird', Ciconiidae: 'wading-bird',
};
var ORDER_NODE = {
  Psittaciformes: 'parrot', Passeriformes: 'songbird', Galliformes: 'ground-bird', Anseriformes: 'waterfowl',
  Columbiformes: 'pigeon', Falconiformes: 'falcon', Strigiformes: 'owl', Charadriiformes: 'sea-bird',
};

function nodeForBird(bird) {
  if (bird.scientificName) {
    var genus = bird.scientificName.split(' ')[0];
    if (GENUS_NODE[genus]) return GENUS_NODE[genus];
    if (FAMILY_NODE[bird.familyScientific]) return FAMILY_NODE[bird.familyScientific];
    if (ORDER_NODE[bird.order]) return ORDER_NODE[bird.order];
  }
  return SPECIES_NODE[bird.species] || null;
}

// Every pack must at minimum cover the 'bird' root — that's the guaranteed final
// fallback. subspeciesOverrides/mutationOverrides are keyed "Species|Subspecies" /
// "Species|Subspecies|Mutation", for illustrating one specific bird without adding
// a taxonomy node for it.
const ICON_PACKS = [
  {
    id: 'line',
    label: 'Line Art',
    description: 'Simple black outline icons — clean and minimal.',
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
    // The same specific portraits, keyed by eBird species code for birds linked to a species.
    speciesIcons: {
      'whicoc1': 'src/images/TeraTiger/Cockatoos/Umbrella Cockatoo.png',
      'baymac': 'src/images/TeraTiger/Macaws/Blue and Gold Macaw.png',
      'yenpar1': 'src/images/TeraTiger/Amazons/Yellow-Naped Amazon.png',
      'grepar': 'src/images/TeraTiger/African Greys/Congo African Grey.png',
    },
    speciesMutationIcons: {
      'rorpar|Blue': 'src/images/TeraTiger/Indian Ringnecks/Blue Indian Ringneck.png',
    },
  },
  {
    id: 'birdorable',
    label: 'Birdorable',
    description: 'Cute round cartoon birds by Birdorable.com — visit their shop for merch featuring your birds.',
    // Built from src/images/Birdorable/species-map.json. Species/subspecies keys below use
    // our own field convention (e.g. "Macaw|Scarlet"), not Birdorable's slugs — cross-referenced
    // by hand against species-map.json, not guessed from filenames or artwork.
    icons: {
      "african-grey": "src/images/Birdorable/Birds/Gray-Parrot.png",
      "toucan": "src/images/Birdorable/Birds/Toco-Toucan.png",
      "hornbill": "src/images/Birdorable/Birds/Great-Hornbill.png",
      "turaco": "src/images/Birdorable/Birds/Great-Blue-Turaco.png",
      "kingfisher": "src/images/Birdorable/Birds/Common-Kingfisher.png",
      "finch": "src/images/Birdorable/Birds/Zebra-Finch.png",
      "songbird": "src/images/Birdorable/Birds/European-Goldfinch.png",
      "bird-of-prey": "src/images/Birdorable/Birds/Bald-Eagle.png",
      "eagle": "src/images/Birdorable/Birds/Bald-Eagle.png",
      "hawk": "src/images/Birdorable/Birds/Red-tailed-Hawk.png",
      "falcon": "src/images/Birdorable/Birds/Peregrine-Falcon.png",
      "owl": "src/images/Birdorable/Birds/Great-Horned-Owl.png",
      "poultry": "src/images/Birdorable/Birds/Red-Junglefowl.png",
      "chicken": "src/images/Birdorable/Birds/Red-Junglefowl.png",
      "turkey": "src/images/Birdorable/Birds/Wild-Turkey.png",
      "peafowl": "src/images/Birdorable/Birds/Indian-Peafowl.png",
      "ground-bird": "src/images/Birdorable/Birds/Common-Pheasant.png",
      "quail": "src/images/Birdorable/Birds/California-Quail.png",
      "ratite": "src/images/Birdorable/Birds/Ostrich.png",
      "ostrich": "src/images/Birdorable/Birds/Ostrich.png",
      "emu": "src/images/Birdorable/Birds/Emu.png",
      "water-bird": "src/images/Birdorable/Birds/Mute-Swan.png",
      "waterfowl": "src/images/Birdorable/Birds/Mallard.png",
      "duck": "src/images/Birdorable/Birds/Mallard.png",
      "goose": "src/images/Birdorable/Birds/Canada-Goose.png",
      "swan": "src/images/Birdorable/Birds/Mute-Swan.png",
      "wading-bird": "src/images/Birdorable/Birds/Grey-Heron.png",
      "flamingo": "src/images/Birdorable/Birds/American-Flamingo.png",
      "sea-bird": "src/images/Birdorable/Birds/Atlantic-Puffin.png",
      "gull": "src/images/Birdorable/Birds/Herring-Gull.png",
      "kakariki": "src/images/Birdorable/Birds/Red-crowned-Parakeet.png",
      'macaw': "src/images/Birdorable/Birds/Blue-and-yellow-Macaw.png",
      'pigeon': "src/images/Birdorable/Birds/Rock-Pigeon.png",
      'cockatoo': "src/images/Birdorable/Birds/Umbrella-Cockatoo.png",
      'amazon': "src/images/Birdorable/Birds/Yellow-headed-Amazon.png",
      'eclectus': "src/images/Birdorable/Birds/Eclectus-Parrot.png",
      'cockatiel': "src/images/Birdorable/Birds/Cockatiel.png",
      'lovebird': "src/images/Birdorable/Birds/Rosy-faced-Lovebird.png",
      'conure': "src/images/Birdorable/Birds/Blue-crowned-Conure.png",
      'parakeet': "src/images/Birdorable/Birds/Rose-ringed-Parakeet.png",
      'budgie': "src/images/Birdorable/Birds/Budgerigar.png",
      'parrotlet': "src/images/Birdorable/Birds/Pacific-Parrotlet.png",
      'quaker': "src/images/Birdorable/Birds/Monk-Parakeet.png",
      'bourkes-parakeet': "src/images/Birdorable/Birds/Bourke's-Parrot.png",
      'poicephalus': "src/images/Birdorable/Birds/Senegal-Parrot.png",
      'caique': "src/images/Birdorable/Birds/Black-headed-Parrot.png",
      'pionus-parrot': "src/images/Birdorable/Birds/Blue-headed-Parrot.png",
      'lory': "src/images/Birdorable/Birds/Dusky-Lory.png",
      'rosella': "src/images/Birdorable/Birds/Eastern-Rosella.png",
      'kakapo': "src/images/Birdorable/Birds/Kakapo.png",
      'kea': "src/images/Birdorable/Birds/Kea.png",
      'vasa-parrot': "src/images/Birdorable/Birds/Lesser-Vasa-Parrot.png",
      'pesquets-parrot': "src/images/Birdorable/Birds/Pesquet's-Parrot.png",
    },
    // Exact species/subspecies matches, mapped from Birdorable's own species names onto our
    // Species|Subspecies convention (e.g. Birdorable's "Blue-and-yellow Macaw" -> our
    // "Macaw|Blue and Gold", matching Rio's record). Far deeper than the node-level `icons`
    // above since Birdorable draws many individual species per genus (12 macaws, 9 cockatoos,
    // 11 conures/Aratinga-type parakeets, ...) where our taxonomy only has one node per genus.
    subspeciesOverrides: {
      "African Grey|Congo": "src/images/Birdorable/Birds/Gray-Parrot.png",
      "Conure|Green-Cheeked": "src/images/Birdorable/Birds/Green-cheeked-Parakeet.png",
      "Finch|Gouldian": "src/images/Birdorable/Birds/Gouldian-Finch.png",
      "Finch|Zebra": "src/images/Birdorable/Birds/Zebra-Finch.png",
      "Duck|Mandarin": "src/images/Birdorable/Birds/Mandarin-Duck.png",
      "Duck|Wood": "src/images/Birdorable/Birds/Wood-Duck.png",
      "Duck|Pekin": "src/images/Birdorable/Birds/Pekin-Duck.png",
      "Goose|Embden": "src/images/Birdorable/Birds/Embden-Goose.png",
      "Goose|Snow": "src/images/Birdorable/Birds/Snow-Goose.png",
      "Flamingo|Greater": "src/images/Birdorable/Birds/Greater-Flamingo.png",
      "Flamingo|Chilean": "src/images/Birdorable/Birds/Chilean-Flamingo.png",
      "Owl|Barn": "src/images/Birdorable/Birds/Barn-Owl.png",
      "Owl|Snowy": "src/images/Birdorable/Birds/Snowy-Owl.png",
      "Eagle|Golden": "src/images/Birdorable/Birds/Golden-Eagle.png",
      "Eagle|Harpy": "src/images/Birdorable/Birds/Harpy-Eagle.png",
      "Falcon|Peregrine": "src/images/Birdorable/Birds/Peregrine-Falcon.png",
      "Toucan|Keel-Billed": "src/images/Birdorable/Birds/Keel-billed-Toucan.png",
      "Toucan|Toco": "src/images/Birdorable/Birds/Toco-Toucan.png",
      "Gull|Herring": "src/images/Birdorable/Birds/Herring-Gull.png",
      "Swan|Black": "src/images/Birdorable/Birds/Black-Swan.png",
      "Chicken|Red Junglefowl": "src/images/Birdorable/Birds/Red-Junglefowl.png",
      "Peafowl|Indian": "src/images/Birdorable/Birds/Indian-Peafowl.png",
      'Macaw|Blue and Gold': "src/images/Birdorable/Birds/Blue-and-yellow-Macaw.png",
      'Macaw|Blue-headed': "src/images/Birdorable/Birds/Blue-headed-Macaw.png",
      'Macaw|Blue-throated': "src/images/Birdorable/Birds/Blue-throated-Macaw.png",
      'Macaw|Blue-winged': "src/images/Birdorable/Birds/Blue-winged-Macaw.png",
      'Macaw|Chestnut-fronted': "src/images/Birdorable/Birds/Chestnut-fronted-Macaw.png",
      'Macaw|Golden-collared': "src/images/Birdorable/Birds/Golden-collared-Macaw.png",
      'Macaw|Hyacinth': "src/images/Birdorable/Birds/Hyacinth-Macaw.png",
      'Macaw|Indigo': "src/images/Birdorable/Birds/Indigo-Macaw.png",
      'Macaw|Military': "src/images/Birdorable/Birds/Military-Macaw.png",
      'Macaw|Red-shouldered': "src/images/Birdorable/Birds/Red-shouldered-Macaw.png",
      'Macaw|Scarlet': "src/images/Birdorable/Birds/Scarlet-Macaw.png",
      "Macaw|Spix's": "src/images/Birdorable/Birds/Spix's-Macaw.png",
      'Cockatoo|Galah': "src/images/Birdorable/Birds/Galah.png",
      'Cockatoo|Palm': "src/images/Birdorable/Birds/Palm-Cockatoo.png",
      'Cockatoo|Pink': "src/images/Birdorable/Birds/Pink-Cockatoo.png",
      'Cockatoo|Red-tailed Black': "src/images/Birdorable/Birds/Red-tailed-Black-Cockatoo.png",
      'Cockatoo|Salmon-crested': "src/images/Birdorable/Birds/Salmon-crested-Cockatoo.png",
      'Cockatoo|Sulphur-crested': "src/images/Birdorable/Birds/Sulphur-crested-Cockatoo.png",
      'Cockatoo|Umbrella': "src/images/Birdorable/Birds/Umbrella-Cockatoo.png",
      'Cockatoo|White-tailed Black': "src/images/Birdorable/Birds/White-tailed-Black-Cockatoo.png",
      'Cockatoo|Yellow-crested': "src/images/Birdorable/Birds/Yellow-crested-Cockatoo.png",
      "Cockatoo|Goffin's": "src/images/Birdorable/Birds/Tanimbar-Corella.png",
      'Amazon|Blue-fronted': "src/images/Birdorable/Birds/Blue-fronted-Parrot.png",
      'Amazon|Mealy': "src/images/Birdorable/Birds/Mealy-Parrot.png",
      'Amazon|Orange-winged': "src/images/Birdorable/Birds/Orange-winged-Parrot.png",
      'Amazon|Saint Lucia': "src/images/Birdorable/Birds/Saint-Lucia-Parrot.png",
      'Amazon|Vinaceous': "src/images/Birdorable/Birds/Vinaceous-Parrot.png",
      'Amazon|White-fronted': "src/images/Birdorable/Birds/White-fronted-Parrot.png",
      'Amazon|Yellow-headed': "src/images/Birdorable/Birds/Yellow-headed-Amazon.png",
      'Amazon|Yellow-Naped': "src/images/Birdorable/Birds/Yellow-naped-Parrot.png",
      'Conure|Blue-crowned': "src/images/Birdorable/Birds/Blue-crowned-Conure.png",
      'Conure|Jandaya': "src/images/Birdorable/Birds/Jandaya-Conure.png",
      'Conure|Sun': "src/images/Birdorable/Birds/Sun-Parakeet.png",
      'Conure|Crimson-bellied': "src/images/Birdorable/Birds/Crimson-bellied-Parakeet.png",
      'Conure|Dusky-headed': "src/images/Birdorable/Birds/Dusky-headed-Parakeet.png",
      'Conure|Golden-capped': "src/images/Birdorable/Birds/Golden-capped-Parakeet.png",
      'Conure|Golden': "src/images/Birdorable/Birds/Golden-Parakeet.png",
      'Conure|Maroon-bellied': "src/images/Birdorable/Birds/Maroon-bellied-Parakeet.png",
      'Conure|Nanday': "src/images/Birdorable/Birds/Nanday-Parakeet.png",
      'Conure|Orange-fronted': "src/images/Birdorable/Birds/Orange-fronted-Parakeet.png",
      'Conure|Peach-fronted': "src/images/Birdorable/Birds/Peach-fronted-Parakeet.png",
      'Parakeet|Alexandrine': "src/images/Birdorable/Birds/Alexandrine-Parakeet.png",
      'Parakeet|Blossom-headed': "src/images/Birdorable/Birds/Blossom-headed-Parakeet.png",
      'Parakeet|Burrowing': "src/images/Birdorable/Birds/Burrowing-Parakeet.png",
      'Parakeet|Golden-winged': "src/images/Birdorable/Birds/Golden-winged-Parakeet.png",
      "Parakeet|Lord Derby's": "src/images/Birdorable/Birds/Lord-Derby's-Parakeet.png",
      'Parakeet|Plum-headed': "src/images/Birdorable/Birds/Plum-headed-Parakeet.png",
      'Parakeet|Superb': "src/images/Birdorable/Birds/Superb-Parrot.png",
      'Parakeet|Indian Ring-Necked': "src/images/Birdorable/Birds/Rose-ringed-Parakeet.png",
      'Parakeet|King': "src/images/Birdorable/Birds/Australian-King-Parrot.png",
      'Lovebird|Black-collared': "src/images/Birdorable/Birds/Black-collared-Lovebird.png",
      'Lovebird|Black-winged': "src/images/Birdorable/Birds/Black-winged-Lovebird.png",
      "Lovebird|Fischer's": "src/images/Birdorable/Birds/Fischer's-Lovebird.png",
      'Lovebird|Gray-headed': "src/images/Birdorable/Birds/Gray-headed-Lovebird.png",
      "Lovebird|Lilian's": "src/images/Birdorable/Birds/Lilian's-Lovebird.png",
      'Lovebird|Rosy-faced': "src/images/Birdorable/Birds/Rosy-faced-Lovebird.png",
      'Lovebird|Yellow-collared': "src/images/Birdorable/Birds/Yellow-collared-Lovebird.png",
      'Caique|Black-headed': "src/images/Birdorable/Birds/Black-headed-Parrot.png",
      'Caique|White-bellied': "src/images/Birdorable/Birds/White-bellied-Parrot.png",
      'Pionus Parrot|Blue-headed': "src/images/Birdorable/Birds/Blue-headed-Parrot.png",
      'Pionus Parrot|Scaly-headed': "src/images/Birdorable/Birds/Scaly-headed-Parrot.png",
      'Pionus Parrot|White-crowned': "src/images/Birdorable/Birds/White-crowned-Parrot.png",
      'Lory|Chattering': "src/images/Birdorable/Birds/Chattering-Lory.png",
      'Lory|Dusky': "src/images/Birdorable/Birds/Dusky-Lory.png",
      'Lory|Yellow-bibbed': "src/images/Birdorable/Birds/Yellow-bibbed-Lory.png",
      'Rosella|Crimson': "src/images/Birdorable/Birds/Crimson-Rosella.png",
      'Rosella|Eastern': "src/images/Birdorable/Birds/Eastern-Rosella.png",
      'Rosella|Northern': "src/images/Birdorable/Birds/Northern-Rosella.png",
    },
    mutationOverrides: {},
    // One illustration per species, keyed by eBird species code (js/data/icon-species-birdorable.js,
    // generated from species-map.json). The node icons and subspecies keys above remain as fallbacks.
    speciesIcons: BIRDORABLE_SPECIES_ICONS,
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
  //
  // NOTE on the Birdorable pack: built from src/images/Birdorable/species-map.json (840
  // species, files under Birds/). Parrots are covered species-by-species via
  // subspeciesOverrides; other groups get one representative icon per taxonomy node plus a
  // few well-known subspecies. Left unused on purpose: Cape/Brown-headed/Meyer's Parrot (the
  // poicephalus node holds a single icon), Blue-naped Parrot, Carolina Parakeet (extinct),
  // "Uncape Parrot" (unidentifiable), and the ~700 other species that don't map to a node yet.
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

// Most specific art wins: this species (and mutation) -> older free-text overrides -> the species'
// genus/family/order category and its parents -> the generic bird. A pack only needs art for
// the levels it has; everything else falls through.
function resolveBirdIcon(bird) {
  var pack = getActiveIconPack();

  if (bird.speciesCode) {
    var byMutation = pack.speciesMutationIcons && bird.mutation && pack.speciesMutationIcons[bird.speciesCode + '|' + bird.mutation];
    if (byMutation) return byMutation;
    if (pack.speciesIcons && pack.speciesIcons[bird.speciesCode]) return pack.speciesIcons[bird.speciesCode];
  }

  // Birds not linked to a species yet still use the free-text keys.
  var mutKey = bird.species + '|' + bird.subspecies + '|' + (bird.mutation || '');
  if (bird.mutation && pack.mutationOverrides[mutKey]) return pack.mutationOverrides[mutKey];

  var subKey = bird.species + '|' + bird.subspecies;
  if (bird.subspecies && pack.subspeciesOverrides[subKey]) return pack.subspeciesOverrides[subKey];

  var key = nodeForBird(bird);
  while (key) {
    if (pack.icons[key]) return pack.icons[key];
    var node = TAXONOMY_NODES[key];
    if (!node) break;
    key = node.parent;
  }
  return pack.icons['bird'] || ICON_PACKS[0].icons['bird'];
}

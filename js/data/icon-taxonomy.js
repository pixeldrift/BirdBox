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
  'Lory': 'lory',
  'Rosella': 'rosella',
  'Pionus Parrot': 'pionus-parrot',
  'Vasa Parrot': 'vasa-parrot',
  'Kea': 'kea',
  "Pesquet's Parrot": 'pesquets-parrot',
  'Kakapo': 'kakapo',
};

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
  },
  {
    id: 'birdorable',
    label: 'Birdorable',
    description: 'Cute round cartoon birds by Birdorable.com — visit their shop for merch featuring your birds.',
    // Built from src/images/Birdorable/species-map.json (hash-matched against the user's saved
    // birdorable.com/meet pages, see that file's _comment). Species/subspecies keys below use
    // our own field convention (e.g. "Macaw|Scarlet"), not Birdorable's slugs — cross-referenced
    // by hand against species-map.json, not guessed from filenames or artwork.
    icons: {
      'macaw': 'src/images/Birdorable/Parrots-Parakeets/kv6z3vmtuw52edvlmp2ssvmjrwwbcxssb0balbu39eed7pyo@2x.webp',
      'cockatoo': 'src/images/Birdorable/Parrots-Parakeets/v9ntt8cp9qibxeao9jq98znn1p4i1hnab0lfuq8hkbzdv2hb@2x.webp',
      'amazon': 'src/images/Birdorable/Parrots-Parakeets/zvwazello6pzmlmkzcdhft3cgoaws44j1sxp3vlj2bf75n7d@2x.webp',
      'eclectus': 'src/images/Birdorable/Parrots-Parakeets/8zofuo3u3poc9lm17t9gpqpjehugsnrk95j0hybj8vxu5cat@2x.webp',
      'cockatiel': 'src/images/Birdorable/Parrots-Parakeets/717nag48lu5cb1gir0kqns3gigh90hw2yysh8fkpxer84d3c@2x.webp',
      'lovebird': 'src/images/Birdorable/Parrots-Parakeets/c34qgo0ie4yzq51v85t82wo9ykzmmetp8zdfbf84yhcjavro@2x.webp',
      'conure': 'src/images/Birdorable/Parrots-Parakeets/zl3n7gpupr9qs2fiykyg1ct3zu10t065mpb31ohtcknijl3g@2x.webp',
      'parakeet': 'src/images/Birdorable/Parrots-Parakeets/94v8099sloibntymb8emgzrrbbm2608dgdz8wqlv909lpod3@2x.webp',
      'budgie': 'src/images/Birdorable/Parrots-Parakeets/u0wpk52sy8hhpjenfkmlheeult4o5ml2mi7b6k0imwku90f6@2x.webp',
      'parrotlet': 'src/images/Birdorable/Parrots-Parakeets/8dqrr75abq8iu6la1j99atmgvaipqu6txcbce5ndpcqpi0n6@2x.webp',
      'quaker': 'src/images/Birdorable/Parrots-Parakeets/89wrqxzmu1pvyfitpswau58u0vazh73h5twm1f98z3rxrn9w@2x.webp',
      'bourkes-parakeet': "src/images/Birdorable/Parrots-Parakeets/awxz4jvwmsq3yd0m2gv895hdr3yme25zbhjuunp8g63b3r1i@2x.webp",
      'poicephalus': 'src/images/Birdorable/Parrots-Parakeets/bikveo3x8kolrxzpv8s8q3vsmyb2ffp2zmud8iwyc4sz17n2@2x.webp',
      'caique': 'src/images/Birdorable/Parrots-Parakeets/4dbqm689jcn7mxeqsdhe2snwr68m0p2ejzsf8ajdvcvjk9n1@2x.webp',
      'pionus-parrot': 'src/images/Birdorable/Parrots-Parakeets/97Wll0G9CENTM75bYZv61ARM7kh7KgWJEP09l7U7mK6gfp0i@2x.webp',
      'lory': 'src/images/Birdorable/Parrots-Parakeets/j8wd42l8476htymrn3k5hfut6o5jmfqw43bw2fw0sujy9yaw@2x-1.webp',
      'rosella': 'src/images/Birdorable/Parrots-Parakeets/xfbdey2926z8pwxlq36fxkfj3joxcjq6fqbvi9jruw2wu7n5@2x.webp',
      'kakapo': 'src/images/Birdorable/Parrots-Parakeets/clni2noiefiskevlvjk8227vx33r8khtwm4h1aethf3kw3l5@2x.webp',
      'kea': 'src/images/Birdorable/Parrots-Parakeets/phqhbydeynlh2tk2dlqd6m5tybstk45gc2oc107wp4ug8msx@2x.webp',
      'vasa-parrot': 'src/images/Birdorable/Parrots-Parakeets/jo1beksqh3q69re5mirobqi4nisj4sbtflast3lz1lup04i7@2x.webp',
      'pesquets-parrot': "src/images/Birdorable/Parrots-Parakeets/W0dj89zniPk2a107Kzu5p2LYBb5K0uDmfSyrlamz28qMSI1j@2x.webp",
    },
    // Exact species/subspecies matches, mapped from Birdorable's own species names onto our
    // Species|Subspecies convention (e.g. Birdorable's "Blue-and-yellow Macaw" -> our
    // "Macaw|Blue and Gold", matching Rio's record). Far deeper than the node-level `icons`
    // above since Birdorable draws many individual species per genus (12 macaws, 9 cockatoos,
    // 11 conures/Aratinga-type parakeets, ...) where our taxonomy only has one node per genus.
    subspeciesOverrides: {
      'Macaw|Blue and Gold': 'src/images/Birdorable/Parrots-Parakeets/kv6z3vmtuw52edvlmp2ssvmjrwwbcxssb0balbu39eed7pyo@2x.webp',
      'Macaw|Blue-headed': 'src/images/Birdorable/Parrots-Parakeets/x7imbiyuciutrdomtoe907dtwnvtsvt4q3363u6plswhy026@2x.webp',
      'Macaw|Blue-throated': 'src/images/Birdorable/Parrots-Parakeets/bu0rcv3dself1u102q4zjvbafx121yfdavggus4qaftgp3rs@2x.webp',
      'Macaw|Blue-winged': 'src/images/Birdorable/Parrots-Parakeets/n5pT63I17s4jM020kWmgaASjF5iIlwlMzxeY20963HnUS9L6@2x.webp',
      'Macaw|Chestnut-fronted': 'src/images/Birdorable/Parrots-Parakeets/fjkmgnmjecwhgd159tt59sxnzd0tno9odsuaepdn6fxnm13l@2x.webp',
      'Macaw|Golden-collared': 'src/images/Birdorable/Parrots-Parakeets/u8ctemsrpaesz6279kfw34emdazjauazngmvzejb2glqwavc@2x.webp',
      'Macaw|Hyacinth': 'src/images/Birdorable/Parrots-Parakeets/xm892wexshu40nbm9bn7okxy02jrr0y76pqsv8or0jq4vi89@2x-1.webp',
      'Macaw|Indigo': 'src/images/Birdorable/Parrots-Parakeets/9eWsTAV5RCsVprFIm62pMnvR3aroxRBGcqOneNnffe2szsk9@2x.webp',
      'Macaw|Military': 'src/images/Birdorable/Parrots-Parakeets/o6cialgnjcemj49sife5i3e4ktc9wl495qugfmj1y7kimps3@2x.webp',
      'Macaw|Red-shouldered': 'src/images/Birdorable/Parrots-Parakeets/5ugs3nrmsozv4ofsacz0dnd9tjdcj32fkw06t28vafvimheq@2x.webp',
      'Macaw|Scarlet': 'src/images/Birdorable/Parrots-Parakeets/3jrjl3llel4rm1xpfaai7emtpllq3v3r8qnn60mto49utjrn@2x.webp',
      "Macaw|Spix's": 'src/images/Birdorable/Parrots-Parakeets/3aclycg2p018nmgtuu13nr01sbrtfqmw2dazvvjir6vyuctb@2x.webp',
      'Cockatoo|Galah': 'src/images/Birdorable/Parrots-Parakeets/01nc3s7f7ouuehv0o6k05zcykqd1ps6itk0yqqye6nc6kwvz@2x.webp',
      'Cockatoo|Palm': 'src/images/Birdorable/Parrots-Parakeets/we224k9nex54g1rs217jhr97poautf29jy8s9bv1urc5qpad@2x.webp',
      'Cockatoo|Pink': 'src/images/Birdorable/Parrots-Parakeets/bghrgtuaczspa4b7isdzw05hniluhtwb3mcmuvh554ujp96@2x.webp',
      'Cockatoo|Red-tailed Black': 'src/images/Birdorable/Parrots-Parakeets/vtou9ge6px5femzc1nc2nnfqqstu2m61wnxgdf7cba56c4za@2x.webp',
      'Cockatoo|Salmon-crested': 'src/images/Birdorable/Parrots-Parakeets/dhpweyfealcwf76imay4b4i5kuzulprswutz8l6atals24qw@2x.webp',
      'Cockatoo|Sulphur-crested': 'src/images/Birdorable/Parrots-Parakeets/llpomrzw380a4m4nwz0rc00x2reiavblujcesgxd4o406gka@2x.webp',
      'Cockatoo|Umbrella': 'src/images/Birdorable/Parrots-Parakeets/v9ntt8cp9qibxeao9jq98znn1p4i1hnab0lfuq8hkbzdv2hb@2x.webp',
      'Cockatoo|White-tailed Black': 'src/images/Birdorable/Parrots-Parakeets/0xiisrv5sbqf01x6lam86yowk0kg2x5juzqgrwof6y9cqucr@2x.webp',
      'Cockatoo|Yellow-crested': 'src/images/Birdorable/Parrots-Parakeets/r735910ts4is0jt6ukkjfefuo84pfv9x2v30oo40b767llhq@2x.webp',
      "Cockatoo|Goffin's": 'src/images/Birdorable/Parrots-Parakeets/h33ntgys2jjgy0ran6i06bl9xpr1bx6kfq4l88ucfcthimsn@2x.webp',
      'Amazon|Blue-fronted': 'src/images/Birdorable/Parrots-Parakeets/w7sjutmv7e3rt3qhq82d8e265iczbpa0xlg9jq9elo0700co@2x.webp',
      'Amazon|Mealy': 'src/images/Birdorable/Parrots-Parakeets/xdlcngpl7dlnr9633y6d0y16ot276ardcv8uzlmkx9hijtuo@2x.webp',
      'Amazon|Orange-winged': 'src/images/Birdorable/Parrots-Parakeets/qobe2abznqi1awcts6vzyi4b0em2m7av5p99k22hpi1fzjvn@2x.webp',
      'Amazon|Saint Lucia': 'src/images/Birdorable/Parrots-Parakeets/ce7aoukdfzqtih9z7xflrtdu3o8vm4qfpdmq22l1i2in0b98@2x.webp',
      'Amazon|Vinaceous': 'src/images/Birdorable/Parrots-Parakeets/qvjvcpja7z9q0lcnwuyamrm5dyoyz11n804vj74vmv35k9@2x.webp',
      'Amazon|White-fronted': 'src/images/Birdorable/Parrots-Parakeets/i3246a0a9oh2ppjybdduchy3e86no4qpwkivagcst5lnwgg5@2x.webp',
      'Amazon|Yellow-headed': 'src/images/Birdorable/Parrots-Parakeets/zvwazello6pzmlmkzcdhft3cgoaws44j1sxp3vlj2bf75n7d@2x.webp',
      'Amazon|Yellow-Naped': 'src/images/Birdorable/Parrots-Parakeets/07lny1iel0bzyfh8iruhjy7mp8g6s8ceu8nuib7069m63ul8@2x.webp',
      'Conure|Blue-crowned': 'src/images/Birdorable/Parrots-Parakeets/zl3n7gpupr9qs2fiykyg1ct3zu10t065mpb31ohtcknijl3g@2x.webp',
      'Conure|Jandaya': 'src/images/Birdorable/Parrots-Parakeets/a21813d65bo7y5d2lf0aeddqul38bcg5p9lvlm531uwjigxz@2x.webp',
      'Conure|Sun': 'src/images/Birdorable/Parrots-Parakeets/xmdg8hbtb7e34n0b8k0xqngsct1g73eik6y9ld5l1czc0fyd@2x.webp',
      'Conure|Crimson-bellied': 'src/images/Birdorable/Parrots-Parakeets/521b1pqfvrnh4r34u5t3dspq8ulg3gi9g5lc6zqrdhmunjbs@2x.webp',
      'Conure|Dusky-headed': 'src/images/Birdorable/Parrots-Parakeets/m7nor777hqmbmbl96qdpx6mudcgf09p4bkmosvyb75199mtk@2x.webp',
      'Conure|Golden-capped': 'src/images/Birdorable/Parrots-Parakeets/qn7xssqjal0bgrhts2h1chldfgodlixigyynf520ein3dk8@2x.webp',
      'Conure|Golden': 'src/images/Birdorable/Parrots-Parakeets/ag7zk34v5fil0gds5hmesmujg1kjnzikmhjq5svq6r4vwxh3@2x.webp',
      'Conure|Maroon-bellied': 'src/images/Birdorable/Parrots-Parakeets/6wavd7t1bavt38tgtiy1z5x3ukv5dw19qflq522bo6k71pp6@2x.webp',
      'Conure|Nanday': 'src/images/Birdorable/Parrots-Parakeets/a14zh0umpzlf37nbjo3hykbcl7sk14rikfrrrr6qwfkkzfnt@2x.webp',
      'Conure|Orange-fronted': 'src/images/Birdorable/Parrots-Parakeets/v9nukr09la5opafu9hsulzr3qmzdq92wc3e34g32c7sc3vk@2x.webp',
      'Conure|Peach-fronted': 'src/images/Birdorable/Parrots-Parakeets/2nfdcpe9zj68gmgns7ji2ot00kby1hvou4y9z4ibkeyg9xcs@2x.webp',
      'Parakeet|Alexandrine': 'src/images/Birdorable/Parrots-Parakeets/zm2tdkwunuiwc2wob49oxkoh0vyh6icfsq3lc35e02bmp1ux@2x.webp',
      'Parakeet|Blossom-headed': 'src/images/Birdorable/Parrots-Parakeets/9s8zqjbcyx1bl4d2rbiprkv03plokojio799h9jrz9y1o6j3@2x.webp',
      'Parakeet|Burrowing': 'src/images/Birdorable/Parrots-Parakeets/nc9r5v8e25jkyxp1ln4pvdvmff5amp6898350lanuxerev23@2x.webp',
      'Parakeet|Golden-winged': 'src/images/Birdorable/Parrots-Parakeets/1ypgg488ghlx1lxr6q0u2cajtdmsg0zmkg1ny8ejnpx5qcq6@2x.webp',
      "Parakeet|Lord Derby's": 'src/images/Birdorable/Parrots-Parakeets/0b89hgoemq2q5s4byiansn677vu0p5c81iyd36o88cskego3@2x.webp',
      'Parakeet|Plum-headed': 'src/images/Birdorable/Parrots-Parakeets/kbnwv4mvwr52omnr7c7rqrgbfwt04sbxm4kf2q1lct5ydaq6@2x.webp',
      'Parakeet|Superb': 'src/images/Birdorable/Parrots-Parakeets/n5jgupmn5nl5r8vqf0t4ogsq232l5vglj5y4a4h88lxydb9@2x.webp',
      'Parakeet|Indian Ring-Necked': 'src/images/Birdorable/Parrots-Parakeets/94v8099sloibntymb8emgzrrbbm2608dgdz8wqlv909lpod3@2x.webp',
      'Parakeet|King': 'src/images/Birdorable/Parrots-Parakeets/5tviV46qiUDs5fGY4Ig8AzY2Mz663lPksRTgR6Hg2aXpypPp@2x.webp',
      'Lovebird|Black-collared': 'src/images/Birdorable/Parrots-Parakeets/jilyjq7wmq1nilp1hek3b3xuf9pavm7pjc6y1xix6mgauqxd@2x.webp',
      'Lovebird|Black-winged': 'src/images/Birdorable/Parrots-Parakeets/nu7i4a77wolkvwy7usn5whgvd08afgev2b0ee8nii1vzt7im@2x.webp',
      "Lovebird|Fischer's": 'src/images/Birdorable/Parrots-Parakeets/dfjz8apfreqpt3r6f7z8l00kvvqxo4fr2fqihe9788k111od@2x.webp',
      'Lovebird|Gray-headed': 'src/images/Birdorable/Parrots-Parakeets/rlapttanpf8qed60wuhrntijbaug5feui63vko2lp38r706g@2x.webp',
      "Lovebird|Lilian's": 'src/images/Birdorable/Parrots-Parakeets/mn6wsxhz5g1u1f9ezsamxuxojslabb2jenidtsmor3iibby5@2x.webp',
      'Lovebird|Rosy-faced': 'src/images/Birdorable/Parrots-Parakeets/c34qgo0ie4yzq51v85t82wo9ykzmmetp8zdfbf84yhcjavro@2x.webp',
      'Lovebird|Yellow-collared': 'src/images/Birdorable/Parrots-Parakeets/q2h3s2zyeot00plnr4ejegf15u1s3c1dlu8zu3fsljl1dpq4@2x.webp',
      'Caique|Black-headed': 'src/images/Birdorable/Parrots-Parakeets/4dbqm689jcn7mxeqsdhe2snwr68m0p2ejzsf8ajdvcvjk9n1@2x.webp',
      'Caique|White-bellied': 'src/images/Birdorable/Parrots-Parakeets/4ff9182bgtrmufoaqsjnanjc9ybrot91lacebeok4vxx5iym@2x.webp',
      'Pionus Parrot|Blue-headed': 'src/images/Birdorable/Parrots-Parakeets/97Wll0G9CENTM75bYZv61ARM7kh7KgWJEP09l7U7mK6gfp0i@2x.webp',
      'Pionus Parrot|Scaly-headed': 'src/images/Birdorable/Parrots-Parakeets/hg616s5toglzrtu9aasxq4tuczmfnstkbsh3t8rh4x346ipu@2x.webp',
      'Pionus Parrot|White-crowned': 'src/images/Birdorable/Parrots-Parakeets/v1k16uz6dddhcaxw0fsg57l3jlheeijgbrblvkfh3gjd6hn@2x-1.webp',
      'Lory|Chattering': 'src/images/Birdorable/Parrots-Parakeets/xmyx170ps188dy3nktfa531hag71phtavzc0ahvpge9v3t2s@2x.webp',
      'Lory|Dusky': 'src/images/Birdorable/Parrots-Parakeets/j8wd42l8476htymrn3k5hfut6o5jmfqw43bw2fw0sujy9yaw@2x-1.webp',
      'Lory|Yellow-bibbed': 'src/images/Birdorable/Parrots-Parakeets/09rxix4sytw9fegot1rqu97cj3u0lyz24k6w4hq69u3e1d86@2x-1.webp',
      'Rosella|Crimson': 'src/images/Birdorable/Parrots-Parakeets/bsuiawcm6rc6gbka1u2eaovei6ow78wi86akb9y9f329eaqm@2x.webp',
      'Rosella|Eastern': 'src/images/Birdorable/Parrots-Parakeets/xfbdey2926z8pwxlq36fxkfj3joxcjq6fqbvi9jruw2wu7n5@2x.webp',
      'Rosella|Northern': 'src/images/Birdorable/Parrots-Parakeets/khv7x2rxhrbg1ie1u348qytfimzbaz4ubob4k3pu9l303mn@2x.webp',
    },
    mutationOverrides: {},
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
  // NOTE on the Birdorable pack: only 79 of the 85 identified species are used above.
  // Skipped rather than guessed into a category: Blue-naped Parrot and Carolina
  // Parakeet (extinct, no living pet-trade equivalent) have no genus-mate node to sit
  // under; Cape Parrot, Brown-headed Parrot, and Meyer's Parrot are real Poicephalus
  // species but that node only holds one icon (Senegal Parrot already has it) since
  // our taxonomy doesn't yet split Poicephalus into per-species nodes; "Uncape
  // Parrot" isn't a real bird name we could confidently identify. Also unused: the 20
  // src/images/Birdorable/Parrots-Parakeets files not yet matched to a species at all
  // (see species-map.json's unresolvedFiles) and every Birdorable category beyond
  // Parrots-Parakeets the user hasn't uploaded yet (docs/roadmap.md).
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

// Naming data layered on top of the eBird/Clements taxonomy, which is the source of truth for
// species and scientific names. Everything here is keyed by SCIENTIFIC name (not eBird code) on
// purpose: codes change when species split, scientific names are what the seed script resolves
// against the current taxonomy, and anything that no longer resolves is reported, not dropped.
//
// Labels in the app use the US aviculture common name ("display name"), falling back to eBird's
// common name; scientific names are shown only as secondary information. Every name below is also
// searchable. These are suggestions for the user to review, US-centric first.

// Alternate names: [name, kind]. kind: trade | regional | historical | common | other
const ALIASES = {
  // Conures, parakeets and friends
  'Aratinga solstitialis': [['Sun Conure', 'trade']],
  'Aratinga jandaya': [['Jenday Conure', 'trade'], ['Jenday', 'trade']],
  'Pyrrhura molinae': [['Green-cheeked Conure', 'trade'], ['Green-cheek Conure', 'trade'], ['Greencheek', 'trade']],
  'Psittacara erythrogenys': [['Cherry-headed Conure', 'trade'], ['Red-masked Conure', 'trade']],
  'Psittacara mitratus': [['Mitred Conure', 'trade']],
  'Myiopsitta monachus': [['Quaker Parrot', 'trade'], ['Quaker', 'trade'], ['Quaker Parakeet', 'trade']],
  'Psittacula krameri': [['Indian Ringneck', 'trade'], ['Ringneck', 'trade'], ['Indian Ring-necked Parakeet', 'trade'], ['Ring-necked Parakeet', 'common']],
  'Psittacula eupatria': [['Alexandrine', 'trade']],
  'Psittacula cyanocephala': [['Plumhead', 'trade']],
  'Psittacula alexandri': [['Moustache Parakeet', 'trade'], ['Moustached Parakeet', 'common']],
  'Melopsittacus undulatus': [['Budgie', 'trade'], ['Parakeet', 'trade'], ['Shell Parakeet', 'trade']],
  'Bolborhynchus lineola': [['Linnie', 'trade'], ['Lineolated Parakeet', 'common']],
  'Neopsephotus bourkii': [["Bourke's Parakeet", 'trade']],
  'Cyanoramphus novaezelandiae': [['Kakariki', 'regional'], ['Red-crowned Kakariki', 'trade']],
  'Trichoglossus moluccanus': [['Rainbow Lorikeet', 'trade']],

  // African parrots, Eclectus, Amazons, Pionus, Caiques, lovebirds
  'Psittacus erithacus': [['African Grey', 'regional'], ['African Gray', 'trade'], ['African Grey Parrot', 'trade'], ['Congo African Grey', 'trade'], ['Congo African Gray', 'trade'], ['Grey Parrot', 'regional']],
  'Psittacus timneh': [['Timneh African Grey', 'trade'], ['Timneh African Gray', 'trade'], ['Timneh Grey', 'trade'], ['Timneh', 'trade']],
  // Clements splits Eclectus into several species; breeders treat it as one, so each carries the umbrella name.
  'Eclectus roratus': [['Eclectus Parrot', 'trade'], ['Eclectus', 'trade'], ['Vosmaeri Eclectus', 'trade']],
  'Eclectus polychloros': [['Eclectus Parrot', 'trade'], ['Eclectus', 'trade'], ['Red-sided Eclectus', 'trade']],
  'Eclectus riedeli': [['Eclectus Parrot', 'trade'], ['Eclectus', 'trade']],
  'Eclectus cornelia': [['Eclectus Parrot', 'trade'], ['Eclectus', 'trade']],
  'Poicephalus senegalus': [['Senegal', 'trade']],
  'Amazona oratrix': [['Double Yellow-headed Amazon', 'trade'], ['Double Yellow Head', 'trade']],
  'Amazona aestiva': [['Blue-fronted Amazon', 'trade']],
  'Amazona ochrocephala': [['Panama Amazon', 'trade']],
  'Amazona viridigenalis': [['Green-cheeked Amazon', 'trade'], ['Mexican Red-headed Amazon', 'trade']],
  'Amazona vinacea': [['Vinaceous Amazon', 'trade']],
  'Pionus chalcopterus': [['Bronze-winged Pionus', 'trade']],
  'Pionus senilis': [['White-capped Pionus', 'trade']],
  'Pionus maximiliani': [["Maximilian's Pionus", 'trade'], ['Maximilian Pionus', 'trade']],
  'Pionites melanocephalus': [['Black-headed Caique', 'trade']],
  'Pionites leucogaster': [['White-bellied Caique', 'trade']],
  'Agapornis roseicollis': [['Peach-faced Lovebird', 'trade'], ['Peachface', 'trade']],
  'Agapornis personatus': [['Masked Lovebird', 'trade']],
  'Agapornis lilianae': [['Nyasa Lovebird', 'trade']],
  'Agapornis nigrigenis': [['Black-masked Lovebird', 'trade']],

  // Cockatoos
  'Cacatua alba': [['Umbrella Cockatoo', 'trade']],
  'Cacatua moluccensis': [['Moluccan Cockatoo', 'trade']],
  'Cacatua goffiniana': [["Goffin's Cockatoo", 'trade'], ['Goffin Cockatoo', 'trade'], ['Goffins', 'trade']],
  'Cacatua leadbeateri': [["Major Mitchell's Cockatoo", 'trade'], ["Leadbeater's Cockatoo", 'historical'], ['Major Mitchell', 'trade']],
  'Cacatua ducorpsii': [["Ducorps's Cockatoo", 'trade'], ['Ducorps Cockatoo', 'trade'], ['Solomon Islands Cockatoo', 'trade']],
  'Cacatua sulphurea': [['Lesser Sulphur-crested Cockatoo', 'trade']],
  'Cacatua haematuropygia': [['Red-vented Cockatoo', 'trade']],
  'Cacatua pastinator': [["Muir's Corella", 'regional']],
  'Eolophus roseicapilla': [['Rose-breasted Cockatoo', 'trade']],

  // Macaws
  'Ara ararauna': [['Blue and Gold Macaw', 'trade'], ['Blue & Gold Macaw', 'trade'], ['Blue-and-gold Macaw', 'trade']],
  'Ara chloropterus': [['Green-winged Macaw', 'trade']],
  'Ara ambiguus': [["Buffon's Macaw", 'trade']],
  'Ara severus': [['Severe Macaw', 'trade']],
  'Diopsittaca nobilis': [["Hahn's Macaw", 'trade']],
  'Primolius maracana': [["Illiger's Macaw", 'trade']],
  'Primolius auricollis': [['Yellow-naped Macaw', 'trade']],

  // Finches, doves, pigeons, game birds, waterfowl, ratites
  'Chloebia gouldiae': [['Lady Gouldian Finch', 'trade'], ['Gouldian', 'trade']],
  'Lonchura striata': [['Society Finch', 'trade'], ['Bengalese Finch', 'trade']],
  'Lonchura punctulata': [['Spice Finch', 'trade'], ['Nutmeg Mannikin', 'regional']],
  'Amandava amandava': [['Strawberry Finch', 'trade']],
  'Stizoptera bichenovii': [['Owl Finch', 'trade'], ["Bichenov's Finch", 'trade']],
  'Amadina fasciata': [['Cutthroat Finch', 'trade']],
  'Padda oryzivora': [['Java Finch', 'trade']],
  'Serinus canaria': [['Canary', 'trade'], ['Domestic Canary', 'trade']],
  'Columba livia': [['Domestic Pigeon', 'trade'], ['Racing Pigeon', 'trade'], ['Homing Pigeon', 'trade'], ['Feral Pigeon', 'common']],
  'Streptopelia roseogrisea': [['Barbary Dove', 'trade'], ['Ringneck Dove', 'trade']],
  'Gallus gallus': [['Chicken', 'common'], ['Domestic Chicken', 'common']],
  'Meleagris gallopavo': [['Turkey', 'common'], ['Domestic Turkey', 'common']],
  'Anas platyrhynchos': [['Domestic Duck', 'common']],
  'Anser anser': [['Domestic Goose', 'common']],
  'Struthio camelus': [['Ostrich', 'common']],
  'Dromaius novaehollandiae': [['Emu', 'common']],
  'Pavo cristatus': [['Peafowl', 'common'], ['Peacock', 'common'], ['Indian Peacock', 'common']],
};

// US display names that differ from eBird's common name: the name shown in labels. Species with no
// entry here and no matching genus rule below just use eBird's (American English) common name.
const DISPLAY = {
  'Psittacus erithacus': 'African Grey',
  'Psittacus timneh': 'Timneh African Grey',
  'Myiopsitta monachus': 'Quaker Parrot',
  'Psittacula krameri': 'Indian Ringneck',
  'Neopsephotus bourkii': "Bourke's Parakeet",
  'Bolborhynchus lineola': 'Lineolated Parakeet',
  'Aratinga jandaya': 'Jenday Conure',
  'Cacatua alba': 'Umbrella Cockatoo',
  'Cacatua moluccensis': 'Moluccan Cockatoo',
  'Cacatua goffiniana': "Goffin's Cockatoo",
  'Cacatua leadbeateri': "Major Mitchell's Cockatoo",
  'Cacatua ducorpsii': "Ducorps's Cockatoo",
  'Eolophus roseicapilla': 'Rose-breasted Cockatoo',
  'Ara ararauna': 'Blue-and-gold Macaw',
  'Ara chloropterus': 'Green-winged Macaw',
  'Ara ambiguus': "Buffon's Macaw",
  'Ara severus': 'Severe Macaw',
  'Diopsittaca nobilis': "Hahn's Macaw",
  'Primolius maracana': "Illiger's Macaw",
  'Agapornis roseicollis': 'Peach-faced Lovebird',
  'Agapornis personatus': 'Masked Lovebird',
  'Amazona oratrix': 'Double Yellow-headed Amazon',
  'Amazona aestiva': 'Blue-fronted Amazon',
  'Serinus canaria': 'Canary',
  'Struthio camelus': 'Ostrich',
};

// Genus-wide rules: aviculture routinely uses a different group word than the taxonomy does
// ("Nanday Parakeet" is a Nanday Conure to every US breeder). For a species in `genera` whose
// common name ends in `from`, add the same name ending in `to` as an alternate name; with
// display: true it also becomes the species' display name (unless DISPLAY says otherwise).
const CONURE_GENERA = ['Aratinga', 'Eupsittula', 'Psittacara', 'Pyrrhura', 'Thectocercus', 'Guaruba'];
const GENUS_RULES = [
  { genera: CONURE_GENERA, from: 'Parakeet', to: 'Conure', kind: 'trade', display: true },
  { genera: CONURE_GENERA, from: 'Parrot', to: 'Conure', kind: 'trade', display: true },
  { genera: ['Pionites'], from: 'Parrot', to: 'Caique', kind: 'trade', display: true },
  { genera: ['Pionus'], from: 'Parrot', to: 'Pionus', kind: 'trade', display: true },
];

// Species listed first rank highest in the typeahead (popularity = 100 - position). A starting
// guess by scientific name, meant to be replaced by real usage data once breeders are using it.
const POPULAR = [
  'Melopsittacus undulatus', 'Nymphicus hollandicus', 'Agapornis roseicollis', 'Psittacus erithacus',
  'Pyrrhura molinae', 'Aratinga solstitialis', 'Psittacula krameri', 'Myiopsitta monachus',
  'Cacatua alba', 'Ara ararauna', 'Taeniopygia guttata', 'Serinus canaria', 'Chloebia gouldiae',
  'Eclectus roratus', 'Poicephalus senegalus', 'Forpus coelestis', 'Columba livia', 'Gallus gallus',
  'Cacatua goffiniana', 'Ara macao', 'Anodorhynchus hyacinthinus', 'Cacatua galerita', 'Cacatua moluccensis',
  'Cacatua leadbeateri', 'Amazona auropalliata', 'Amazona oratrix', 'Amazona aestiva', 'Pionus menstruus',
  'Pionites melanocephalus', 'Aratinga jandaya', 'Aratinga nenday', 'Eupsittula canicularis',
  'Agapornis fischeri', 'Agapornis personatus', 'Psittacula eupatria', 'Platycercus eximius',
  'Cyanoramphus novaezelandiae', 'Bolborhynchus lineola', 'Ara chloropterus', 'Ara militaris',
  'Streptopelia roseogrisea', 'Struthio camelus', 'Anas platyrhynchos', 'Pavo cristatus',
];

module.exports = { ALIASES, DISPLAY, GENUS_RULES, POPULAR };

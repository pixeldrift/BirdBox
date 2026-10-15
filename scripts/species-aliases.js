// Hand-curated alternate names for species breeders know by another name, plus naming rules
// that apply to whole genera. Keyed by SCIENTIFIC name (not eBird code) on purpose: codes change
// when species split, scientific names are what the seed script resolves against the current
// taxonomy, and anything that no longer resolves is reported rather than silently dropped.
// kind: trade | regional | historical | common | other

const ALIASES = {
  'Aratinga solstitialis': [['Sun Conure', 'trade']],
  'Pyrrhura molinae': [['Green-cheeked Conure', 'trade'], ['Green-cheek Conure', 'trade'], ['Greencheek', 'trade']],
  'Myiopsitta monachus': [['Quaker Parrot', 'trade'], ['Quaker', 'trade'], ['Quaker Parakeet', 'trade']],
  'Psittacula krameri': [['Indian Ringneck', 'trade'], ['Ringneck', 'trade'], ['Indian Ring-necked Parakeet', 'trade'], ['Ring-necked Parakeet', 'common']],
  'Psittacus erithacus': [['African Grey', 'regional'], ['African Gray', 'trade'], ['Congo African Grey', 'trade'], ['Grey Parrot', 'regional']],
  'Psittacus timneh': [['Timneh African Grey', 'trade'], ['Timneh Grey', 'trade']],
  'Melopsittacus undulatus': [['Budgie', 'trade'], ['Parakeet', 'trade'], ['Shell Parakeet', 'trade']],
  'Agapornis roseicollis': [['Peach-faced Lovebird', 'trade'], ['Peachface', 'trade']],
  'Cacatua alba': [['Umbrella Cockatoo', 'trade']],
  'Cacatua moluccensis': [['Moluccan Cockatoo', 'trade']],
  'Cacatua goffiniana': [["Goffin's Cockatoo", 'trade'], ['Goffin Cockatoo', 'trade']],
  'Eolophus roseicapilla': [['Rose-breasted Cockatoo', 'common']],
  'Ara ararauna': [['Blue and Gold Macaw', 'trade'], ['Blue & Gold Macaw', 'trade']],
  'Ara chloropterus': [['Red and Green Macaw', 'trade']],
  'Diopsittaca nobilis': [["Hahn's Macaw", 'trade'], ['Red-shouldered Macaw', 'common']],
  'Cyanoramphus novaezelandiae': [['Kakariki', 'regional'], ['Red-crowned Kakariki', 'trade']],
  'Neopsephotus bourkii': [["Bourke's Parakeet", 'trade']],
  'Bolborhynchus lineola': [['Linnie', 'trade'], ['Lineolated Parakeet', 'common']],
  'Chloebia gouldiae': [['Lady Gouldian Finch', 'trade'], ['Gouldian', 'trade']],
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

// Genus-wide rules: aviculture routinely uses a different group word than the taxonomy does.
// { genera, from, to, kind } — for a species whose common name ends in `from`, add the same name
// ending in `to` (e.g. "Nanday Parakeet" -> "Nanday Conure").
const CONURE_GENERA = ['Aratinga', 'Eupsittula', 'Psittacara', 'Pyrrhura', 'Thectocercus', 'Guaruba'];
const GENUS_RULES = [
  { genera: CONURE_GENERA, from: 'Parakeet', to: 'Conure', kind: 'trade' },
  { genera: CONURE_GENERA, from: 'Parrot', to: 'Conure', kind: 'trade' },
  { genera: ['Amazona'], from: 'Parrot', to: 'Amazon', kind: 'trade' },
  { genera: ['Pionites'], from: 'Parrot', to: 'Caique', kind: 'trade' },
  { genera: ['Pionus'], from: 'Parrot', to: 'Pionus', kind: 'trade' },
];

// Species listed first rank highest in the typeahead (popularity = 100 - position). A starting
// guess by scientific name, meant to be replaced by real usage data once breeders are using it.
const POPULAR = [
  'Melopsittacus undulatus', 'Nymphicus hollandicus', 'Agapornis roseicollis', 'Psittacus erithacus',
  'Pyrrhura molinae', 'Aratinga solstitialis', 'Psittacula krameri', 'Myiopsitta monachus',
  'Cacatua alba', 'Ara ararauna', 'Taeniopygia guttata', 'Serinus canaria', 'Chloebia gouldiae',
  'Eclectus roratus', 'Poicephalus senegalus', 'Forpus coelestis', 'Columba livia', 'Gallus gallus',
  'Cacatua goffiniana', 'Ara macao', 'Anodorhynchus hyacinthinus', 'Cacatua galerita', 'Cacatua moluccensis',
  'Amazona auropalliata', 'Amazona oratrix', 'Pionus menstruus', 'Pionites melanocephalus',
  'Aratinga nenday', 'Eupsittula canicularis', 'Agapornis fischeri', 'Agapornis personatus',
  'Psittacula eupatria', 'Platycercus eximius', 'Cyanoramphus novaezelandiae', 'Bolborhynchus lineola',
  'Streptopelia roseogrisea', 'Struthio camelus', 'Anas platyrhynchos', 'Pavo cristatus',
];

module.exports = { ALIASES, GENUS_RULES, POPULAR };

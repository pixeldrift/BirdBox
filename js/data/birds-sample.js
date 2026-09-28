// Sample bird records, shaped after docs/data-model.md (itself derived from the real
// Airtable base). Mother/Father are self-referential links by id, same pattern as the
// source data, so the genealogy links below are real parent/child relationships you can
// tap through.
//
// registryPublic: opt-in flag (default false — privacy-first, matches the product doc's
// "breeders are notoriously suspicious of online recordkeeping") controlling whether this
// bird's basic info is searchable in Registry -> Search. There's no separate registry
// entity: the public record is generated live from this same object, so toggling it (from
// the bird's own detail page, or from Registry -> Register's manage list) is the whole
// story — "automatic" inclusion, per the user's ask. See docs/roadmap.md for the planned
// granular (field-level) privacy this will grow into.
const BIRDS_SAMPLE = [
  {
    id: 'AR10001CA', band: 'AR 10001 CA', name: 'Sunny', sex: 'Male',
    species: 'Conure', subspecies: 'Sun', mutation: null,
    hatchDate: '2019-05-01', status: 'Available', cage: 'F2-001',
    motherId: null, fatherId: null, pairedId: 'AR10002CA',
    cost: 300, price: 800, registryPublic: true,
    notes: 'Founding pair — proven breeder male.',
  },
  {
    id: 'AR10002CA', band: 'AR 10002 CA', name: 'Daisy', sex: 'Female',
    species: 'Conure', subspecies: 'Sun', mutation: null,
    hatchDate: '2019-06-15', status: 'Available', cage: 'F2-001',
    motherId: null, fatherId: null, pairedId: 'AR10001CA',
    cost: 300, price: 800, registryPublic: true,
    notes: 'Founding pair — proven breeder female.',
  },
  {
    id: 'AR11101CA', band: 'AR 11101 CA', name: null, sex: 'Male',
    species: 'Conure', subspecies: 'Sun', mutation: null,
    hatchDate: '2021-02-24', status: 'Sold', cage: null,
    motherId: 'AR10002CA', fatherId: 'AR10001CA',
    cost: 0, price: 600, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR11102CA', band: 'AR 11102 CA', name: null, sex: 'Female',
    species: 'Conure', subspecies: 'Sun', mutation: null,
    hatchDate: '2021-02-24', status: 'Available', cage: 'F2-002',
    motherId: 'AR10002CA', fatherId: 'AR10001CA',
    cost: 0, price: 600, registryPublic: true,
    notes: '',
  },
  {
    id: 'AR11103CA', band: 'AR 11103 CA', name: null, sex: 'Male',
    species: 'Conure', subspecies: 'Sun', mutation: 'Red Factor',
    hatchDate: '2022-04-05', status: 'Reserved', cage: 'F2-003',
    motherId: 'AR10002CA', fatherId: 'AR10001CA',
    cost: 0, price: 1500, registryPublic: false,
    notes: 'Reserved for Brock Stone.',
  },
  {
    id: 'AR11104CA', band: 'AR 11104 CA', name: null, sex: 'Unsexed',
    species: 'Conure', subspecies: 'Sun', mutation: null,
    hatchDate: '2022-04-05', status: 'Deceased', cage: null,
    motherId: 'AR10002CA', fatherId: 'AR10001CA',
    cost: 0, price: null, registryPublic: false,
    notes: 'Passed shortly after fledging.',
  },
  {
    id: 'AR12001CA', band: 'AR 12001 CA', name: 'Kiwi', sex: 'Male',
    species: 'Conure', subspecies: 'Green-Cheeked', mutation: 'Mooncheek',
    hatchDate: '2020-03-11', status: 'Available', cage: 'F1-012',
    motherId: null, fatherId: null, pairedId: 'AR12002CA',
    cost: 250, price: 600, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR12002CA', band: 'AR 12002 CA', name: null, sex: 'Female',
    species: 'Conure', subspecies: 'Green-Cheeked', mutation: 'Pineapple',
    hatchDate: '2020-04-02', status: 'Reserved', cage: 'F1-012',
    motherId: null, fatherId: null, pairedId: 'AR12001CA',
    cost: 225, price: 600, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR12101CA', band: 'AR 12101 CA', name: null, sex: 'Female',
    species: 'Conure', subspecies: 'Green-Cheeked', mutation: 'Mooncheek, Pineapple',
    hatchDate: '2023-01-20', status: 'Available', cage: 'F1-013',
    motherId: 'AR12002CA', fatherId: 'AR12001CA',
    cost: 0, price: 900, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR13001CA', band: 'AR 13001 CA', name: null, sex: 'Male',
    species: 'Parakeet', subspecies: 'Indian Ring-Necked', mutation: 'Blue',
    hatchDate: '2021-07-19', status: 'Available', cage: 'FLN',
    motherId: null, fatherId: null,
    cost: 150, price: 400, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR13002CA', band: 'AR 13002 CA', name: null, sex: 'Female',
    species: 'Parakeet', subspecies: 'Indian Ring-Necked', mutation: 'Albino',
    hatchDate: '2021-08-02', status: 'Sold', cage: null,
    motherId: null, fatherId: null,
    cost: 150, price: 450, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR14001CA', band: 'AR 14001 CA', name: 'Coco', sex: 'Female',
    species: 'Cockatoo', subspecies: 'Umbrella', mutation: null,
    hatchDate: '2018-02-14', status: 'Available', cage: 'F5-001',
    motherId: null, fatherId: null,
    cost: 1800, price: 2500, registryPublic: true,
    notes: 'Hand-tame, does well with visitors.',
  },
  {
    id: 'AR14002CA', band: 'AR 14002 CA', name: 'Rio', sex: 'Male',
    species: 'Macaw', subspecies: 'Blue and Gold', mutation: null,
    hatchDate: '2017-11-30', status: 'Reserved', cage: 'F6-002',
    motherId: null, fatherId: null,
    cost: 2200, price: 3200, registryPublic: false,
    notes: 'Reserved — deposit received.',
  },
  {
    id: 'AR15001CA', band: 'AR 15001 CA', name: null, sex: 'Unsexed',
    species: 'Amazon', subspecies: 'Yellow-Naped', mutation: null,
    hatchDate: '2015-01-01', status: 'Deceased', cage: null,
    motherId: null, fatherId: null,
    cost: 900, price: null, registryPublic: false,
    notes: '',
  },
  {
    id: 'AR15002CA', band: 'AR 15002 CA', name: 'Einstein', sex: 'Male',
    species: 'African Grey', subspecies: 'Congo', mutation: null,
    hatchDate: '2016-09-09', status: 'Available', cage: 'F3-002',
    motherId: null, fatherId: null,
    cost: 1200, price: 2000, registryPublic: true,
    notes: 'Excellent talker.',
  },
];

const BIRDS_BY_ID = {};
BIRDS_SAMPLE.forEach(function (b) { BIRDS_BY_ID[b.id] = b; });

function getBird(id) {
  return BIRDS_BY_ID[id] || null;
}

function birdChildren(id) {
  return BIRDS_SAMPLE.filter(function (b) { return b.motherId === id || b.fatherId === id; });
}

const SEX_LETTER = { Male: 'M', Female: 'F', Unsexed: 'U' };

function birdIdentifier(bird) {
  var sexPart = SEX_LETTER[bird.sex] || '?';
  var namePart = bird.name ? '"' + bird.name + '" ' : '';
  var mutationPart = bird.mutation ? bird.mutation + ' ' : '';
  return bird.band + ' - (' + sexPart + ') ' + namePart + mutationPart + bird.subspecies + ' ' + bird.species;
}

// Shorter label for chips/rows elsewhere (no band #, no sex letter).
function birdShortLabel(bird) {
  return (bird.name ? '"' + bird.name + '" ' : '') + bird.subspecies + ' ' + bird.species;
}

// Sample contacts, shaped after the Contacts table in docs/data-model.md.
// birdsOwned / birdsPurchasing reference ids from js/data/birds-sample.js.
const CONTACTS_SAMPLE = [
  {
    id: 'c-001', name: 'Steve Duncan', company: 'Avian Resources', type: 'Breeder',
    city: 'Fallbrook', state: 'CA', email: 'steve@avianresources.com', phone: '',
    birdsOwned: [], birdsPurchasing: [],
    notes: 'Primary source breeder — most baby birds are acquired from here.',
  },
  {
    id: 'c-002', name: 'Charles Hutchinson', company: '', type: 'Pet Owner',
    city: 'Reno', state: 'NV', email: 'mrclh2jr@yahoo.com', phone: '(775) 433-5460',
    birdsOwned: ['AR11101CA'], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-003', name: 'Karina Gutierrez', company: '', type: 'Pet Owner',
    city: '', state: '', email: '', phone: '',
    birdsOwned: ['AR13002CA'], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-004', name: 'Brock Stone', company: '', type: 'Pet Owner',
    city: 'Glen Burnie', state: 'MD', email: '', phone: '(831) 236-5680',
    birdsOwned: [], birdsPurchasing: ['AR11103CA'],
    notes: '',
  },
  {
    id: 'c-005', name: 'Michelle Hua', company: '', type: 'Pet Owner',
    city: '', state: '', email: '', phone: '',
    birdsOwned: [], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-006', name: 'Heather Escobar', company: '', type: 'Pet Owner',
    city: '', state: '', email: '', phone: '',
    birdsOwned: [], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-007', name: 'A&E Cage Company', company: 'A&E Cage Company', type: 'Vendor',
    city: 'Burlington', state: 'NJ', email: 'info@aecageco.com', phone: '(800) 631-7387',
    birdsOwned: [], birdsPurchasing: [],
    notes: 'Cages and supplies.',
  },
  {
    id: 'c-008', name: 'Avian Biotech International', company: 'Avian Biotech International', type: 'Vendor',
    city: 'Tallahassee', state: 'FL', email: '', phone: '(850) 386-1145',
    birdsOwned: [], birdsPurchasing: [],
    notes: 'DNA sexing and testing.',
  },
  {
    id: 'c-009', name: 'West Branch Aviary', company: 'West Branch Aviary', type: 'Breeder',
    city: '', state: '', email: '', phone: '',
    birdsOwned: [], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-010', name: 'Nelson Ricardo', company: '', type: 'Pet Owner',
    city: '', state: '', email: '', phone: '',
    birdsOwned: [], birdsPurchasing: ['AR12002CA'],
    notes: '',
  },
  {
    id: 'c-011', name: 'Bird Fever', company: 'Bird Fever', type: 'Store',
    city: 'Indianapolis', state: 'IN', email: '', phone: '(317) 845-7823',
    birdsOwned: [], birdsPurchasing: [],
    notes: '',
  },
  {
    id: 'c-012', name: 'Denise Albert', company: '', type: 'Pet Owner',
    city: '', state: '', email: '', phone: '',
    birdsOwned: [], birdsPurchasing: [],
    notes: '',
  },
];

const CONTACTS_BY_ID = {};
CONTACTS_SAMPLE.forEach(function (c) { CONTACTS_BY_ID[c.id] = c; });

function getContact(id) {
  return CONTACTS_BY_ID[id] || null;
}

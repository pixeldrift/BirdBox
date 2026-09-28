// Sample shipping records (waybills), matching the Waybills table in docs/data-model.md
// plus a Cost field, which the source Airtable base didn't track but the user wants here.
const WAYBILLS_SAMPLE = [
  {
    id: 'wb-001', waybillNumber: '006-79736145', direction: 'Outgoing',
    date: '2021-09-10', clientId: 'c-011', birdIds: ['AR13001CA'],
    departingAirport: 'LAX', arrivingAirport: 'IND', cost: 95,
    notes: '',
  },
  {
    id: 'wb-002', waybillNumber: '006-80115781', direction: 'Outgoing',
    date: '2021-09-06', clientId: 'c-003', birdIds: ['AR13002CA'],
    departingAirport: 'LAX', arrivingAirport: 'DEN', cost: 110,
    notes: '',
  },
  {
    id: 'wb-003', waybillNumber: '006-71439336', direction: 'Outgoing',
    date: '2021-08-22', clientId: 'c-002', birdIds: ['AR11101CA'],
    departingAirport: 'LAX', arrivingAirport: 'RNO', cost: 90,
    notes: '',
  },
  {
    id: 'wb-004', waybillNumber: '006-72287025', direction: 'Incoming',
    date: '2016-10-05', clientId: 'c-001', birdIds: ['AR15002CA'],
    departingAirport: 'SAN', arrivingAirport: 'LAX', cost: 120,
    notes: 'Received from source breeder.',
  },
  {
    id: 'wb-005', waybillNumber: '', direction: 'Outgoing',
    date: '2022-05-05', clientId: null, birdIds: ['AR14002CA'],
    departingAirport: 'LAX', arrivingAirport: 'ORD', cost: 175,
    notes: 'Awaiting buyer confirmation before booking the flight.',
  },
  {
    id: 'wb-006', waybillNumber: '', direction: 'Outgoing',
    date: '2022-05-20', clientId: 'c-004', birdIds: ['AR11103CA'],
    departingAirport: 'LAX', arrivingAirport: 'BWI', cost: 130,
    notes: 'Scheduled once final balance is paid.',
  },
];

function waybillClient(wb) {
  return wb.clientId ? getContact(wb.clientId) : null;
}

function waybillBirds(wb) {
  return wb.birdIds.map(getBird).filter(Boolean);
}

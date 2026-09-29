// Sample health records: DNA certificates, immunizations, surgical sexing reports,
// vet visits, etc. Not in docs/data-model.md yet (the source Airtable base only had a
// free-text Medical Notes field + Med Attachments) — this is a proper first-class record
// type instead, one row per document/visit, linked to a bird.
//
// Records added through the app during this session (via HealthScreen's Add Record form)
// get pushed into this same array so they show up immediately, but attachments use
// URL.createObjectURL() on the picked file, which only lives for this browser session —
// there's no backend yet to actually persist uploads. See docs/roadmap.md.
const RECORD_TYPES = ['DNA Certificate', 'Immunization', 'Surgical Sexing', 'Vet Visit', 'Other'];

const HEALTH_RECORDS_SAMPLE = [
  {
    id: 'hr-001', birdId: 'AR15002CA', type: 'DNA Certificate',
    date: '2016-10-02', provider: 'Avian Biotech International',
    notes: 'DNA sexing confirmed male. Certificate on file.',
    attachments: [],
  },
  {
    id: 'hr-002', birdId: 'AR15002CA', type: 'Vet Visit',
    date: '2023-06-14', provider: 'Fallbrook Avian & Exotic',
    notes: 'Annual wellness exam. Weight 412g, body condition good.',
    attachments: [],
  },
  {
    id: 'hr-003', birdId: 'AR10001CA', type: 'Surgical Sexing',
    date: '2019-08-20', provider: 'Dr. Reyes, Avian Surgical Associates',
    notes: 'Laparoscopic sexing performed prior to DNA sexing becoming standard.',
    attachments: [],
  },
  {
    id: 'hr-004', birdId: 'AR10001CA', type: 'Immunization',
    date: '2020-01-15', provider: 'Fallbrook Avian & Exotic',
    notes: 'Polyoma vaccine, first dose.',
    attachments: [],
  },
  {
    id: 'hr-005', birdId: 'AR10002CA', type: 'Immunization',
    date: '2020-01-15', provider: 'Fallbrook Avian & Exotic',
    notes: 'Polyoma vaccine, first dose.',
    attachments: [],
  },
  {
    id: 'hr-006', birdId: 'AR14001CA', type: 'Vet Visit',
    date: '2024-02-03', provider: 'Dr. Amara Singh, DVM',
    notes: 'Beak trim, nails trimmed. No concerns.',
    attachments: [],
  },
  {
    id: 'hr-007', birdId: 'AR11103CA', type: 'DNA Certificate',
    date: '2022-05-01', provider: 'Avian Biotech International',
    notes: 'Certificate ABI 322119 — confirmed male.',
    attachments: [],
  },
  {
    id: 'hr-008', birdId: 'AR14002CA', type: 'Other',
    date: '2021-12-10', provider: '',
    notes: '30-day quarantine completed after arrival, no signs of illness.',
    attachments: [],
  },
];

function healthRecordsForBird(birdId) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.birdId === birdId; });
}

function getHealthRecord(id) {
  return HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.id === id; })[0] || null;
}

var _healthRecordSeq = HEALTH_RECORDS_SAMPLE.length;
function nextHealthRecordId() {
  _healthRecordSeq += 1;
  return 'hr-' + String(_healthRecordSeq).padStart(3, '0');
}

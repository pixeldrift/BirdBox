// The record types served by api/records: one table each, one list of fields each. The same
// field lists drive validation here and the edit forms in the app (js/data/record-schemas.js).
// To add a field: add a line here and in js/data/record-schemas.js, and a column in the database.
//
// field: { col (db column), type, required, max, options, ref, readOnly, defaultValue }
//   type: text | number | date | enum | textarray
//   ref:  'contact' | 'bird'  — the value is the id of another record
//   readOnly: sent to the app but never accepted from it (managed elsewhere)

const SCHEMAS = {
  contacts: {
    table: 'contacts', pk: 'id', idPrefix: 'c-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      company: { col: 'company', type: 'text', max: 120 },
      type: { col: 'type', type: 'enum', required: true, options: ['Breeder', 'Pet Owner', 'Vendor', 'Store'] },
      city: { col: 'city', type: 'text', max: 80 },
      state: { col: 'state', type: 'text', max: 40 },
      email: { col: 'email', type: 'text', max: 160 },
      phone: { col: 'phone', type: 'text', max: 40 },
      notes: { col: 'notes', type: 'text', max: 4000 },
      // Who owns which birds is changed through the ownership prompts, not by editing a contact.
      birdsOwned: { col: 'birds_owned', type: 'textarray', readOnly: true },
      birdsPurchasing: { col: 'birds_purchasing', type: 'textarray', readOnly: true },
    },
  },
  transactions: {
    table: 'transactions', pk: 'id', idPrefix: 'tx-', order: 'date desc',
    fields: {
      item: { col: 'item', type: 'text', required: true, max: 200 },
      amount: { col: 'amount', type: 'number', required: true },
      date: { col: 'date', type: 'date', required: true },
      category: { col: 'category', type: 'enum', required: true, options: ['Sale', 'Purchase', 'Expense', 'Deposit'] },
      funding: { col: 'funding', type: 'text', max: 80 },
      clientId: { col: 'client_id', type: 'text', ref: 'contact' },
      birdId: { col: 'bird_id', type: 'text', ref: 'bird' },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  health: {
    table: 'health_records', pk: 'id', idPrefix: 'hr-', order: 'date desc',
    fields: {
      birdId: { col: 'bird_id', type: 'text', required: true, ref: 'bird' },
      type: { col: 'type', type: 'enum', required: true, options: ['DNA Certificate', 'Immunization', 'Surgical Sexing', 'Vet Visit', 'Other'] },
      date: { col: 'date', type: 'date', required: true },
      provider: { col: 'provider', type: 'text', max: 160 },
      notes: { col: 'notes', type: 'text', max: 4000 },
    },
  },
  locations: {
    table: 'locations', pk: 'id', idPrefix: 'loc-', order: 'name',
    fields: {
      name: { col: 'name', type: 'text', required: true, max: 120 },
      description: { col: 'description', type: 'text', max: 400 },
    },
  },
  buildings: {
    table: 'buildings', pk: 'code', idPrefix: '', order: 'code',
    fields: {
      nickname: { col: 'nickname', type: 'text', required: true, max: 80 },
      description: { col: 'description', type: 'text', max: 400 },
      locationId: { col: 'location_id', type: 'text', ref: 'location' },
    },
  },
  cages: {
    table: 'cages', pk: 'code', idPrefix: '', order: 'code',
    fields: {
      buildingCode: { col: 'building_code', type: 'text', ref: 'building' },
      description: { col: 'description', type: 'text', max: 400 },
    },
  },
};

module.exports = { SCHEMAS };

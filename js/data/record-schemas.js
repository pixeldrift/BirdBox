// What each editable record looks like, for the generic edit/add form (js/screens/record-form.js).
// Mirrors api/_lib/schemas.js (which does the real validation on the server).
//
// Per type: how to find the local list, how to name a record, where its screen lives, and the
// fields in the order they appear. field: { key, label, type, required, options, ref, hint }
//   type: text | textarea | number | date | enum
//   ref:  'contact' | 'bird' — chosen with a search picker

var RECORD_TYPES_UI = {
  contacts: {
    singular: 'contact', pk: 'id', hash: '#/business/contacts/',
    list: function () { return CONTACTS_SAMPLE; },
    reindex: function () { reindexContacts(); },
    nameOf: function (r) { return r.name; },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'type', label: 'Type', type: 'enum', required: true, options: ['Breeder', 'Pet Owner', 'Vendor', 'Store'] },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: { type: 'Breeder' },
  },
  transactions: {
    singular: 'entry', pk: 'id', hash: '#/business/accounting/',
    list: function () { return TRANSACTIONS_SAMPLE; },
    nameOf: function (r) { return r.item; },
    fields: [
      { key: 'item', label: 'Item', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true, hint: 'Negative for money out (purchases, expenses); positive for money in.' },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'category', label: 'Category', type: 'enum', required: true, options: ['Sale', 'Purchase', 'Expense', 'Deposit'] },
      { key: 'funding', label: 'Paid with', type: 'text', hint: 'e.g. Cash, PayPal, Zelle, Check' },
      { key: 'clientId', label: 'Client', type: 'text', ref: 'contact' },
      { key: 'birdId', label: 'Bird', type: 'text', ref: 'bird' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: { category: 'Sale' },
  },
  health: {
    singular: 'health record', pk: 'id', hash: '#/mybirds/health/',
    list: function () { return HEALTH_RECORDS_SAMPLE; },
    nameOf: function (r) { return r.type; },
    fields: [
      { key: 'birdId', label: 'Bird', type: 'text', required: true, ref: 'bird' },
      { key: 'type', label: 'Type', type: 'enum', required: true, options: RECORD_TYPES },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'provider', label: 'Provider', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: { type: 'DNA Certificate' },
  },
  navigation: {
    singular: 'menu item', pk: 'id', hash: '#/account/customize',
    list: function () { return NAV_ROWS; },
    nameOf: function (r) { return r.label; },
    fields: [],
    defaults: {},
  },
  locations: {
    singular: 'location', pk: 'id', hash: '#/aviary/caging/',
    list: function () { return LOCATIONS_SAMPLE; },
    nameOf: function (r) { return r.name; },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, hint: 'A site — e.g. Home farm, Fallbrook, Rental barn.' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    defaults: {},
  },
  buildings: {
    singular: 'building', pk: 'code', hash: '#/aviary/caging/',
    list: function () { return BUILDINGS_SAMPLE; },
    nameOf: function (r) { return r.nickname; },
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, createOnly: true, hint: 'The letters at the start of its cage numbers — F2 for cages like F2-001. Can’t be changed later.' },
      { key: 'nickname', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'locationId', label: 'Location', type: 'text', ref: 'location', hint: 'Optional — which site it’s on.' },
    ],
    defaults: {},
  },
  rooms: {
    singular: 'room', pk: 'id', hash: '#/aviary/caging/',
    list: function () { return ROOMS_SAMPLE; },
    nameOf: function (r) { return r.name; },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, hint: 'e.g. Flight room, Nursery, Quarantine.' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'buildingCode', label: 'Building', type: 'text', ref: 'building', hint: 'Optional — which building it’s in.' },
      { key: 'locationId', label: 'Location', type: 'text', ref: 'location', hint: 'Optional — only needed if it isn’t in a building.' },
    ],
    defaults: {},
  },
  aviary: {
    singular: 'aviary', pk: 'id', hash: '#/account/settings',
    list: function () { return AVIARY_ROWS; },
    nameOf: function (r) { return r.name; },
    noDelete: true,
    fields: [
      { key: 'name', label: 'Aviary name', type: 'text', required: true, hint: 'Shown at the top of your locations. Rename it any time.' },
      { key: 'description', label: 'About', type: 'textarea' },
      { key: 'address', label: 'Address', type: 'textarea', hint: 'Optional.' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'socials', label: 'Social links', type: 'text', hint: 'Optional — e.g. Instagram, Facebook.' },
    ],
    defaults: {},
  },
  cages: {
    singular: 'cage', pk: 'code', hash: '#/aviary/caging/',
    list: function () { return CAGES_SAMPLE; },
    nameOf: function (r) { return r.code; },
    fields: [
      { key: 'code', label: 'Cage number', type: 'text', required: true, createOnly: true, hint: 'e.g. F2-010. Can’t be changed later.' },
      { key: 'buildingCode', label: 'Building', type: 'text', ref: 'building', hint: 'Optional — which building it’s in.' },
      { key: 'roomId', label: 'Room', type: 'text', ref: 'room', hint: 'Optional — which room it’s in.' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    defaults: {},
  },
};

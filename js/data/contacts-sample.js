// Contacts, loaded from Postgres (via /api/contacts) instead of hardcoded here —
// see sql/002_contacts.sql for the schema and the seed data this replaced.
// birdsOwned / birdsPurchasing reference ids from js/data/birds-sample.js.
var CONTACTS_SAMPLE = [];
var CONTACTS_BY_ID = {};

function reindexContacts() {
  CONTACTS_BY_ID = {};
  CONTACTS_SAMPLE.forEach(function (c) { CONTACTS_BY_ID[c.id] = c; });
}

var contactsLoaded = fetch('/api/contacts')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load contacts');
    return res.json();
  })
  .then(function (contacts) {
    CONTACTS_SAMPLE.length = 0;
    Array.prototype.push.apply(CONTACTS_SAMPLE, contacts);
    reindexContacts();
  })
  .catch(function (err) {
    console.error('Could not load contacts from the server:', err);
  });

function getContact(id) {
  return CONTACTS_BY_ID[id] || null;
}

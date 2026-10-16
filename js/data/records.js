// Create / change / delete for contacts, transactions, health records and buildings, all through
// the one /api/records endpoint. Keeps the local lists (CONTACTS_SAMPLE etc.) in step.

function recordsRequest(method, type, id, body) {
  var qs = '?type=' + encodeURIComponent(type) + (id ? '&id=' + encodeURIComponent(id) : '');
  return fetch('/api/records' + qs, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.error || 'That didn’t work');
      return data;
    });
  });
}

function recordKey(type, rec) {
  return rec[RECORD_TYPES_UI[type].pk];
}

function findRecord(type, id) {
  var def = RECORD_TYPES_UI[type];
  return def.list().filter(function (r) { return r[def.pk] === id; })[0] || null;
}

function afterRecordsChange(type) {
  if (type === 'contacts') reindexContacts();
  if (typeof reindexMedia === 'function') reindexMedia();
}

function createRecord(type, data) {
  return recordsRequest('POST', type, null, data).then(function (rec) {
    var list = RECORD_TYPES_UI[type].list();
    if (type === 'health') rec.attachments = [];
    list.push(rec);
    afterRecordsChange(type);
    return rec;
  });
}

function updateRecord(type, id, changes) {
  return recordsRequest('PATCH', type, id, changes).then(function (rec) {
    var current = findRecord(type, id);
    if (current) Object.keys(rec).forEach(function (k) {
      if (k === 'attachments') return; // files are linked media, kept locally
      current[k] = rec[k];
    });
    afterRecordsChange(type);
    return current || rec;
  });
}

function deleteRecord(type, id) {
  return recordsRequest('DELETE', type, id).then(function () {
    var def = RECORD_TYPES_UI[type];
    var list = def.list();
    for (var i = list.length - 1; i >= 0; i--) if (list[i][def.pk] === id) list.splice(i, 1);
    // Clear the links that pointed at it, locally.
    if (type === 'contacts') {
      TRANSACTIONS_SAMPLE.forEach(function (t) { if (t.clientId === id) t.clientId = null; });
      WAYBILLS_SAMPLE.forEach(function (w) { if (w.clientId === id) w.clientId = null; });
      TRANSFERS_SAMPLE.forEach(function (t) { if (t.contactId === id) t.contactId = null; });
    }
    if (type === 'cages') BIRDS_SAMPLE.forEach(function (b) { if (b.cage === id) b.cage = null; });
    if (type === 'buildings') CAGES_SAMPLE.forEach(function (c) { if (c.buildingCode === id) c.buildingCode = null; });
    if (type === 'locations') BUILDINGS_SAMPLE.forEach(function (b) { if (b.locationId === id) b.locationId = null; });
    MEDIA.forEach(function (m) {
      var target = { contacts: 'contact', transactions: 'transaction', health: 'health' }[type];
      if (target) m.links = m.links.filter(function (l) { return !(l.targetType === target && l.targetId === id); });
    });
    afterRecordsChange(type);
  });
}

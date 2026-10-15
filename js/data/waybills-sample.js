// Shipping records (waybills), loaded from Postgres (via /api/waybills)
// instead of hardcoded here — see sql/006_waybills.sql for the schema and
// the seed data this replaced.
var WAYBILLS_SAMPLE = [];

var waybillsLoaded = fetch('/api/waybills')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load waybills');
    return res.json();
  })
  .then(function (waybills) {
    WAYBILLS_SAMPLE.length = 0;
    Array.prototype.push.apply(WAYBILLS_SAMPLE, waybills);
    WAYBILLS_SAMPLE.forEach(function (w) { w.files = []; });
  })
  .catch(function (err) {
    console.error('Could not load waybills from the server:', err);
  });

function waybillClient(wb) {
  return wb.clientId ? getContact(wb.clientId) : null;
}

function waybillBirds(wb) {
  return wb.birdIds.map(getBird).filter(Boolean);
}

// Sends a new shipment to the server and adds it to the local list.
function addWaybill(data) {
  return fetch('/api/waybills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Save failed');
      body.files = body.files || [];
      WAYBILLS_SAMPLE.push(body);
      return body;
    });
  });
}

// What to call a shipment in the app: Pending, Shipped (we sent it) or Received (we got it).
function waybillStateLabel(wb) {
  if (wb.status === 'Pending') return 'Pending';
  return wb.direction === 'Incoming' ? 'Received' : 'Shipped';
}

// Every bird that could belong in a shipment with this client: birds they own or are buying
// (from their contact record) plus birds in their transactions. Duplicates removed.
function birdsLinkedToClient(client) {
  if (!client) return [];
  var ids = [];
  function add(id) { if (id && ids.indexOf(id) === -1) ids.push(id); }
  (client.birdsOwned || []).forEach(add);
  (client.birdsPurchasing || []).forEach(add);
  TRANSACTIONS_SAMPLE.forEach(function (tx) { if (tx.clientId === client.id) add(tx.birdId); });
  return ids.map(getBird).filter(Boolean);
}

// How a shipment travelled. Empty = not recorded. Nothing here assumes a flight. Handing a bird
// over in person isn't a shipment — that's a transfer recorded on the bird (js/data/transfers-sample.js).
var SHIP_METHODS = ['Air cargo', 'Courier', 'Ground delivery', 'Other'];

// Kinds of attachment on a shipment (stored by js/data/files.js).
var SHIP_FILE_KINDS = {
  photo: 'Photos',
  receipt: 'Receipt',
  waybill: 'Waybill',
};

function addWaybillFile(wb, kind, file) {
  return uploadFile('waybill', wb.id, kind, file);
}

function removeWaybillFile(wb, fileId) {
  return removeFile(fileId);
}

// Marks a pending shipment as having happened.
function completeWaybill(wb, date) {
  return fetch('/api/waybills?id=' + encodeURIComponent(wb.id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Complete', date: date || null }),
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Could not update the shipment');
      wb.status = body.status;
      wb.date = body.date;
      return wb;
    });
  });
}

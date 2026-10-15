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

// Kinds of attachment on a shipment.
var SHIP_FILE_KINDS = {
  photo: 'Photos',
  receipt: 'Receipt',
  waybill: 'Waybill',
};

var SHIP_FILE_MAX_BYTES = 3 * 1024 * 1024;

function readAsDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = function () { reject(new Error('Could not read that file')); };
    r.readAsDataURL(blob);
  });
}

// Photos are shrunk to a sensible size before upload (phone photos are huge); PDFs go as they are.
function prepareShipFile(file) {
  var isImage = /^image\//.test(file.type);
  if (!isImage) {
    if (file.type !== 'application/pdf') return Promise.reject(new Error('Use a photo or a PDF'));
    if (file.size > SHIP_FILE_MAX_BYTES) return Promise.reject(new Error(file.name + ' is over 3 MB — try a smaller PDF or a photo of it'));
    return readAsDataUrl(file).then(function (url) { return { contentType: file.type, filename: file.name, data: url.split(',')[1] }; });
  }
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var src = URL.createObjectURL(file);
    img.onload = function () {
      var scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(src);
      var url = canvas.toDataURL('image/jpeg', 0.82);
      var name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
      if (url.length * 0.75 > SHIP_FILE_MAX_BYTES) return reject(new Error(file.name + ' is too large'));
      resolve({ contentType: 'image/jpeg', filename: name, data: url.split(',')[1] });
    };
    img.onerror = function () {
      URL.revokeObjectURL(src);
      reject(new Error('Couldn’t open ' + (file.name || 'that image') + ' — try a JPG or PNG'));
    };
    img.src = src;
  });
}

// Uploads one file to a saved shipment and adds it to the local record.
function addWaybillFile(wb, kind, file) {
  return prepareShipFile(file).then(function (prepared) {
    return fetch('/api/waybills/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waybillId: wb.id, kind: kind, filename: prepared.filename, contentType: prepared.contentType, data: prepared.data }),
    });
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      wb.files = wb.files || [];
      wb.files.push(body);
      return body;
    });
  });
}

function removeWaybillFile(wb, fileId) {
  return fetch('/api/waybills/files?id=' + encodeURIComponent(fileId), { method: 'DELETE' }).then(function (res) {
    if (!res.ok) throw new Error('Could not remove that file');
    wb.files = (wb.files || []).filter(function (f) { return f.id !== fileId; });
  });
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

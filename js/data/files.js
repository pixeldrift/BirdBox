// Every uploaded file — bird photos, health-record documents, shipment photos / receipts /
// waybills, invoices and receipts on accounting entries — is stored the same way: in the
// database, via /api/files (see sql/012_attachments.sql). This file loads the list once at
// startup and hangs each file on the record it belongs to:
//   bird.photos        [{ id, url, isPrimary, filename }]
//   health record      attachments [{ id, name, kind: 'image' | 'pdf', url, size }]
//   shipment           files [{ id, kind, filename, contentType, size, url }]
//   transaction        files [same]
// Depends on the other data scripts (birds, health, waybills, transactions) loaded before it.

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
function prepareUpload(file, imagesOnly) {
  var isImage = /^image\//.test(file.type);
  if (!isImage) {
    if (imagesOnly || file.type !== 'application/pdf') return Promise.reject(new Error(imagesOnly ? 'Use a photo' : 'Use a photo or a PDF'));
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

// Finds the record a stored file belongs to and adds it to that record's list.
function attachToOwner(meta) {
  if (meta.ownerType === 'bird') {
    var bird = getBird(meta.ownerId);
    if (bird) bird.photos.push({ id: meta.id, url: meta.url, isPrimary: !!meta.isPrimary, filename: meta.filename });
  } else if (meta.ownerType === 'health') {
    var rec = getHealthRecord(meta.ownerId);
    if (rec) rec.attachments.push({ id: meta.id, name: meta.filename, kind: /^image\//.test(meta.contentType) ? 'image' : 'pdf', url: meta.url, size: meta.size });
  } else if (meta.ownerType === 'waybill') {
    var wb = WAYBILLS_SAMPLE.filter(function (w) { return w.id === meta.ownerId; })[0];
    if (wb) { wb.files = wb.files || []; wb.files.push(meta); }
  } else if (meta.ownerType === 'transaction') {
    var tx = TRANSACTIONS_SAMPLE.filter(function (t) { return t.id === meta.ownerId; })[0];
    if (tx) { tx.files = tx.files || []; tx.files.push(meta); }
  }
}

function detachFromOwner(id) {
  BIRDS_SAMPLE.forEach(function (b) { b.photos = b.photos.filter(function (p) { return p.id !== id; }); });
  HEALTH_RECORDS_SAMPLE.forEach(function (r) { r.attachments = r.attachments.filter(function (a) { return a.id !== id; }); });
  WAYBILLS_SAMPLE.forEach(function (w) { w.files = (w.files || []).filter(function (f) { return f.id !== id; }); });
  TRANSACTIONS_SAMPLE.forEach(function (t) { t.files = (t.files || []).filter(function (f) { return f.id !== id; }); });
}

var filesLoaded = Promise.all([birdsLoaded, healthLoaded, waybillsLoaded, transactionsLoaded])
  .then(function () { return fetch('/api/files'); })
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load files');
    return res.json();
  })
  .then(function (list) {
    HEALTH_RECORDS_SAMPLE.forEach(function (r) { r.attachments = []; }); // older in-browser-only entries are gone
    TRANSACTIONS_SAMPLE.forEach(function (t) { t.files = []; });
    list.forEach(attachToOwner);
  })
  .catch(function (err) {
    console.error('Could not load files from the server:', err);
  });

// Saves one file to a record and adds it to the local copy. Resolves to the stored file's details.
function uploadFile(ownerType, ownerId, kind, file) {
  return prepareUpload(file, kind === 'photo').then(function (prepared) {
    return fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerType: ownerType, ownerId: ownerId, kind: kind, filename: prepared.filename, contentType: prepared.contentType, data: prepared.data }),
    });
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      attachToOwner(body);
      return body;
    });
  });
}

function removeFile(id) {
  return fetch('/api/files?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(function (res) {
    if (!res.ok) throw new Error('Could not remove that file');
    // If that was a bird's main photo the server promoted another one; mirror it.
    BIRDS_SAMPLE.forEach(function (b) {
      var hadPrimary = b.photos.some(function (p) { return p.id === id && p.isPrimary; });
      if (hadPrimary) {
        b.photos = b.photos.filter(function (p) { return p.id !== id; });
        if (b.photos.length) b.photos[0].isPrimary = true;
      }
    });
    detachFromOwner(id);
  });
}

function makePhotoPrimary(bird, photoId) {
  return fetch('/api/files?id=' + encodeURIComponent(photoId), { method: 'PATCH' }).then(function (res) {
    if (!res.ok) throw new Error('Could not change the main photo');
    bird.photos.forEach(function (p) { p.isPrimary = (p.id === photoId); });
  });
}

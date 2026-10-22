// The media library. Every uploaded file — bird photos, receipts, waybills, invoices, DNA
// certificates and other documents — is its own record in /api/media (sql/012_attachments.sql)
// and is LINKED to the records it belongs to (birds, health records, shipments, accounting
// entries, contacts) rather than owned by one. This file loads the library once and keeps a
// convenient copy on each linked record:
//   bird.photos        [{ id, url, isPrimary, filename }]
//   health record      attachments [{ id, name, kind: 'image' | 'pdf', url, size }]
//   shipment           files [{ id, kind, filename, contentType, size, url }]
//   transaction        files [same]
//   contact            photoUrl
// Depends on the other data scripts (birds, health, waybills, transactions, contacts) loaded first.

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


var MEDIA = [];

var MEDIA_TYPES = [
  { type: 'photo', label: 'Photos', one: 'Photo', accept: 'image/*' },
  { type: 'receipt', label: 'Receipts', one: 'Receipt', accept: 'image/*,application/pdf' },
  { type: 'waybill', label: 'Waybills', one: 'Waybill', accept: 'image/*,application/pdf' },
  { type: 'invoice', label: 'Invoices', one: 'Invoice', accept: 'image/*,application/pdf' },
  { type: 'document', label: 'Documents', one: 'Document', accept: 'image/*,application/pdf' },
];

function mediaTypeInfo(type) {
  return MEDIA_TYPES.filter(function (t) { return t.type === type; })[0] || MEDIA_TYPES[4];
}

function getMedia(id) {
  return MEDIA.filter(function (m) { return m.id === id; })[0] || null;
}

function mediaIsImage(m) {
  return /^image\//.test(m.contentType);
}

function mediaLinkedTo(m, targetType, targetId) {
  return m.links.some(function (l) { return l.targetType === targetType && l.targetId === targetId; });
}

// Rebuilds the per-record copies from the library (called after anything changes).
function reindexMedia() {
  BIRDS_SAMPLE.forEach(function (b) { b.photos = []; });
  HEALTH_RECORDS_SAMPLE.forEach(function (r) { r.attachments = []; });
  WAYBILLS_SAMPLE.forEach(function (w) { w.files = []; });
  TRANSACTIONS_SAMPLE.forEach(function (t) { t.files = []; });
  CONTACTS_SAMPLE.forEach(function (c) { c.photoUrl = ''; });
  // oldest first, so a record's list reads in the order things were added
  MEDIA.slice().sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); }).forEach(function (m) {
    m.links.forEach(function (l) {
      if (l.targetType === 'bird') {
        var bird = getBird(l.targetId);
        if (bird && m.type === 'photo') bird.photos.push({ id: m.id, url: m.url, isPrimary: !!l.isPrimary, filename: m.filename });
      } else if (l.targetType === 'health') {
        var rec = getHealthRecord(l.targetId);
        if (rec) rec.attachments.push({ id: m.id, name: m.title || m.filename, kind: mediaIsImage(m) ? 'image' : 'pdf', url: m.url, size: m.size });
      } else if (l.targetType === 'waybill') {
        var wb = WAYBILLS_SAMPLE.filter(function (w) { return w.id === l.targetId; })[0];
        if (wb) wb.files.push({ id: m.id, kind: m.type, filename: m.title || m.filename, contentType: m.contentType, size: m.size, url: m.url });
      } else if (l.targetType === 'transaction') {
        var tx = TRANSACTIONS_SAMPLE.filter(function (t) { return t.id === l.targetId; })[0];
        if (tx) tx.files.push({ id: m.id, kind: m.type, filename: m.title || m.filename, contentType: m.contentType, size: m.size, url: m.url });
      } else if (l.targetType === 'contact') {
        var c = getContact(l.targetId);
        if (c && m.type === 'photo' && (l.isPrimary || !c.photoUrl)) c.photoUrl = m.url;
      }
    });
  });
}

var filesLoaded = Promise.all([birdsLoaded, healthLoaded, waybillsLoaded, transactionsLoaded, contactsLoaded])
  .then(function () { return fetch('/api/media'); })
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load media');
    return res.json();
  })
  .then(function (list) {
    MEDIA.length = 0;
    Array.prototype.push.apply(MEDIA, list);
    reindexMedia();
  })
  .catch(function (err) {
    console.error('Could not load media from the server:', err);
  });

function mediaRequest(method, qs, body) {
  return fetch('/api/media' + (qs || ''), {
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

// Uploads a new file to the library, optionally linking it to records right away.
//   links: [{ targetType, targetId }]
function uploadMedia(file, type, links, title) {
  return prepareUpload(file, type === 'photo').then(function (prepared) {
    return mediaRequest('POST', '', {
      type: type, filename: prepared.filename, contentType: prepared.contentType, data: prepared.data,
      title: title || '', links: links || [],
    });
  }).then(function (m) {
    MEDIA.unshift(m);
    reindexMedia();
    return m;
  });
}

// Same thing, for the common case of "upload this to this record".
function uploadFile(ownerType, ownerId, kind, file) {
  return uploadMedia(file, kind, [{ targetType: ownerType, targetId: ownerId }]);
}

function linkMedia(mediaId, targetType, targetId) {
  return mediaRequest('PATCH', '?id=' + encodeURIComponent(mediaId), { link: { targetType: targetType, targetId: targetId } }).then(refreshMedia);
}

function unlinkMedia(mediaId, targetType, targetId) {
  return mediaRequest('PATCH', '?id=' + encodeURIComponent(mediaId), { unlink: { targetType: targetType, targetId: targetId } }).then(refreshMedia);
}

function renameMedia(mediaId, title) {
  return mediaRequest('PATCH', '?id=' + encodeURIComponent(mediaId), { title: title }).then(function () {
    var m = getMedia(mediaId);
    if (m) m.title = title.trim();
    reindexMedia();
  });
}

function setMainPhoto(birdId, mediaId) {
  return setMainPhotoFor('bird', birdId, mediaId);
}

function setMainPhotoFor(targetType, targetId, mediaId) {
  return mediaRequest('PATCH', '?id=' + encodeURIComponent(mediaId), { primary: { targetType: targetType, targetId: targetId } }).then(refreshMedia);
}

// The photos linked to any record (oldest first), with the main one flagged — for places, the aviary and so on.
function mediaPhotos(targetType, targetId) {
  var out = [];
  MEDIA.slice().sort(function (a, b) { return String(a.createdAt).localeCompare(String(b.createdAt)); }).forEach(function (m) {
    if (m.type !== 'photo') return;
    m.links.forEach(function (l) {
      if (l.targetType === targetType && l.targetId === targetId) out.push({ id: m.id, url: m.url, isPrimary: !!l.isPrimary, filename: m.filename });
    });
  });
  return out;
}

// The picture to show for a record: its main photo, else its first.
function mediaMainPhotoUrl(targetType, targetId) {
  var photos = mediaPhotos(targetType, targetId);
  var main = photos.filter(function (p) { return p.isPrimary; })[0] || photos[0];
  return main ? main.url : '';
}

function deleteMedia(mediaId) {
  return mediaRequest('DELETE', '?id=' + encodeURIComponent(mediaId)).then(refreshMedia);
}

// The server decides things like which photo becomes a bird's main one, so reload the library
// after changes that can affect it.
function refreshMedia() {
  return fetch('/api/media').then(function (res) { return res.json(); }).then(function (list) {
    MEDIA.length = 0;
    Array.prototype.push.apply(MEDIA, list);
    reindexMedia();
  });
}

// "Daisy Sun Conure · AR 10002 CA", "Brock Stone", … — a link target in words, plus where it lives.
function mediaTargetInfo(link) {
  var t = link.targetType, id = link.targetId;
  if (t === 'bird') {
    var b = getBird(id);
    return b ? { text: birdShortLabel(b) + ' · ' + birdBandLabel(b), hash: '#/mybirds/birds/' + id, kind: 'Bird' } : null;
  }
  if (t === 'health') {
    var r = getHealthRecord(id), rb = r ? getBird(r.birdId) : null;
    return r ? { text: r.type + (rb ? ' · ' + birdBandLabel(rb) : ''), hash: '#/mybirds/health/' + id, kind: 'Health record' } : null;
  }
  if (t === 'waybill') {
    var w = WAYBILLS_SAMPLE.filter(function (x) { return x.id === id; })[0];
    if (!w) return null;
    var cl = w.clientId ? getContact(w.clientId) : null;
    var route = [w.departingAirport, w.arrivingAirport].filter(Boolean).join(' → ');
    return { text: [cl ? cl.name : '', route, w.date ? formatDate(w.date) : ''].filter(Boolean).join(' · ') || 'Shipment', hash: '#/business/shipping/' + id, kind: 'Shipment' };
  }
  if (t === 'transaction') {
    var tx = TRANSACTIONS_SAMPLE.filter(function (x) { return x.id === id; })[0];
    return tx ? { text: tx.item, hash: '#/business/accounting/' + id, kind: 'Accounting' } : null;
  }
  if (t === 'contact') {
    var c = getContact(id);
    return c ? { text: c.name, hash: '#/business/contacts/' + id, kind: 'Contact' } : null;
  }
  if (t === 'aviary') return { text: AVIARY.name, hash: '#/aviary/caging/aviary', kind: 'Aviary' };
  if (t === 'location') { var lo = getLocation(id); return lo ? { text: lo.name, hash: '#/aviary/caging/location~' + id, kind: 'Location' } : null; }
  if (t === 'building') { var bu = getBuilding(id); return bu ? { text: 'Building ' + bu.nickname, hash: '#/aviary/caging/building~' + id, kind: 'Building' } : null; }
  if (t === 'room') { var ro = getRoom(id); return ro ? { text: ro.name, hash: '#/aviary/caging/room~' + id, kind: 'Room' } : null; }
  if (t === 'supply') { var su = getSupply(id); return su ? { text: su.name, hash: '#/aviary/supplies/' + id, kind: 'Supply' } : null; }
  if (t === 'cage') return { text: 'Cage ' + id, hash: '#/aviary/caging/' + id, kind: 'Cage' };
  return null;
}

// All the words someone might search a file by: its name, type, and everything it's linked to.
function mediaSearchText(m) {
  var parts = [m.title, m.filename, mediaTypeInfo(m.type).one];
  m.links.forEach(function (l) {
    var info = mediaTargetInfo(l);
    if (info) parts.push(info.text, info.kind);
    if (l.targetType === 'bird') {
      var b = getBird(l.targetId);
      if (b) parts.push(b.band, b.name, b.mutation, b.sex);
    }
    if (l.targetType === 'waybill') {
      var w = WAYBILLS_SAMPLE.filter(function (x) { return x.id === l.targetId; })[0];
      if (w) {
        parts.push(w.waybillNumber, w.carrier, w.method);
        (w.birdIds || []).map(getBird).filter(Boolean).forEach(function (bd) { parts.push(bd.band, bd.name, birdShortLabel(bd)); });
      }
    }
    if (l.targetType === 'transaction') {
      var tx = TRANSACTIONS_SAMPLE.filter(function (x) { return x.id === l.targetId; })[0];
      var bb = tx && tx.birdId ? getBird(tx.birdId) : null;
      if (bb) parts.push(bb.band, bb.name);
      var cc = tx && tx.clientId ? getContact(tx.clientId) : null;
      if (cc) parts.push(cc.name);
    }
  });
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function mediaThumbSpec(m) {
  return mediaIsImage(m) ? { src: m.url } : { text: 'PDF' };
}

// A short "linked to …" line for a library item, optionally leaving out one record.
function mediaLinkedSummary(m, exceptType, exceptId) {
  var names = m.links.filter(function (l) { return !(l.targetType === exceptType && l.targetId === exceptId); })
    .map(mediaTargetInfo).filter(Boolean).map(function (i) { return i.text; });
  if (!names.length) return 'Not linked to anything yet';
  return 'Also linked to ' + names.slice(0, 2).join(', ') + (names.length > 2 ? ' +' + (names.length - 2) : '');
}

// Every record a file could be linked to, with searchable text, for the "link to…" picker.
function mediaLinkCandidates() {
  var out = [];
  BIRDS_SAMPLE.forEach(function (b) {
    out.push({ targetType: 'bird', targetId: b.id, kind: 'Bird', text: birdShortLabel(b) + ' · ' + birdBandLabel(b), hay: [b.band, b.name, birdShortLabel(b), b.mutation, b.sex].filter(Boolean).join(' ') });
  });
  CONTACTS_SAMPLE.forEach(function (c) {
    out.push({ targetType: 'contact', targetId: c.id, kind: 'Contact', text: c.name, hay: [c.name, c.company, c.city].filter(Boolean).join(' ') });
  });
  WAYBILLS_SAMPLE.forEach(function (w) {
    var info = mediaTargetInfo({ targetType: 'waybill', targetId: w.id });
    var birds = (w.birdIds || []).map(getBird).filter(Boolean);
    out.push({ targetType: 'waybill', targetId: w.id, kind: 'Shipment', text: info.text, hay: [info.text, w.waybillNumber, w.carrier].concat(birds.map(function (b) { return (b.band || '') + ' ' + birdShortLabel(b); })).join(' ') });
  });
  TRANSACTIONS_SAMPLE.forEach(function (t) {
    out.push({ targetType: 'transaction', targetId: t.id, kind: 'Accounting', text: t.item, hay: t.item });
  });
  HEALTH_RECORDS_SAMPLE.forEach(function (r) {
    var info = mediaTargetInfo({ targetType: 'health', targetId: r.id });
    var b = getBird(r.birdId);
    out.push({ targetType: 'health', targetId: r.id, kind: 'Health record', text: info.text, hay: info.text + ' ' + (b ? (b.band || '') + ' ' + birdShortLabel(b) : '') });
  });
  return out.map(function (c) { c.hay = c.hay.toLowerCase(); return c; });
}

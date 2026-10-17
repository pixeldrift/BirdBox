// Links between records, editable from BOTH ends. A cage page lists its birds and lets you add one;
// a bird page lets you assign its cage. A building page adds cages; a cage page assigns its building.
// A contact page links accounting entries and shipments; those pages assign their contact. A receipt
// can be added to an accounting entry, and an accounting entry can be assigned to a receipt (Business →
// Media). Two helpers build the pieces:
//
//   Relations.many({ title, related, render, unlink, candidates, link, refresh, addNew, empty })
//       a list of linked records, each with ✕ to unlink, and a searchable "add an existing…" picker
//   Relations.one({ title, value, render, picker, set, refresh })
//       one linked record: shown with Change / Remove, or a picker to assign one
//
// `candidates()` returns picker items (Picker.listItems); `link(id)` / `unlink(rec)` / `set(id)` return
// promises. After any change `refresh()` redraws the page.
const Relations = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function showError(box, err) {
    clearEl(box);
    box.appendChild(el('p', 'form-message error', (err && err.message) || 'That didn’t work'));
  }

  function many(o) {
    var section = el('div', 'detail-section');
    var message = el('div');
    section.appendChild(el('h3', '', o.title + ' (' + o.related.length + ')'));
    if (!o.related.length) section.appendChild(el('p', 'form-note', o.empty || 'None yet.'));
    o.related.forEach(function (rec) {
      var row = el('div', 'relation-row');
      var body = el('div', 'relation-body');
      body.appendChild(o.render(rec));
      row.appendChild(body);
      if (o.unlink) {
        var x = el('button', 'file-remove', '✕');
        x.type = 'button';
        x.setAttribute('aria-label', 'Remove');
        x.title = 'Remove from this ' + (o.parentName || 'record');
        x.addEventListener('click', function () { o.unlink(rec).then(o.refresh).catch(function (err) { showError(message, err); }); });
        row.appendChild(x);
      }
      section.appendChild(row);
    });
    if (o.candidates && o.link) {
      var add = el('div', 'relation-add');
      add.appendChild(Picker.create({
        items: o.candidates, placeholder: o.addPlaceholder || '+ Add an existing one — search…', addNew: o.addNew,
        onChange: function (id) { if (id) o.link(id).then(o.refresh).catch(function (err) { showError(message, err); }); },
      }).el);
      section.appendChild(add);
    }
    section.appendChild(message);
    return section;
  }

  function one(o) {
    var section = el('div', 'detail-section');
    var message = el('div');
    section.appendChild(el('h3', '', o.title));
    var body = el('div');
    section.appendChild(body);
    section.appendChild(message);

    function drawPicker(canCancel) {
      clearEl(body);
      var p = o.picker({ value: '', onChange: function (id) { if (id) o.set(id).then(o.refresh).catch(function (err) { showError(message, err); }); } });
      body.appendChild(p.el);
      if (canCancel) {
        var cancel = el('button', 'pick-link', 'Cancel');
        cancel.type = 'button';
        cancel.addEventListener('click', draw);
        body.appendChild(cancel);
      }
    }

    function draw() {
      clearEl(body);
      var rec = o.value ? o.find(o.value) : null;
      if (!rec) { drawPicker(false); return; }
      var row = el('div', 'relation-row');
      var b = el('div', 'relation-body');
      b.appendChild(o.render(rec));
      row.appendChild(b);
      var change = el('button', 'pick-link', 'Change');
      change.type = 'button';
      change.addEventListener('click', function () { drawPicker(true); });
      row.appendChild(change);
      var remove = el('button', 'pick-link', 'Remove');
      remove.type = 'button';
      remove.addEventListener('click', function () { o.set('').then(o.refresh).catch(function (err) { showError(message, err); }); });
      row.appendChild(remove);
      body.appendChild(row);
    }
    draw();
    return section;
  }

  // Just the "link an existing …" picker, for pages that already list the linked records another way.
  function addPicker(o) {
    var box = el('div', 'relation-add');
    var message = el('div');
    box.appendChild(Picker.create({
      items: o.candidates, placeholder: o.placeholder || '+ Add an existing one — search…',
      onChange: function (id) { if (id) o.link(id).then(o.refresh).catch(function (err) { showError(message, err); }); },
    }).el);
    box.appendChild(message);
    return box;
  }

  return { many: many, one: one, addPicker: addPicker };
})();

// ---- the writes the relations use (each returns a promise) --------------------------------

// A shipment's fields as the edit API wants them, with some changed.
function waybillPayload(wb, changes) {
  return Object.assign({
    direction: wb.direction, status: wb.status, date: wb.date || null, method: wb.method || '', carrier: wb.carrier || '',
    clientId: wb.clientId || null, birdIds: (wb.birdIds || []).slice(), departingAirport: wb.departingAirport || '',
    arrivingAirport: wb.arrivingAirport || '', waybillNumber: wb.waybillNumber || '', cost: wb.cost, notes: wb.notes || '',
  }, changes || {});
}

// Put a cage under a building (or take it out: buildingCode ''). Cages seen only on birds are set up first.
function assignCageToBuilding(code, buildingCode) {
  return getCage(code) ? updateRecord('cages', code, { buildingCode: buildingCode }) : createRecord('cages', { code: code, buildingCode: buildingCode });
}

// ---- how linked records look in a list (a tappable row that opens the record) -------------

function relationRow(thumbSpec, title, sub, hash) {
  var row = document.createElement('button');
  row.type = 'button';
  row.className = 'list-row';
  var av = document.createElement('span');
  av.className = 'list-row-avatar';
  fillThumb(av, thumbSpec);
  var info = document.createElement('span');
  info.className = 'list-row-info';
  var t = document.createElement('span');
  t.className = 'list-row-title';
  t.textContent = title;
  var st = document.createElement('span');
  st.className = 'list-row-sub';
  st.textContent = sub;
  info.appendChild(t);
  info.appendChild(st);
  row.appendChild(av);
  row.appendChild(info);
  row.addEventListener('click', function () { location.hash = hash; });
  return row;
}

function transactionRow(tx) {
  var cl = tx.clientId ? getContact(tx.clientId) : null;
  return relationRow({ icon: 'icons/tinted/business/Accounting.png' }, tx.item,
    [formatDate(tx.date), formatMoney(tx.amount), cl ? cl.name : ''].filter(Boolean).join(' · '), '#/business/accounting/' + tx.id);
}

function waybillRow(wb) {
  var info = mediaTargetInfo({ targetType: 'waybill', targetId: wb.id });
  return relationRow(waybillThumbSpec(wb), info.text, waybillStateLabel(wb), '#/business/shipping/' + wb.id);
}

function healthRow(r) {
  var b = getBird(r.birdId);
  return relationRow(healthThumbSpec(r), r.type, [formatDate(r.date), b ? birdShortLabel(b) : ''].filter(Boolean).join(' · '), '#/mybirds/health/' + r.id);
}

function cageLinkRow(code) {
  return relationRow({ icon: 'icons/tinted/aviary/Caging.png' }, code, cagePlaceLabel(code), '#/aviary/caging/' + code);
}

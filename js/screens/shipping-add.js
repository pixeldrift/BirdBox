// Add a shipment (#/business/shipping/new). A shipment doesn't have to be a flight: it can be
// air cargo, a courier, a delivery, or a handoff in person — and you can record as little or as
// much as you remember. Choose a client to see the birds linked to them, or search any bird;
// "Add New Bird" lives in the search results for when the bird isn't there yet.
const ShippingAddScreen = (function () {
  // Survives the trip to the Add Bird form and back (this is a single-page app).
  var draft = null;

  function newDraft() {
    return {
      direction: 'Outgoing', pending: false, method: '', carrier: '', date: '', from: '', to: '',
      waybill: '', cost: '', notes: '', clientId: '', birdIds: [], files: { photo: [], receipt: [], waybill: [] },
    };
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function field(labelText, control, hint) {
    var label = el('label', 'form-field');
    label.appendChild(el('span', 'form-label', labelText));
    label.appendChild(control);
    if (hint) label.appendChild(el('p', 'form-note', hint));
    return label;
  }

  function section(labelText, hint) {
    var box = el('div', 'form-field');
    box.appendChild(el('span', 'form-label', labelText));
    if (hint) box.appendChild(el('p', 'form-note', hint));
    return box;
  }

  function input(type, extra) {
    var i = el('input', 'form-input');
    i.type = type;
    Object.keys(extra || {}).forEach(function (k) { i[k] = extra[k]; });
    return i;
  }

  function chipGroup(options, getValue, onPick) {
    var wrap = el('div', 'toggle-chips');
    function draw() {
      clearEl(wrap);
      options.forEach(function (o) {
        var chip = el('button', 'filter-chip' + (getValue() === o.value ? ' active' : ''), o.label);
        chip.type = 'button';
        chip.addEventListener('click', function () { onPick(o.value); draw(); });
        wrap.appendChild(chip);
      });
    }
    draw();
    return wrap;
  }

  function matches(bird, q) {
    var hay = [bird.band, bird.name, birdTypeLabel(bird), bird.mutation].filter(Boolean).join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function renderForm(main, navigate, setTitle) {
    clearEl(main);
    setTitle('Add Shipment');
    if (!draft) draft = newDraft();
    BirdsAddScreen.afterAdd = null;

    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');

    // Shipped / Received, and whether it has left yet.
    var dirChips = chipGroup([{ value: 'Outgoing', label: 'Shipped' }, { value: 'Incoming', label: 'Received' }],
      function () { return draft.direction; }, function (v) { draft.direction = v; });
    var pendingBox = el('label', 'form-note');
    pendingBox.style.display = 'block';
    pendingBox.style.marginTop = '8px';
    var pendingCheck = document.createElement('input');
    pendingCheck.type = 'checkbox';
    pendingCheck.checked = draft.pending;
    pendingCheck.style.marginRight = '8px';
    pendingCheck.addEventListener('change', function () { draft.pending = pendingCheck.checked; });
    pendingBox.appendChild(pendingCheck);
    pendingBox.appendChild(document.createTextNode('Pending — hasn’t left yet'));
    var typeField = section('Type');
    typeField.appendChild(dirChips);
    typeField.appendChild(pendingBox);

    // Client -> their birds.
    var clientBox = section('Who is it going to / coming from?', 'Choose a contact to see the birds linked to them. (Or just fill in From / To below.)');
    var clientSearch = input('search', { placeholder: 'Search clients…' });
    var clientOut = el('div', 'pick-results');
    clientBox.appendChild(clientSearch);
    clientBox.appendChild(clientOut);

    // Birds: what's chosen, the client's birds, then a search whose last option adds a new bird.
    var birdBox = section('Birds', 'Required — at least one.');
    var chosen = el('div', 'pick-selected');
    var linkedOut = el('div', 'pick-results');
    var birdSearch = input('search', { placeholder: 'Search any bird by band, name or species…' });
    var birdOut = el('div', 'pick-results');
    birdBox.appendChild(chosen);
    birdBox.appendChild(linkedOut);
    birdBox.appendChild(birdSearch);
    birdBox.appendChild(birdOut);

    function birdOption(b, note) {
      var picked = draft.birdIds.indexOf(b.id) !== -1;
      var o = el('button', 'pick-option' + (picked ? ' selected' : ''));
      o.type = 'button';
      o.appendChild(el('span', '', birdShortLabel(b) + ' · ' + b.band));
      o.appendChild(el('small', '', picked ? 'Added ✓' : (note || 'Add')));
      o.addEventListener('click', function () { toggleBird(b.id); });
      return o;
    }

    function toggleBird(id) {
      var i = draft.birdIds.indexOf(id);
      if (i === -1) draft.birdIds.push(id); else draft.birdIds.splice(i, 1);
      drawBirds();
    }

    function drawClient() {
      clearEl(clientOut);
      var client = draft.clientId ? getContact(draft.clientId) : null;
      if (client) {
        clientSearch.hidden = true;
        var row = el('div', 'pick-selected');
        row.style.alignItems = 'center';
        row.appendChild(el('strong', '', client.name));
        var change = el('button', 'pick-link', 'Change');
        change.type = 'button';
        change.addEventListener('click', function () { draft.clientId = ''; clientSearch.value = ''; drawClient(); drawBirds(); });
        row.appendChild(change);
        clientOut.appendChild(row);
        return;
      }
      clientSearch.hidden = false;
      var q = clientSearch.value.trim().toLowerCase();
      if (!q) return;
      var found = CONTACTS_SAMPLE.filter(function (c) {
        return [c.name, c.company, c.city].filter(Boolean).join(' ').toLowerCase().indexOf(q) !== -1;
      }).slice(0, 6);
      if (!found.length) clientOut.appendChild(el('p', 'pick-empty', 'No clients match that.'));
      found.forEach(function (c) {
        var o = el('button', 'pick-option');
        o.type = 'button';
        o.appendChild(el('span', '', c.name));
        o.appendChild(el('small', '', [c.city, c.state].filter(Boolean).join(', ')));
        o.addEventListener('click', function () { draft.clientId = c.id; drawClient(); drawBirds(); });
        clientOut.appendChild(o);
      });
    }

    function addNewBird() {
      keepDetails();
      BirdsAddScreen.afterAdd = function (bird) {
        if (draft.birdIds.indexOf(bird.id) === -1) draft.birdIds.push(bird.id);
        location.hash = '#/business/shipping/new';
      };
      location.hash = '#/mybirds/birds/new';
    }

    function drawBirds() {
      clearEl(chosen);
      draft.birdIds.map(getBird).filter(Boolean).forEach(function (b) {
        chosen.appendChild(makeChip('', birdShortLabel(b) + ' ✕', function () { toggleBird(b.id); }));
      });

      clearEl(linkedOut);
      var client = draft.clientId ? getContact(draft.clientId) : null;
      if (client) {
        var linked = birdsLinkedToClient(client);
        linkedOut.appendChild(el('p', 'form-note', linked.length ? 'Birds linked to ' + client.name + ':' : 'No birds are linked to ' + client.name + ' yet — search for one below.'));
        linked.forEach(function (b) { linkedOut.appendChild(birdOption(b, 'Add')); });
      }

      clearEl(birdOut);
      var q = birdSearch.value.trim().toLowerCase();
      if (q) {
        var found = BIRDS_SAMPLE.filter(function (b) { return matches(b, q); }).slice(0, 8);
        if (!found.length) birdOut.appendChild(el('p', 'pick-empty', 'No birds match that.'));
        found.forEach(function (b) { birdOut.appendChild(birdOption(b)); });
        var add = el('button', 'pick-option add-new', '+ Add New Bird');
        add.type = 'button';
        add.addEventListener('click', addNewBird);
        birdOut.appendChild(add);
      }
    }

    clientSearch.addEventListener('input', drawClient);
    birdSearch.addEventListener('input', drawBirds);

    // How it travelled and who handled it — all optional.
    var method = el('select', 'form-input');
    [{ value: '', label: 'Not sure / not recorded' }].concat(SHIP_METHODS.map(function (m) { return { value: m, label: m }; }))
      .forEach(function (o) {
        var opt = el('option', '', o.label);
        opt.value = o.value;
        method.appendChild(opt);
      });
    method.value = draft.method;
    var carrier = input('text', { placeholder: 'e.g. Delta Cargo, FedEx, “drove it myself”', value: draft.carrier });
    var from = input('text', { placeholder: 'A person, place or airport', value: draft.from });
    var to = input('text', { placeholder: 'A person, place or airport', value: draft.to });
    var date = input('date', { value: draft.date });
    var waybill = input('text', { placeholder: 'Optional', value: draft.waybill });
    var cost = input('number', { min: '0', step: '0.01', placeholder: '0.00', value: draft.cost });
    var notes = el('textarea', 'form-input');
    notes.rows = 3;
    notes.value = draft.notes;

    function keepDetails() {
      draft.method = method.value; draft.carrier = carrier.value; draft.date = date.value;
      draft.from = from.value; draft.to = to.value; draft.waybill = waybill.value;
      draft.cost = cost.value; draft.notes = notes.value;
    }

    // Files to attach once the shipment is saved.
    var attachBox = section('Photos & papers', 'Optional. Photos of the crate or the handoff, the shipping receipt, a copy of the waybill.');
    var attachList = el('div');
    function drawAttach() {
      clearEl(attachList);
      [['photo', '+ Add Photos', 'image/*'], ['receipt', '+ Add Receipt', 'image/*,application/pdf'], ['waybill', '+ Add Waybill', 'image/*,application/pdf']].forEach(function (k) {
        draft.files[k[0]].forEach(function (f, i) {
          var row = el('div', 'file-row');
          row.appendChild(el('span', '', SHIP_FILE_KINDS[k[0]] + ': ' + (f.name || 'file')));
          var x = el('button', 'file-remove', '✕');
          x.type = 'button';
          x.addEventListener('click', function () { draft.files[k[0]].splice(i, 1); drawAttach(); });
          row.appendChild(x);
          attachList.appendChild(row);
        });
        var btn = el('label', 'add-record-btn photo-upload-btn', k[1]);
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.accept = k[2];
        fi.multiple = true;
        fi.hidden = true;
        fi.addEventListener('change', function () {
          Array.prototype.forEach.call(fi.files, function (f) { draft.files[k[0]].push(f); });
          drawAttach();
        });
        btn.appendChild(fi);
        attachList.appendChild(btn);
      });
    }
    attachBox.appendChild(attachList);

    var errorBox = el('div');
    var saveBtn = el('button', 'save-btn', 'Save Shipment');
    saveBtn.type = 'submit';

    [typeField, clientBox, birdBox, field('How did it travel?', method), field('Handled by', carrier, 'Courier, airline, or the person who carried it.'),
      field('From', from, 'Optional — a place, airport or person, as much as you know.'), field('To', to),
      field('Date', date, 'Leave blank if you don’t remember. For a pending shipment, the planned day.'),
      field('Waybill / tracking #', waybill), attachBox, field('Notes', notes),
      field('Cost', cost, 'Optional — the cost is also tracked in Accounting.'), errorBox, saveBtn].forEach(function (e) { form.appendChild(e); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      keepDetails();
      clearEl(errorBox);
      function note(kind, msg) { errorBox.appendChild(el('p', 'form-message ' + kind, msg)); }
      if (!draft.birdIds.length) { note('error', 'Choose at least one bird'); return; }
      if (!draft.clientId && !draft.from.trim() && !draft.to.trim()) {
        note('error', 'Choose who it ' + (draft.direction === 'Outgoing' ? 'went to' : 'came from') + ', or fill in From / To');
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addWaybill({
        direction: draft.direction, status: draft.pending ? 'Pending' : 'Complete', date: draft.date || null,
        method: draft.method, carrier: draft.carrier, clientId: draft.clientId || null, birdIds: draft.birdIds,
        departingAirport: draft.from, arrivingAirport: draft.to, waybillNumber: draft.waybill, cost: draft.cost, notes: draft.notes,
      }).then(function (wb) {
        var jobs = [];
        Object.keys(draft.files).forEach(function (kind) {
          draft.files[kind].forEach(function (f) { jobs.push([kind, f]); });
        });
        var failed = [];
        var moved = { ids: draft.birdIds.slice(), clientId: draft.clientId, direction: draft.direction, pending: draft.pending };
        return jobs.reduce(function (chain, j) {
          return chain.then(function () {
            return addWaybillFile(wb, j[0], j[1]).catch(function (err) { failed.push(err.message); });
          });
        }, Promise.resolve()).then(function () {
          draft = null;
          if (!failed.length) { afterSave(wb, moved, navigate, main); return; }
          note('error', 'The shipment was saved, but ' + failed.length + (failed.length === 1 ? ' file' : ' files') + ' didn’t upload: ' + failed.join('; ') + '. You can add them on the shipment.');
          var open = el('button', 'save-btn', 'Open Shipment');
          open.type = 'button';
          open.addEventListener('click', function () { afterSave(wb, moved, navigate, main); });
          saveBtn.replaceWith(open);
        });
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Shipment';
        note('error', err.message);
      });
    });

    drawClient();
    drawBirds();
    drawAttach();
    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  // A shipment that has really happened means possession moved — ask (never assume) whether
  // ownership changes too. A pending shipment hasn't left yet, so there's nothing to ask.
  function afterSave(wb, moved, navigate, main) {
    var contact = moved.clientId ? getContact(moved.clientId) : null;
    if (moved.pending) { navigate(wb.id); return; }
    clearEl(main);
    var box = el('div', 'detail-screen');
    box.appendChild(el('p', 'form-message info', 'Shipment saved.'));
    var promptBox = el('div');
    box.appendChild(promptBox);
    main.appendChild(box);
    var opts = { birdIds: moved.ids, contact: contact, direction: moved.direction === 'Outgoing' ? 'Out' : 'In', onDone: function () { navigate(wb.id); } };
    // No contact to hand ownership to, but the status question still applies.
    if (contact) OwnershipPrompt.render(promptBox, opts); else OwnershipPrompt.askStatus(promptBox, opts);
  }

  // Start a shipment with some details already filled in (e.g. from a bird's transfer).
  function prefill(values) {
    draft = newDraft();
    if (values.direction) draft.direction = values.direction;
    if (values.clientId) draft.clientId = values.clientId;
    if (values.birdIds) draft.birdIds = values.birdIds.slice();
    if (values.date) draft.date = values.date;
  }

  return { renderForm: renderForm, prefill: prefill, reset: function () { draft = null; } };
})();

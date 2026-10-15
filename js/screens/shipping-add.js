// Add a shipment (#/business/shipping/new). Pick Shipped or Received, optionally Pending
// (hasn't left yet), then choose a client — which lists the birds linked to them — and/or
// search any bird, or add a brand-new bird without losing the shipment you were filling in.
const ShippingAddScreen = (function () {
  // Survives the trip to the Add Bird form and back (this is a single-page app).
  var draft = null;

  function newDraft() {
    return { direction: 'Outgoing', pending: false, date: '', departing: '', arriving: '', waybill: '', cost: '', notes: '', clientId: '', birdIds: [] };
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
    var clientBox = section('Client', 'Optional. Choose one to see the birds linked to them.');
    var clientSearch = input('search', { placeholder: 'Search clients…' });
    clientSearch.className = 'form-input';
    var clientOut = el('div', 'pick-results');
    clientBox.appendChild(clientSearch);
    clientBox.appendChild(clientOut);

    // Birds.
    var birdBox = section('Birds');
    var chosen = el('div', 'pick-selected');
    var linkedOut = el('div', 'pick-results');
    var birdSearch = input('search', { placeholder: 'Search any bird by band, name or species…' });
    var birdOut = el('div', 'pick-results');
    var addNew = el('button', 'pick-link', '+ Add New Bird');
    addNew.type = 'button';
    birdBox.appendChild(chosen);
    birdBox.appendChild(linkedOut);
    birdBox.appendChild(birdSearch);
    birdBox.appendChild(birdOut);
    birdBox.appendChild(addNew);

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

    function drawBirds() {
      clearEl(chosen);
      draft.birdIds.map(getBird).filter(Boolean).forEach(function (b) {
        var chip = makeChip('', birdShortLabel(b) + ' ✕', function () { toggleBird(b.id); });
        chosen.appendChild(chip);
      });

      clearEl(linkedOut);
      var client = draft.clientId ? getContact(draft.clientId) : null;
      if (client) {
        var linked = birdsLinkedToClient(client);
        linkedOut.appendChild(el('p', 'form-note', linked.length ? 'Birds linked to ' + client.name + ':' : 'No birds are linked to ' + client.name + ' yet — search below or add a new bird.'));
        linked.forEach(function (b) { linkedOut.appendChild(birdOption(b, 'Add')); });
      }

      clearEl(birdOut);
      var q = birdSearch.value.trim().toLowerCase();
      if (q) {
        var found = BIRDS_SAMPLE.filter(function (b) { return matches(b, q); }).slice(0, 8);
        if (!found.length) birdOut.appendChild(el('p', 'pick-empty', 'No birds match that.'));
        found.forEach(function (b) { birdOut.appendChild(birdOption(b)); });
      }
    }

    clientSearch.addEventListener('input', drawClient);
    birdSearch.addEventListener('input', drawBirds);

    addNew.addEventListener('click', function () {
      keepDetails();
      BirdsAddScreen.afterAdd = function (bird) {
        if (draft.birdIds.indexOf(bird.id) === -1) draft.birdIds.push(bird.id);
        location.hash = '#/business/shipping/new';
      };
      location.hash = '#/mybirds/birds/new';
    });

    // Trip details.
    var date = input('date', { value: draft.date });
    var departing = input('text', { placeholder: 'e.g. LAX', value: draft.departing });
    var arriving = input('text', { placeholder: 'e.g. DEN', value: draft.arriving });
    var waybill = input('text', { placeholder: 'Optional', value: draft.waybill });
    var cost = input('number', { min: '0', step: '0.01', placeholder: '0.00', value: draft.cost });
    var notes = el('textarea', 'form-input');
    notes.rows = 3;
    notes.value = draft.notes;

    function keepDetails() {
      draft.date = date.value; draft.departing = departing.value; draft.arriving = arriving.value;
      draft.waybill = waybill.value; draft.cost = cost.value; draft.notes = notes.value;
    }

    var errorBox = el('div');
    var saveBtn = el('button', 'save-btn', 'Save Shipment');
    saveBtn.type = 'submit';

    [typeField, clientBox, birdBox, field('Date', date, 'The day it went out or arrived — or the planned day, if pending.'),
      field('From (airport or city)', departing), field('To (airport or city)', arriving), field('Waybill #', waybill),
      field('Cost', cost), field('Notes', notes), errorBox, saveBtn].forEach(function (e) { form.appendChild(e); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      keepDetails();
      clearEl(errorBox);
      function fail(msg) { var p = el('p', 'form-message error', msg); errorBox.appendChild(p); }
      if (!draft.date) { fail('Choose a date'); return; }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addWaybill({
        direction: draft.direction, status: draft.pending ? 'Pending' : 'Complete', date: draft.date,
        clientId: draft.clientId || null, birdIds: draft.birdIds, departingAirport: draft.departing,
        arrivingAirport: draft.arriving, waybillNumber: draft.waybill, cost: draft.cost, notes: draft.notes,
      }).then(function (wb) {
        draft = null;
        navigate(wb.id);
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Shipment';
        fail(err.message);
      });
    });

    drawClient();
    drawBirds();
    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  return { renderForm: renderForm, reset: function () { draft = null; } };
})();

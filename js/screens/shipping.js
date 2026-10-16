// Shipping (sales shipping records: waybills, costs, dates) for business/shipping.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const ShippingScreen = (function () {
  var FILTERS = ['All', 'Shipped', 'Received', 'Pending'];

  function matchesFilter(w, f) {
    if (f === 'All') return true;
    return waybillStateLabel(w) === f;
  }

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function goToContact(contactId) {
    location.hash = '#/business/contacts/' + contactId;
  }

  function stateClass(wb) {
    return 'type-' + waybillStateLabel(wb).toLowerCase();
  }

  function routeLabel(wb) {
    if (wb.departingAirport && wb.arrivingAirport) return wb.departingAirport + ' → ' + wb.arrivingAirport;
    return wb.departingAirport || wb.arrivingAirport || '';
  }

  function renderList(main, navigate) {
    var state = { query: '', filter: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var actions = document.createElement('div');
    actions.className = 'list-actions';
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-record-btn';
    addBtn.textContent = '+ Add Shipment';
    addBtn.addEventListener('click', function () { ShippingAddScreen.reset(); navigate('new'); });
    actions.appendChild(addBtn);

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search client, bird, carrier, waybill…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search shipments');

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'filter-chips';

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      clearEl(chipsWrap);
      FILTERS.forEach(function (f) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (state.filter === f ? ' active' : '');
        chip.textContent = f;
        chip.addEventListener('click', function () {
          state.filter = f;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = WAYBILLS_SAMPLE.filter(function (w) {
        if (!matchesFilter(w, state.filter)) return false;
        if (!q) return true;
        var client = waybillClient(w);
        var birds = waybillBirds(w);
        var hay = [w.waybillNumber, w.method, w.carrier, w.departingAirport, w.arrivingAirport, client ? client.name : '']
          .concat(birds.map(function (b) { return b.band; }))
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

      var n = results.length;
      var noun = n === 1 ? ' shipment' : ' shipments';
      var tail = { All: '', Shipped: ' sent', Received: ' received', Pending: ' pending' }[state.filter];
      clearEl(countLabel);
      var strong = document.createElement('strong');
      strong.textContent = String(n);
      countLabel.appendChild(strong);
      countLabel.appendChild(document.createTextNode(noun + tail));

      clearEl(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No shipments match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (w) { listWrap.appendChild(renderRow(w, navigate)); });
      }
    }

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    wrap.appendChild(actions);
    wrap.appendChild(searchInput);
    wrap.appendChild(chipsWrap);
    wrap.appendChild(countLabel);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(wb, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    fillThumb(avatar, waybillThumbSpec(wb));

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var birds = waybillBirds(wb);
    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = birds.length ? birds.map(function (b) { return birdShortLabel(b) + ' (' + b.band + ')'; }).join(', ') : 'Shipment';

    var client = waybillClient(wb);
    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    sub.textContent = [wb.date ? formatDate(wb.date) : '', routeLabel(wb) || wb.method, client ? client.name : '']
      .filter(Boolean).join(' · ');

    info.appendChild(title);
    info.appendChild(sub);

    var side = document.createElement('span');
    side.className = 'list-row-amount';
    var badge = document.createElement('span');
    badge.className = 'type-badge ' + stateClass(wb);
    badge.textContent = waybillStateLabel(wb);
    side.appendChild(badge);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(side);

    row.addEventListener('click', function () { navigate(wb.id); });
    return row;
  }

  // An upload problem to show after the section redraws.
  var uploadError = '';

  // Photos, the receipt and the waybill copy attached to a shipment.
  function renderFiles(wb, refresh) {
    return FilesUI.render({
      ownerType: 'waybill', ownerId: wb.id, refresh: refresh,
      items: function () { return wb.files || []; },
      kinds: [
        { kind: 'photo', title: 'Photos', addLabel: '+ Add Photos', accept: 'image/*', grid: true, empty: 'The crate, the handoff, the bird at the airport — add photos if you have them.' },
        { kind: 'receipt', title: 'Receipt', addLabel: '+ Add Receipt', accept: 'image/*,application/pdf' },
        { kind: 'waybill', title: 'Waybill', addLabel: '+ Add Waybill', accept: 'image/*,application/pdf' },
      ],
    });
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new') return ShippingAddScreen.renderForm(main, navigate, setTitle);
    if (id.indexOf('edit~') === 0) {
      var editTarget = WAYBILLS_SAMPLE.filter(function (w) { return w.id === id.slice(5); })[0];
      if (editTarget) return ShippingAddScreen.renderForm(main, navigate, setTitle, editTarget);
    }
    var wb = WAYBILLS_SAMPLE.filter(function (w) { return w.id === id; })[0];
    if (!wb) {
      var missing = document.createElement('p');
      missing.textContent = 'Shipment not found.';
      main.appendChild(missing);
      return;
    }

    var birds = waybillBirds(wb);
    setTitle(birds.length ? birdShortLabel(birds[0]) : 'Shipment');

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    fillThumb(avatar, waybillThumbSpec(wb));

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    var headClient = waybillClient(wb);
    h2.textContent = routeLabel(wb) || (headClient ? headClient.name : '') || wb.method || 'Shipment';
    var dirBadge = document.createElement('span');
    dirBadge.className = 'type-badge ' + stateClass(wb);
    dirBadge.textContent = waybillStateLabel(wb);
    titleWrap.appendChild(h2);
    titleWrap.appendChild(dirBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    header.appendChild(makeEditButton(function () { navigate('edit~' + wb.id); }));
    wrap.appendChild(header);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    if (wb.date) factsGrid.appendChild(factRow(wb.status === 'Pending' ? 'Planned date' : 'Date', formatDate(wb.date)));
    if (wb.method) factsGrid.appendChild(factRow('How', wb.method));
    if (wb.carrier) factsGrid.appendChild(factRow('Handled by', wb.carrier));
    if (wb.departingAirport) factsGrid.appendChild(factRow('From', wb.departingAirport));
    if (wb.arrivingAirport) factsGrid.appendChild(factRow('To', wb.arrivingAirport));
    if (wb.waybillNumber) factsGrid.appendChild(factRow('Waybill / tracking #', wb.waybillNumber));
    if (wb.cost !== null && wb.cost !== undefined) factsGrid.appendChild(factRow('Cost', formatMoney(wb.cost)));
    if (factsGrid.children.length) wrap.appendChild(factsGrid);


    if (wb.status === 'Pending') {
      var pendingBox = document.createElement('div');
      pendingBox.className = 'detail-section';
      var happened = document.createElement('button');
      happened.type = 'button';
      happened.className = 'save-btn';
      happened.textContent = wb.direction === 'Incoming' ? 'Mark as Received' : 'Mark as Shipped';
      var pendingMsg = document.createElement('div');
      happened.addEventListener('click', function () {
        happened.disabled = true;
        completeWaybill(wb, wb.date || todayIso()).then(function () {
          var after = function () { renderDetail(main, id, navigate, setTitle); };
          var who = waybillClient(wb);
          if (!wb.birdIds.length) { after(); return; }
          clearEl(pendingBox);
          var opts = { birdIds: wb.birdIds, contact: who, direction: wb.direction === 'Incoming' ? 'In' : 'Out', onDone: after };
          if (who) OwnershipPrompt.render(pendingBox, opts); else OwnershipPrompt.askStatus(pendingBox, opts);
        }).catch(function (err) {
          happened.disabled = false;
          clearEl(pendingMsg);
          var p = document.createElement('p');
          p.className = 'form-message error';
          p.textContent = err.message;
          pendingMsg.appendChild(p);
        });
      });
      pendingBox.appendChild(happened);
      pendingBox.appendChild(pendingMsg);
      wrap.appendChild(pendingBox);
    }

    var client = waybillClient(wb);
    if (client || birds.length) {
      var linksSection = document.createElement('div');
      linksSection.className = 'detail-section';
      var linksTitle = document.createElement('h3');
      linksTitle.textContent = 'Linked to';
      linksSection.appendChild(linksTitle);

      var linksRow = document.createElement('div');
      linksRow.className = 'chip-row';
      if (client) linksRow.appendChild(contactChip(client, function () { goToContact(client.id); }, 'Client'));
      birds.forEach(function (b) {
        linksRow.appendChild(birdChip(b, function () { goToBird(b.id); }));
      });
      linksSection.appendChild(linksRow);
      wrap.appendChild(linksSection);
    }

    if (wb.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'detail-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'notes-text';
      notesP.textContent = wb.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    wrap.appendChild(renderFiles(wb, function () { renderDetail(main, id, navigate, setTitle); }));

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

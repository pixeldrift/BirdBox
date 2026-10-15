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
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Shipping.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var birds = waybillBirds(wb);
    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = birds.length ? birds.map(birdShortLabel).join(', ') : 'Shipment';

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

  function sizeLabel(bytes) {
    return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  // Photos, the receipt and the waybill copy attached to a shipment.
  function renderFiles(wb, refresh) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var message = document.createElement('div');

    function fail(err) {
      clearEl(message);
      var p = document.createElement('p');
      p.className = 'form-message error';
      p.textContent = err.message || 'Something went wrong';
      message.appendChild(p);
    }

    function addButton(kind, label, accept, multiple) {
      var btn = document.createElement('label');
      btn.className = 'add-record-btn photo-upload-btn';
      btn.textContent = label;
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = !!multiple;
      input.hidden = true;
      input.addEventListener('change', function () {
        var files = Array.prototype.slice.call(input.files);
        if (!files.length) return;
        btn.firstChild.textContent = 'Uploading…';
        files.reduce(function (chain, f) {
          return chain.then(function () { return addWaybillFile(wb, kind, f); });
        }, Promise.resolve()).then(refresh).catch(function (err) { uploadError = err.message || 'Upload failed'; refresh(); });
      });
      btn.appendChild(input);
      return btn;
    }

    function removeButton(file) {
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'file-remove';
      x.textContent = '✕';
      x.setAttribute('aria-label', 'Remove ' + (file.filename || 'file'));
      x.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!window.confirm('Remove this file from the shipment?')) return;
        removeWaybillFile(wb, file.id).then(refresh).catch(fail);
      });
      return x;
    }

    var files = wb.files || [];
    var photos = files.filter(function (f) { return f.kind === 'photo'; });

    var h = document.createElement('h3');
    h.textContent = 'Photos';
    section.appendChild(h);
    if (photos.length) {
      var grid = document.createElement('div');
      grid.className = 'photo-grid';
      photos.forEach(function (f) {
        var tile = document.createElement('div');
        tile.className = 'photo-tile';
        var a = document.createElement('a');
        a.href = f.url;
        a.target = '_blank';
        a.rel = 'noopener';
        var img = document.createElement('img');
        img.src = f.url;
        img.alt = 'Shipment photo';
        a.appendChild(img);
        tile.appendChild(a);
        tile.appendChild(removeButton(f));
        grid.appendChild(tile);
      });
      section.appendChild(grid);
    } else {
      var none = document.createElement('p');
      none.className = 'form-note';
      none.textContent = 'The crate, the handoff, the bird at the airport — add photos if you have them.';
      section.appendChild(none);
    }
    section.appendChild(addButton('photo', '+ Add Photos', 'image/*', true));

    [['receipt', 'Receipt', '+ Add Receipt'], ['waybill', 'Waybill', '+ Add Waybill']].forEach(function (k) {
      var docs = files.filter(function (f) { return f.kind === k[0]; });
      var dh = document.createElement('h3');
      dh.textContent = k[1];
      section.appendChild(dh);
      docs.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'file-row';
        var link = document.createElement('a');
        link.href = f.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = (f.filename || k[1]) + ' · ' + sizeLabel(f.size);
        row.appendChild(link);
        row.appendChild(removeButton(f));
        section.appendChild(row);
      });
      section.appendChild(addButton(k[0], k[2], 'image/*,application/pdf', true));
    });

    section.appendChild(message);
    if (uploadError) { fail({ message: uploadError }); uploadError = ''; }
    return section;
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new') return ShippingAddScreen.renderForm(main, navigate, setTitle);
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
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Shipping.png';
    img.alt = '';
    avatar.appendChild(img);

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
          if (!who || !wb.birdIds.length) { after(); return; }
          clearEl(pendingBox);
          OwnershipPrompt.render(pendingBox, { birdIds: wb.birdIds, contact: who, direction: wb.direction === 'Incoming' ? 'In' : 'Out', onDone: after });
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
      if (client) linksRow.appendChild(makeChip('Client', client.name, function () { goToContact(client.id); }));
      birds.forEach(function (b) {
        linksRow.appendChild(makeChip('Bird', birdShortLabel(b), function () { goToBird(b.id); }));
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

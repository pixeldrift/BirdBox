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
    searchInput.placeholder = 'Search waybill, client, bird…';
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
        var hay = [w.waybillNumber, w.departingAirport, w.arrivingAirport, client ? client.name : '']
          .concat(birds.map(function (b) { return b.band; }))
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

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
    sub.textContent = [formatDate(wb.date), routeLabel(wb), client ? client.name : '']
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

  function renderDetail(main, id, navigate, setTitle) {
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
    h2.textContent = routeLabel(wb) || 'Shipment';
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
    factsGrid.appendChild(factRow(wb.status === 'Pending' ? 'Planned date' : 'Date', formatDate(wb.date)));
    if (wb.cost !== null && wb.cost !== undefined) factsGrid.appendChild(factRow('Cost', formatMoney(wb.cost)));
    factsGrid.appendChild(factRow('Waybill #', wb.waybillNumber || '—'));
    wrap.appendChild(factsGrid);

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

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

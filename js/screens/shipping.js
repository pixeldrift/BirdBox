// Shipping (sales shipping records: waybills, costs, dates) for business/shipping.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const ShippingScreen = (function () {
  var FILTERS = ['All', 'Outgoing', 'Incoming'];

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function goToContact(contactId) {
    location.hash = '#/business/contacts/' + contactId;
  }

  function directionClass(direction) {
    return 'type-' + direction.toLowerCase();
  }

  function renderList(main, navigate) {
    var state = { query: '', direction: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var totalCost = WAYBILLS_SAMPLE.reduce(function (sum, w) { return sum + w.cost; }, 0);
    var summary = document.createElement('div');
    summary.className = 'summary-strip';
    [
      ['Shipments', String(WAYBILLS_SAMPLE.length)],
      ['Total Cost', formatMoney(totalCost)],
      ['Outgoing', String(WAYBILLS_SAMPLE.filter(function (w) { return w.direction === 'Outgoing'; }).length)],
    ].forEach(function (s) {
      var tile = document.createElement('div');
      tile.className = 'summary-tile';
      var l = document.createElement('span');
      l.className = 'summary-tile-label';
      l.textContent = s[0];
      var v = document.createElement('span');
      v.className = 'summary-tile-value';
      v.textContent = s[1];
      tile.appendChild(l);
      tile.appendChild(v);
      summary.appendChild(tile);
    });

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
        chip.className = 'filter-chip' + (state.direction === f ? ' active' : '');
        chip.textContent = f;
        chip.addEventListener('click', function () {
          state.direction = f;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = WAYBILLS_SAMPLE.filter(function (w) {
        if (state.direction !== 'All' && w.direction !== state.direction) return false;
        if (!q) return true;
        var client = waybillClient(w);
        var birds = waybillBirds(w);
        var hay = [w.waybillNumber, w.departingAirport, w.arrivingAirport, client ? client.name : '']
          .concat(birds.map(function (b) { return b.band; }))
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

      countLabel.textContent = results.length + (results.length === 1 ? ' shipment' : ' shipments');

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

    wrap.appendChild(summary);
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
    sub.textContent = formatDate(wb.date) + ' · ' + wb.departingAirport + ' → ' + wb.arrivingAirport +
      (client ? ' · ' + client.name : '');

    info.appendChild(title);
    info.appendChild(sub);

    var cost = document.createElement('span');
    cost.className = 'list-row-amount amount-expense';
    cost.textContent = formatMoney(wb.cost);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(cost);

    row.addEventListener('click', function () { navigate(wb.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
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
    h2.textContent = wb.departingAirport + ' → ' + wb.arrivingAirport;
    var dirBadge = document.createElement('span');
    dirBadge.className = 'type-badge ' + directionClass(wb.direction);
    dirBadge.textContent = wb.direction;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(dirBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    wrap.appendChild(header);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    factsGrid.appendChild(factRow('Date', formatDate(wb.date)));
    factsGrid.appendChild(factRow('Cost', formatMoney(wb.cost)));
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

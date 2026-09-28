// Accounting (financial records / purchases) list+detail screen for business/accounting.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const AccountingScreen = (function () {
  var FILTERS = ['All', 'Income', 'Expense'];

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function goToContact(contactId) {
    location.hash = '#/business/contacts/' + contactId;
  }

  function renderList(main, navigate) {
    var state = { query: '', filter: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var summary = document.createElement('div');
    summary.className = 'summary-strip';
    var income = transactionsTotal(TRANSACTIONS_SAMPLE, function (t) { return t.amount > 0; });
    var expense = transactionsTotal(TRANSACTIONS_SAMPLE, function (t) { return t.amount < 0; });
    [
      ['Income', formatMoney(income)],
      ['Expense', formatMoney(expense)],
      ['Net', formatMoney(income + expense)],
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
    searchInput.placeholder = 'Search transactions…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search transactions');

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
      var results = TRANSACTIONS_SAMPLE.filter(function (t) {
        if (state.filter === 'Income' && t.amount <= 0) return false;
        if (state.filter === 'Expense' && t.amount >= 0) return false;
        if (!q) return true;
        var client = txClient(t);
        var bird = txBird(t);
        var hay = [t.item, t.category, t.funding, client ? client.name : '', bird ? bird.band : '']
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

      countLabel.textContent = results.length + (results.length === 1 ? ' transaction' : ' transactions');

      clearEl(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No transactions match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (t) { listWrap.appendChild(renderRow(t, navigate)); });
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

  function renderRow(tx, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Accounting.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = tx.item;

    var client = txClient(tx);
    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    sub.textContent = formatDate(tx.date) + ' · ' + tx.category + (client ? ' · ' + client.name : '');

    info.appendChild(title);
    info.appendChild(sub);

    var amount = document.createElement('span');
    amount.className = 'list-row-amount ' + (tx.amount >= 0 ? 'amount-income' : 'amount-expense');
    amount.textContent = formatMoney(tx.amount);

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(amount);

    row.addEventListener('click', function () { navigate(tx.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
    var tx = TRANSACTIONS_SAMPLE.filter(function (t) { return t.id === id; })[0];
    if (!tx) {
      var missing = document.createElement('p');
      missing.textContent = 'Transaction not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(tx.item);

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Accounting.png';
    img.alt = '';
    avatar.appendChild(img);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = tx.item;
    var amountBadge = document.createElement('span');
    amountBadge.className = 'list-row-amount ' + (tx.amount >= 0 ? 'amount-income' : 'amount-expense');
    amountBadge.textContent = formatMoney(tx.amount);
    titleWrap.appendChild(h2);
    titleWrap.appendChild(amountBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    [
      ['Date', formatDate(tx.date)],
      ['Category', tx.category],
      ['Funding', tx.funding],
    ].forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1])); });

    wrap.appendChild(header);
    wrap.appendChild(factsGrid);

    var client = txClient(tx);
    var bird = txBird(tx);
    if (client || bird) {
      var linksSection = document.createElement('div');
      linksSection.className = 'detail-section';
      var linksTitle = document.createElement('h3');
      linksTitle.textContent = 'Linked to';
      linksSection.appendChild(linksTitle);

      var linksRow = document.createElement('div');
      linksRow.className = 'chip-row';
      if (client) {
        linksRow.appendChild(makeChip('Client', client.name, function () { goToContact(client.id); }));
      }
      if (bird) {
        linksRow.appendChild(makeChip('Bird', birdShortLabel(bird), function () { goToBird(bird.id); }));
      }
      linksSection.appendChild(linksRow);
      wrap.appendChild(linksSection);
    }

    if (tx.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'detail-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'notes-text';
      notesP.textContent = tx.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

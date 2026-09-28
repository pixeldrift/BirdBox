// Real Birds list/detail screen, replacing the generic placeholder for the
// mybirds/birds route. Data comes from js/data/birds-sample.js.
const BirdsScreen = (function () {
  var STATUSES = ['All', 'Available', 'Reserved', 'Sold', 'Deceased'];

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function statusClass(status) {
    return 'status-' + status.toLowerCase();
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatMoney(n) {
    if (n === null || n === undefined) return '—';
    return '$' + n.toLocaleString();
  }

  function birdShortLabel(b) {
    return (b.name ? '"' + b.name + '" ' : '') + b.subspecies + ' ' + b.species;
  }

  function renderList(main, navigate) {
    var state = { query: '', status: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'birds-screen';

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search band #, name, species…';
    searchInput.className = 'birds-search-input';
    searchInput.setAttribute('aria-label', 'Search birds');

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'birds-filter-chips';

    var countLabel = document.createElement('p');
    countLabel.className = 'birds-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'birds-list';

    function draw() {
      clear(chipsWrap);
      STATUSES.forEach(function (s) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (state.status === s ? ' active' : '');
        chip.textContent = s;
        chip.addEventListener('click', function () {
          state.status = s;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = BIRDS_SAMPLE.filter(function (b) {
        if (state.status !== 'All' && b.status !== state.status) return false;
        if (!q) return true;
        var hay = [b.band, b.name, b.species, b.subspecies, b.mutation].filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      countLabel.textContent = results.length + (results.length === 1 ? ' bird' : ' birds');

      clear(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'birds-empty';
        empty.textContent = 'No birds match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (b) {
          listWrap.appendChild(renderRow(b, navigate));
        });
      }
    }

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    wrap.appendChild(searchInput);
    wrap.appendChild(chipsWrap);
    wrap.appendChild(countLabel);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(bird, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'bird-row';

    var avatar = document.createElement('span');
    avatar.className = 'bird-row-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/mybirds/Birds.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'bird-row-info';

    var title = document.createElement('span');
    title.className = 'bird-row-title';
    title.textContent = birdShortLabel(bird);

    var sub = document.createElement('span');
    sub.className = 'bird-row-sub';
    sub.textContent = bird.band + ' · ' + bird.sex + (bird.mutation ? ' · ' + bird.mutation : '');

    info.appendChild(title);
    info.appendChild(sub);

    var status = document.createElement('span');
    status.className = 'status-badge ' + statusClass(bird.status);
    status.textContent = bird.status;

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(status);

    row.addEventListener('click', function () { navigate(bird.id); });
    return row;
  }

  function factRow(label, value) {
    var item = document.createElement('div');
    item.className = 'bird-fact';
    var l = document.createElement('span');
    l.className = 'bird-fact-label';
    l.textContent = label;
    var v = document.createElement('span');
    v.className = 'bird-fact-value';
    v.textContent = value;
    item.appendChild(l);
    item.appendChild(v);
    return item;
  }

  function relChip(label, relBird, navigate) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'bird-chip' + (relBird ? '' : ' disabled');
    var l = document.createElement('span');
    l.className = 'bird-chip-label';
    l.textContent = label;
    var v = document.createElement('span');
    v.className = 'bird-chip-value';
    v.textContent = relBird ? birdShortLabel(relBird) : 'Unknown';
    chip.appendChild(l);
    chip.appendChild(v);
    if (relBird) {
      chip.addEventListener('click', function () { navigate(relBird.id); });
    } else {
      chip.disabled = true;
    }
    return chip;
  }

  function renderDetail(main, id, navigate, setTitle) {
    var bird = getBird(id);
    if (!bird) {
      var missing = document.createElement('p');
      missing.textContent = 'Bird not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(bird.name || bird.band);

    var wrap = document.createElement('div');
    wrap.className = 'bird-detail';

    var header = document.createElement('div');
    header.className = 'bird-detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'bird-detail-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/mybirds/Birds.png';
    img.alt = '';
    avatar.appendChild(img);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'bird-detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = birdIdentifier(bird);
    var statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge ' + statusClass(bird.status);
    statusBadge.textContent = bird.status;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(statusBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'bird-facts-grid';
    [
      ['Band #', bird.band],
      ['Sex', bird.sex],
      ['Species', bird.species],
      ['Subspecies', bird.subspecies],
      ['Mutation', bird.mutation || '—'],
      ['Hatch Date', formatDate(bird.hatchDate)],
      ['Location', bird.cage || '—'],
    ].forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1])); });

    var familySection = document.createElement('div');
    familySection.className = 'bird-section';
    var familyTitle = document.createElement('h3');
    familyTitle.textContent = 'Family';
    familySection.appendChild(familyTitle);

    var familyChips = document.createElement('div');
    familyChips.className = 'bird-chip-row';
    familyChips.appendChild(relChip('Mother', bird.motherId ? getBird(bird.motherId) : null, navigate));
    familyChips.appendChild(relChip('Father', bird.fatherId ? getBird(bird.fatherId) : null, navigate));
    if (bird.pairedId) familyChips.appendChild(relChip('Paired With', getBird(bird.pairedId), navigate));
    familySection.appendChild(familyChips);

    var kids = birdChildren(bird.id);
    if (kids.length) {
      var kidsLabel = document.createElement('p');
      kidsLabel.className = 'bird-subsection-label';
      kidsLabel.textContent = 'Offspring (' + kids.length + ')';
      familySection.appendChild(kidsLabel);

      var kidsRow = document.createElement('div');
      kidsRow.className = 'bird-chip-row';
      kids.forEach(function (k) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'bird-chip';
        var v = document.createElement('span');
        v.className = 'bird-chip-value';
        v.textContent = birdShortLabel(k);
        chip.appendChild(v);
        chip.addEventListener('click', function () { navigate(k.id); });
        kidsRow.appendChild(chip);
      });
      familySection.appendChild(kidsRow);
    }

    var moneySection = document.createElement('div');
    moneySection.className = 'bird-section';
    var moneyTitle = document.createElement('h3');
    moneyTitle.textContent = 'Sale';
    moneySection.appendChild(moneyTitle);
    var moneyGrid = document.createElement('div');
    moneyGrid.className = 'bird-facts-grid';
    moneyGrid.appendChild(factRow('Cost', formatMoney(bird.cost)));
    moneyGrid.appendChild(factRow('Price', formatMoney(bird.price)));
    moneySection.appendChild(moneyGrid);

    wrap.appendChild(header);
    wrap.appendChild(factsGrid);
    wrap.appendChild(familySection);
    wrap.appendChild(moneySection);

    if (bird.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'bird-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'bird-notes';
      notesP.textContent = bird.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

// Caging: which cage each bird is in, grouped from Birds.cage — deliberately light
// (no separate feeding-schedule/supplies/multi-user tracking yet, see docs/roadmap.md).
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const CagingScreen = (function () {
  var UNASSIGNED = 'unassigned';

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function cageGroups() {
    var byCage = {};
    BIRDS_SAMPLE.forEach(function (b) {
      var key = b.cage || UNASSIGNED;
      if (!byCage[key]) byCage[key] = [];
      byCage[key].push(b);
    });
    return Object.keys(byCage).map(function (key) {
      return { code: key, birds: byCage[key], building: key === UNASSIGNED ? null : buildingForCage(key) };
    }).sort(function (a, b) {
      if (a.code === UNASSIGNED) return 1;
      if (b.code === UNASSIGNED) return -1;
      return a.code.localeCompare(b.code);
    });
  }

  function renderList(main, navigate) {
    var state = { query: '' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search cage or building…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search cages');

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      var q = state.query.trim().toLowerCase();
      var groups = cageGroups().filter(function (g) {
        if (!q) return true;
        var hay = [g.code, g.building ? g.building.nickname : '', g.building ? g.building.description : '']
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      countLabel.textContent = groups.length + (groups.length === 1 ? ' cage' : ' cages');

      clearEl(listWrap);
      if (groups.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No cages match that search.';
        listWrap.appendChild(empty);
      } else {
        groups.forEach(function (g) { listWrap.appendChild(renderRow(g, navigate)); });
      }
    }

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    wrap.appendChild(searchInput);
    wrap.appendChild(countLabel);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(group, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/aviary/Caging.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = group.code === UNASSIGNED ? 'Unassigned' : group.code;

    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    sub.textContent = group.building ? 'Building ' + group.building.nickname : 'No location set';

    info.appendChild(title);
    info.appendChild(sub);

    var count = document.createElement('span');
    count.className = 'type-badge type-breeder';
    count.textContent = group.birds.length + (group.birds.length === 1 ? ' bird' : ' birds');

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(count);

    row.addEventListener('click', function () { navigate(group.code); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
    var groups = cageGroups();
    var group = groups.filter(function (g) { return g.code === id; })[0];
    if (!group) {
      var missing = document.createElement('p');
      missing.textContent = 'Cage not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(group.code === UNASSIGNED ? 'Unassigned' : group.code);

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/aviary/Caging.png';
    img.alt = '';
    avatar.appendChild(img);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = group.code === UNASSIGNED ? 'Unassigned' : group.code;
    var sub = document.createElement('span');
    sub.className = 'type-badge type-breeder';
    sub.textContent = group.building ? 'Building ' + group.building.nickname : 'No location set';
    titleWrap.appendChild(h2);
    titleWrap.appendChild(sub);

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    wrap.appendChild(header);

    if (group.building) {
      var factsGrid = document.createElement('div');
      factsGrid.className = 'fact-grid';
      factsGrid.appendChild(factRow('Building', group.building.nickname));
      factsGrid.appendChild(factRow('Description', group.building.description));
      wrap.appendChild(factsGrid);
    }

    var birdsSection = document.createElement('div');
    birdsSection.className = 'detail-section';
    var birdsTitle = document.createElement('h3');
    birdsTitle.textContent = 'Birds (' + group.birds.length + ')';
    birdsSection.appendChild(birdsTitle);

    var birdsRow = document.createElement('div');
    birdsRow.className = 'chip-row';
    group.birds.forEach(function (b) {
      birdsRow.appendChild(makeChip(null, birdShortLabel(b), function () { goToBird(b.id); }));
    });
    birdsSection.appendChild(birdsRow);
    wrap.appendChild(birdsSection);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

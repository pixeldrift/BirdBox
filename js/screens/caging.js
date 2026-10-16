// Caging: where the birds live. A hierarchy you can use as much or as little of as you like —
//   Location (a site)  >  Building  >  Cage  >  birds
// Every level is optional. The list can show every cage flat, or grouped by building or by
// location, filtered and sorted. Locations, buildings and cages are added, edited and deleted
// here (js/data/record-schemas.js); a bird points at its cage by the cage's code.
// Routes: <cage> · building~<code> · location~<id> · new~cage|building|location · edit~cage|building|location~<key>
const CagingScreen = (function () {
  var UNASSIGNED = 'unassigned';
  var state = { query: '', view: 'flat', sort: 'name', locationId: '', buildingCode: '' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  var TYPE_OF = { cage: 'cages', building: 'buildings', location: 'locations' };

  function pageHash(kind, key) {
    return '#/aviary/caging/' + (kind === 'cage' ? key : kind + '~' + key);
  }

  function icon() {
    var img = el('img');
    img.src = 'icons/tinted/aviary/Caging.png';
    img.alt = '';
    return img;
  }

  function avatar(cls) {
    var a = el('span', cls || 'list-row-avatar');
    a.appendChild(icon());
    return a;
  }

  function birdCount(n) {
    return n + (n === 1 ? ' bird' : ' birds');
  }

  // ---- the list ---------------------------------------------------------------------------

  function cageRows() {
    return allCages().map(function (c) {
      var b = buildingForCage(c.code);
      return { code: c.code, setUp: c.setUp, description: c.description, building: b, location: buildingLocation(b), birds: birdsInCage(c.code) };
    });
  }

  function renderList(main, navigate) {
    var wrap = el('div', 'list-screen');

    var actions = el('div', 'list-actions list-actions-3');
    [['+ Cage', 'new~cage'], ['+ Building', 'new~building'], ['+ Location', 'new~location']].forEach(function (a) {
      var btn = el('button', 'add-record-btn', a[0]);
      btn.type = 'button';
      btn.addEventListener('click', function () { navigate(a[1]); });
      actions.appendChild(btn);
    });

    var search = el('input', 'search-input');
    search.type = 'search';
    search.placeholder = 'Search cage, building, location…';
    search.value = state.query;

    var viewChips = el('div', 'filter-chips');
    var sortChips = el('div', 'filter-chips');
    var filters = el('div', 'record-form');
    var count = el('p', 'list-count');
    var body = el('div');

    function chips(target, label, options, key) {
      clearEl(target);
      target.appendChild(el('span', 'form-note', label));
      options.forEach(function (o) {
        var chip = el('button', 'filter-chip' + (state[key] === o[0] ? ' active' : ''), o[1]);
        chip.type = 'button';
        chip.addEventListener('click', function () { state[key] = o[0]; draw(); });
        target.appendChild(chip);
      });
    }

    // Filter pickers (only worth showing once there's something to filter by).
    function drawFilters() {
      clearEl(filters);
      if (LOCATIONS_SAMPLE.length) {
        var lf = el('div', 'form-field');
        lf.appendChild(el('span', 'form-label', 'Location'));
        lf.appendChild(Picker.locations({ value: state.locationId, allowClear: true, placeholder: 'Any location — search…',
          onChange: function (id) { state.locationId = id; if (id && state.buildingCode) { var b = getBuilding(state.buildingCode); if (!b || b.locationId !== id) state.buildingCode = ''; } draw(); } }).el);
        filters.appendChild(lf);
      }
      if (BUILDINGS_SAMPLE.length) {
        var bf = el('div', 'form-field');
        bf.appendChild(el('span', 'form-label', 'Building'));
        bf.appendChild(Picker.buildings({ value: state.buildingCode, allowClear: true, placeholder: 'Any building — search…',
          onChange: function (code) { state.buildingCode = code; draw(); } }).el);
        filters.appendChild(bf);
      }
    }

    function matches(r) {
      if (state.buildingCode && !(r.building && r.building.code === state.buildingCode)) return false;
      if (state.locationId && !(r.location && r.location.id === state.locationId)) return false;
      var q = state.query.trim().toLowerCase();
      if (!q) return true;
      var hay = [r.code, r.description, r.building ? r.building.nickname + ' ' + r.building.code + ' ' + r.building.description : '', r.location ? r.location.name : '']
        .filter(Boolean).join(' ').toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }

    function sorted(rows) {
      return rows.slice().sort(function (a, b) {
        if (state.sort === 'birds' && b.birds.length !== a.birds.length) return b.birds.length - a.birds.length;
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
    }

    function row(r) {
      var btn = el('button', 'list-row');
      btn.type = 'button';
      btn.appendChild(avatar());
      var info = el('span', 'list-row-info');
      info.appendChild(el('span', 'list-row-title', r.code));
      info.appendChild(el('span', 'list-row-sub', cagePlaceLabel(r.code) + (r.setUp ? '' : ' · not set up yet')));
      btn.appendChild(info);
      btn.appendChild(el('span', 'type-badge type-breeder', birdCount(r.birds.length)));
      btn.addEventListener('click', function () { navigate(r.code); });
      return btn;
    }

    function groupHeading(text, sub, kind, key) {
      var h = el('button', 'group-heading');
      h.type = 'button';
      h.appendChild(el('strong', '', text));
      if (sub) h.appendChild(el('span', 'form-note', sub));
      if (key) h.addEventListener('click', function () { navigate(kind + '~' + key); });
      else h.disabled = true;
      return h;
    }

    function draw() {
      chips(viewChips, 'Show', [['flat', 'All cages'], ['building', 'By building'], ['location', 'By location']], 'view');
      chips(sortChips, 'Sort', [['name', 'Cage number'], ['birds', 'Most birds']], 'sort');
      var rows = sorted(cageRows().filter(matches));
      clearEl(body);
      clearEl(count);
      count.appendChild(el('strong', '', String(rows.length)));
      count.appendChild(document.createTextNode(rows.length === 1 ? ' cage' : ' cages'));

      if (state.view === 'flat') {
        var rl = el('div', 'list-rows');
        rows.forEach(function (r) { rl.appendChild(row(r)); });
        body.appendChild(rl);
      } else {
        // Group rows by building (or by location), with the groups you haven't filled in last.
        var groups = {};
        var order = [];
        rows.forEach(function (r) {
          var key = state.view === 'building' ? (r.building ? r.building.code : '') : (r.location ? r.location.id : '');
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push(r);
        });
        // Also show empty buildings / locations when browsing without a search or filter.
        var browsing = !state.query.trim() && !state.buildingCode && !state.locationId;
        if (browsing) {
          (state.view === 'building' ? BUILDINGS_SAMPLE.map(function (b) { return b.code; }) : LOCATIONS_SAMPLE.map(function (l) { return l.id; })).forEach(function (k) {
            if (!groups[k]) { groups[k] = []; order.push(k); }
          });
        }
        order.sort(function (a, b) {
          if (!a) return 1;
          if (!b) return -1;
          var na = state.view === 'building' ? (getBuilding(a) || {}).nickname : (getLocation(a) || {}).name;
          var nb = state.view === 'building' ? (getBuilding(b) || {}).nickname : (getLocation(b) || {}).name;
          return String(na).localeCompare(String(nb), undefined, { numeric: true });
        });
        order.forEach(function (key) {
          var list = groups[key];
          var heading;
          var birds = list.reduce(function (n, r) { return n + r.birds.length; }, 0);
          var tail = list.length + (list.length === 1 ? ' cage' : ' cages') + ' · ' + birdCount(birds);
          if (state.view === 'building') {
            var b = key ? getBuilding(key) : null;
            heading = b ? groupHeading('Building ' + b.nickname + (b.description ? ' — ' + b.description : ''), tail, 'building', b.code) : groupHeading('No building', tail);
          } else {
            var l = key ? getLocation(key) : null;
            heading = l ? groupHeading(l.name + (l.description ? ' — ' + l.description : ''), tail, 'location', l.id) : groupHeading('No location', tail);
          }
          body.appendChild(heading);
          var gl = el('div', 'list-rows');
          list.forEach(function (r) { gl.appendChild(row(r)); });
          if (!list.length) gl.appendChild(el('p', 'list-empty', 'No cages here yet.'));
          body.appendChild(gl);
        });
      }

      // Birds with no cage at all.
      var loose = BIRDS_SAMPLE.filter(function (b) { return !b.cage; });
      if (loose.length && !state.buildingCode && !state.locationId && !state.query.trim()) {
        var un = el('button', 'list-row');
        un.type = 'button';
        un.appendChild(avatar());
        var ui = el('span', 'list-row-info');
        ui.appendChild(el('span', 'list-row-title', 'Unassigned'));
        ui.appendChild(el('span', 'list-row-sub', 'Birds with no cage'));
        un.appendChild(ui);
        un.appendChild(el('span', 'type-badge type-breeder', birdCount(loose.length)));
        un.addEventListener('click', function () { navigate(UNASSIGNED); });
        body.appendChild(un);
      }
      if (!rows.length) body.insertBefore(el('p', 'list-empty', allCages().length ? 'No cages match.' : 'No cages yet — tap “+ Cage” to add one.'), body.firstChild);
    }

    search.addEventListener('input', function (e) { state.query = e.target.value; draw(); });
    drawFilters();
    draw();
    [actions, search, viewChips, sortChips, filters, count, body].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);
  }

  // ---- pages ------------------------------------------------------------------------------

  function header(titleText, badgeText, onEdit) {
    var h = el('div', 'detail-header');
    h.appendChild(avatar('detail-avatar'));
    var t = el('div', 'detail-title');
    t.appendChild(el('h2', '', titleText));
    if (badgeText) t.appendChild(el('span', 'type-badge type-breeder', badgeText));
    h.appendChild(t);
    if (onEdit) h.appendChild(makeEditButton(onEdit));
    return h;
  }

  function addButton(label, onClick) {
    var b = el('button', 'add-record-btn', label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function cageRowSimple(c, navigate) {
    var btn = el('button', 'list-row');
    btn.type = 'button';
    btn.appendChild(avatar());
    var info = el('span', 'list-row-info');
    info.appendChild(el('span', 'list-row-title', c.code));
    info.appendChild(el('span', 'list-row-sub', c.description || cagePlaceLabel(c.code)));
    btn.appendChild(info);
    btn.appendChild(el('span', 'type-badge type-breeder', birdCount(birdsInCage(c.code).length)));
    btn.addEventListener('click', function () { navigate(c.code); });
    return btn;
  }

  function renderCage(main, id, navigate, setTitle) {
    var isLoose = id === UNASSIGNED;
    var birds = isLoose ? BIRDS_SAMPLE.filter(function (b) { return !b.cage; }) : birdsInCage(id);
    var rec = isLoose ? null : getCage(id);
    if (!isLoose && !rec && !birds.length) { main.appendChild(el('p', '', 'Cage not found.')); return; }
    setTitle(isLoose ? 'Unassigned' : id);

    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(isLoose ? 'Unassigned' : id, isLoose ? 'No cage' : cagePlaceLabel(id), rec ? function () { navigate('edit~cage~' + id); } : null));

    if (!isLoose) {
      var b = buildingForCage(id);
      var loc = buildingLocation(b);
      var facts = el('div', 'fact-grid');
      if (b) facts.appendChild(factRow('Building', b.nickname));
      if (loc) facts.appendChild(factRow('Location', loc.name));
      if (rec && rec.description) facts.appendChild(factRow('Description', rec.description));
      if (facts.children.length) wrap.appendChild(facts);
      if (b) wrap.appendChild(addButton('Open building ' + b.nickname, function () { navigate('building~' + b.code); }));
      if (!rec) {
        wrap.appendChild(el('p', 'form-note', 'This cage number is on some birds but hasn’t been set up yet. Set it up to file it under a building.'));
        wrap.appendChild(addButton('Set up this cage', function () { navigate('new~cage~' + id); }));
      }
    }

    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', 'Birds (' + birds.length + ')'));
    var row = el('div', 'chip-row');
    birds.forEach(function (bd) { row.appendChild(birdChip(bd, function () { goToBird(bd.id); })); });
    if (!birds.length) section.appendChild(el('p', 'form-note', 'No birds in this cage.'));
    section.appendChild(row);
    wrap.appendChild(section);
    main.appendChild(wrap);
  }

  function renderBuilding(main, code, navigate, setTitle) {
    var b = getBuilding(code);
    if (!b) { main.appendChild(el('p', '', 'Building not found.')); return; }
    setTitle('Building ' + b.nickname);
    var cages = allCages().filter(function (c) { var bb = buildingForCage(c.code); return bb && bb.code === code; });
    var loc = buildingLocation(b);
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header('Building ' + b.nickname, loc ? loc.name : b.code, function () { navigate('edit~building~' + code); }));
    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Code', b.code));
    if (b.description) facts.appendChild(factRow('Description', b.description));
    if (loc) facts.appendChild(factRow('Location', loc.name));
    wrap.appendChild(facts);
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', 'Cages (' + cages.length + ')'));
    var list = el('div', 'list-rows');
    cages.forEach(function (c) { list.appendChild(cageRowSimple(c, navigate)); });
    if (!cages.length) section.appendChild(el('p', 'form-note', 'No cages in this building yet.'));
    section.appendChild(list);
    section.appendChild(addButton('+ Add a cage here', function () { navigate('new~cage~~' + code); }));
    wrap.appendChild(section);
    main.appendChild(wrap);
  }

  function renderLocation(main, id, navigate, setTitle) {
    var l = getLocation(id);
    if (!l) { main.appendChild(el('p', '', 'Location not found.')); return; }
    setTitle(l.name);
    var buildings = BUILDINGS_SAMPLE.filter(function (b) { return b.locationId === id; });
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(l.name, buildings.length + (buildings.length === 1 ? ' building' : ' buildings'), function () { navigate('edit~location~' + id); }));
    if (l.description) { var f = el('div', 'fact-grid'); f.appendChild(factRow('Description', l.description)); wrap.appendChild(f); }
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', 'Buildings (' + buildings.length + ')'));
    var list = el('div', 'list-rows');
    buildings.forEach(function (b) {
      var n = allCages().filter(function (c) { var bb = buildingForCage(c.code); return bb && bb.code === b.code; }).length;
      var btn = el('button', 'list-row');
      btn.type = 'button';
      btn.appendChild(avatar());
      var info = el('span', 'list-row-info');
      info.appendChild(el('span', 'list-row-title', 'Building ' + b.nickname));
      info.appendChild(el('span', 'list-row-sub', b.description || b.code));
      btn.appendChild(info);
      btn.appendChild(el('span', 'type-badge type-breeder', n + (n === 1 ? ' cage' : ' cages')));
      btn.addEventListener('click', function () { navigate('building~' + b.code); });
      list.appendChild(btn);
    });
    if (!buildings.length) section.appendChild(el('p', 'form-note', 'No buildings on this location yet.'));
    section.appendChild(list);
    section.appendChild(addButton('+ Add a building here', function () { navigate('new~building~' + id); }));
    wrap.appendChild(section);
    main.appendChild(wrap);
  }

  // new~cage[~<code>[~<buildingCode>]] · new~building[~<locationId>] · new~location · edit~<kind>~<key>
  function renderForm(main, parts, navigate, setTitle) {
    var mode = parts[0], kind = parts[1], key = parts[2] || '';
    var type = TYPE_OF[kind];
    if (!type) { main.appendChild(el('p', '', 'Not found.')); return; }
    var prefill = {};
    if (mode === 'new') {
      if (kind === 'cage') {
        if (key) { prefill.code = key; var guess = buildingForCage(key); if (guess) prefill.buildingCode = guess.code; }
        if (parts[3]) prefill.buildingCode = parts[3];
      }
      if (kind === 'building' && key) prefill.locationId = key;
    }
    var backList = function () { location.hash = '#/aviary/caging'; };
    RecordForm.render(main, {
      type: type, id: mode === 'edit' ? key : null, prefill: prefill, setTitle: setTitle, navigate: navigate,
      after: function (savedKey) { location.hash = pageHash(kind, savedKey); },
      onCancel: function () { if (mode === 'edit') location.hash = pageHash(kind, key); else backList(); },
      afterDelete: backList,
    });
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    // "new~cage~" with an empty code part arrives as new~cage~~F2 (an empty second part).
    var parts = id.split('~');
    if (parts[0] === 'new' || parts[0] === 'edit') return renderForm(main, parts, navigate, setTitle);
    if (parts[0] === 'building') return renderBuilding(main, parts[1], navigate, setTitle);
    if (parts[0] === 'location') return renderLocation(main, parts[1], navigate, setTitle);
    return renderCage(main, id, navigate, setTitle);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

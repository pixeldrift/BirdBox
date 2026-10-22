// The Caging explorer: one consistent way to move around My Aviary > Locations > Buildings > Rooms > Cages > birds.
//   Browse — drill down one level at a time, with breadcrumbs
//   Tree   — everything at once, with ▸ twirl-downs (opening a branch and selecting it are separate)
//   All    — every location, building, room or cage in one list, wherever it sits
// Browse and All can be shown as a list or as a grid; where you are is kept when you switch.
// Every entry — at any level, and the "Unassigned birds" one — is the same LocationItem.
// Built on js/location-model.js; the detail pages stay in js/screens/caging.js.
const LocationExplorer = (function () {
  var state = {
    mode: 'browse', present: 'list', focus: 'aviary:main', allKind: 'cage',
    query: '', sort: 'name', filters: { unassigned: false, birds: false, empty: false, notSetUp: false },
    expanded: {}, prefill: null,
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function btn(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  var ICONS = {
    aviary: 'icons/places/aviary.svg', location: 'icons/places/location.svg', building: 'icons/places/building.svg',
    room: 'icons/places/room.svg', cage: 'icons/tinted/aviary/Caging.png', loose: 'icons/places/birds.svg',
  };

  // ---- the one item component --------------------------------------------------------------

  function thumbFor(node) {
    var photo = node.kind === 'loose' ? '' : mediaMainPhotoUrl(node.kind, node.key);
    if (node.kind === 'aviary') photo = mediaMainPhotoUrl('aviary', 'main');
    return makeThumb(photo ? { src: photo } : { icon: ICONS[node.kind] || ICONS.cage });
  }

  // node: a LocationModel node, or a bird ({ kind: 'bird', bird }). opts: { path: 'Home farm › Building F2', onOpen }
  function item(node, opts) {
    opts = opts || {};
    var b = el('button', 'loc-item loc-' + node.kind + (node.unassigned ? ' loc-unassigned' : ''));
    b.type = 'button';
    var thumb;
    if (node.kind === 'bird') {
      thumb = el('span', 'chip-thumb');
      fillBirdAvatar(thumb, node.bird);
    } else {
      thumb = thumbFor(node);
    }
    thumb.classList.add('loc-thumb');
    b.appendChild(thumb);

    var info = el('span', 'loc-info');
    info.appendChild(el('span', 'loc-name', node.kind === 'bird' ? birdShortLabel(node.bird) : node.name));
    var sub;
    if (node.kind === 'bird') sub = [birdBandLabel(node.bird), node.bird.sex].filter(Boolean).join(' · ');
    else if (opts.path) sub = opts.path; // searching or browsing All: where it is
    else sub = node.kind === 'loose' ? 'No cage set' : node.kind === 'cage' ? (node.record && node.record.description) || '' : LocationModel.countsLine(node);
    info.appendChild(el('span', 'loc-sub', sub));
    b.appendChild(info);

    // Grid cards: the parent's name lower left, what's inside lower right.
    var foot = el('span', 'loc-foot');
    foot.appendChild(el('span', 'loc-parent', opts.parent || ''));
    foot.appendChild(el('span', 'loc-contents', node.kind === 'bird' ? '' : contentsLabel(node)));
    b.appendChild(foot);

    if (node.kind !== 'bird') {
      var n = node.kind === 'cage' || node.kind === 'loose' ? node.directBirds : node.birds;
      b.appendChild(el('span', 'loc-badge', n ? plural(n, 'bird', 'birds') : 'Empty'));
      b.appendChild(el('span', 'loc-chev', '›'));
    }
    if (opts.onOpen) b.addEventListener('click', opts.onOpen);
    return b;
  }

  // "3 cages", "2 rooms · 5 cages" → in a card, just the one number that matters.
  function contentsLabel(n) {
    if (n.kind === 'cage' || n.kind === 'loose') return n.directBirds ? plural(n.directBirds, 'bird', 'birds') : 'Empty';
    var kids = n.children.filter(function (c) { return c.kind !== 'loose'; });
    if (!kids.length) return 'Empty';
    var kinds = {};
    kids.forEach(function (c) { kinds[c.kind] = (kinds[c.kind] || 0) + 1; });
    var ks = Object.keys(kinds);
    return ks.length === 1 ? plural(kids.length, ks[0], LocationModel.PLURAL[ks[0]]) : plural(kids.length, 'item', 'items');
  }

  // ---- helpers ---------------------------------------------------------------------------

  function pathLabel(node, model) {
    return LocationModel.ancestors(node, model.byId).filter(function (a) { return a.kind !== 'aviary'; }).map(function (a) { return a.name; }).join(' › ');
  }

  function matchesQuery(node, model) {
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var parts = [node.name, node.typeLabel, node.key, node.record && node.record.description, pathLabel(node, model)];
    (node.birdList || []).forEach(function (bd) { parts.push(bd.name, bd.band, birdShortLabel(bd)); });
    var hay = parts.filter(Boolean).join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function matchesFilters(node) {
    var f = state.filters;
    if (f.unassigned && !node.unassigned) return false;
    var hasBirds = node.kind === 'cage' || node.kind === 'loose' ? node.directBirds > 0 : node.birds > 0;
    if (f.birds && !hasBirds) return false;
    if (f.empty && (hasBirds || node.kind === 'loose')) return false;
    if (f.notSetUp && node.setUp !== false) return false;
    return true;
  }

  function filtersActive() {
    var f = state.filters;
    return f.unassigned || f.birds || f.empty || f.notSetUp;
  }

  function sortNodes(list) {
    var out = list.slice();
    if (state.sort === 'birds') {
      out.sort(function (a, b) { return (b.birds || 0) - (a.birds || 0) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    } else if (state.sort === 'items') {
      var size = function (n) { return n.counts.cages + n.counts.rooms + n.counts.buildings; };
      out.sort(function (a, b) { return size(b) - size(a) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    } else {
      out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    }
    return out;
  }

  // Where "Add new" should put things, given what's selected: the kinds that make sense there, and the parent to pre-fill.
  function addOptions(node) {
    var kinds = { aviary: ['location', 'building', 'room', 'cage'], location: ['building', 'room'], building: ['room', 'cage'], room: ['cage'] }[node.kind] || [];
    return kinds.map(function (kind) {
      var prefill = {};
      if (node.kind === 'location') prefill.locationId = node.key;
      if (node.kind === 'building') prefill.buildingCode = node.key;
      if (node.kind === 'room') { prefill.roomId = node.key; var rb = node.record && node.record.buildingCode; if (rb) prefill.buildingCode = rb; }
      return { kind: kind, label: { location: 'Location', building: 'Building', room: 'Room', cage: 'Cage' }[kind], prefill: prefill };
    });
  }

  function takePrefill() {
    var p = state.prefill;
    state.prefill = null;
    return p || {};
  }

  // ---- the screen ------------------------------------------------------------------------

  function render(main, navigate) {
    var wrap = el('div', 'loc-explorer');
    main.appendChild(wrap);
    var model;

    function detailHash(node) {
      if (node.kind === 'aviary') return 'aviary';
      if (node.kind === 'loose') return 'unassigned';
      return node.kind === 'cage' ? node.key : node.kind + '~' + node.key;
    }

    function startAdd(kind, prefill) {
      state.prefill = prefill || {};
      navigate('new~' + kind);
    }

    function openAddMenu(options) {
      if (options.length === 1) { startAdd(options[0].kind, options[0].prefill); return; }
      Modal.open({
        title: 'Add new',
        build: function (body, close) {
          options.forEach(function (o) {
            var row = btn('add-record-btn loc-add-row', '+ ' + o.label, function () { close(); startAdd(o.kind, o.prefill); });
            body.appendChild(row);
          });
        },
      });
    }

    function openFilters() {
      Modal.open({
        title: 'Filter',
        build: function (body, close) {
          var rows = [['unassigned', 'Unassigned only', 'Not placed under a location or building yet'], ['birds', 'Has birds', ''], ['empty', 'Empty — no birds', ''], ['notSetUp', 'Not set up yet', 'Cage numbers used on birds that have no cage record']];
          rows.forEach(function (r) {
            var label = el('label', 'loc-filter-row');
            var cb = el('input');
            cb.type = 'checkbox';
            cb.checked = !!state.filters[r[0]];
            cb.addEventListener('change', function () { state.filters[r[0]] = cb.checked; });
            var text = el('span', '', r[1]);
            if (r[2]) text.appendChild(el('small', '', r[2]));
            label.appendChild(cb);
            label.appendChild(text);
            body.appendChild(label);
          });
          var done = btn('save-btn', 'Show results', function () { close(); draw(); });
          body.appendChild(done);
          body.appendChild(btn('add-record-btn', 'Clear filters', function () { state.filters = { unassigned: false, birds: false, empty: false, notSetUp: false }; close(); draw(); }));
        },
      });
    }

    function segmented(options, current, onPick, cls) {
      var seg = el('div', 'loc-seg' + (cls ? ' ' + cls : ''));
      options.forEach(function (o) {
        var b = btn('loc-seg-btn' + (o[0] === current ? ' active' : ''), o[1], function () { onPick(o[0]); });
        seg.appendChild(b);
      });
      return seg;
    }

    // The selected place, summarised: photo, name, counts, and the way to its full page.
    function inspector(node) {
      var card = el('div', 'loc-head');
      var thumb = thumbFor(node);
      thumb.classList.add('loc-head-thumb');
      card.appendChild(thumb);
      var info = el('div', 'loc-head-info');
      info.appendChild(el('strong', 'loc-head-name', node.name));
      var line = node.kind === 'loose' ? 'Birds with no cage set' : node.kind === 'cage' ? (node.record && node.record.description) || '' : LocationModel.countsLine(node);
      info.appendChild(el('span', 'loc-sub', line));
      var n = node.kind === 'cage' || node.kind === 'loose' ? node.directBirds : node.birds;
      info.appendChild(el('span', 'loc-badge', n ? plural(n, 'bird', 'birds') : 'Empty'));
      card.appendChild(info);
      card.appendChild(el('span', 'loc-chev', '›'));
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.addEventListener('click', function () { navigate(detailHash(node)); });
      return card;
    }

    function draw() {
      model = LocationModel.build();
      if (!model.byId[state.focus]) state.focus = model.root.id;
      clearEl(wrap);
      var focus = model.byId[state.focus];

      // 1. mode
      wrap.appendChild(segmented([['browse', 'Browse'], ['tree', 'Tree'], ['all', 'All']], state.mode, function (m) { state.mode = m; draw(); }, 'loc-modes'));

      // 2. one search box, with Add new beside it
      var bar = el('div', 'loc-searchbar');
      var search = el('input', 'search-input loc-search');
      search.type = 'search';
      search.value = state.query;
      search.placeholder = state.mode === 'browse' ? 'Search ' + (focus.kind === 'aviary' ? 'My Aviary' : focus.name) + '…' : state.mode === 'tree' ? 'Search ' + model.root.name + '…' : 'Search all ' + LocationModel.PLURAL[state.allKind] + '…';
      search.addEventListener('input', function (e) { state.query = e.target.value; drawResults(); });
      bar.appendChild(search);
      var addTarget = state.mode === 'all' ? null : focus;
      var opts = state.mode === 'all' ? [{ kind: state.allKind, label: LocationModel.KINDS[state.allKind], prefill: {} }] : addOptions(addTarget);
      if (opts.length) bar.appendChild(btn('loc-add', '+ Add new', function () { openAddMenu(opts); }));
      wrap.appendChild(bar);

      // 3. sort (a dropdown), filter (a button), list / grid together
      var ctl = el('div', 'loc-controls');
      var sortWrap = el('label', 'loc-sort');
      sortWrap.appendChild(el('span', '', 'Sort'));
      var sel = el('select', 'loc-select');
      sel.setAttribute('aria-label', 'Sort by');
      [['name', 'Name'], ['birds', 'Most birds'], ['items', 'Most inside']].forEach(function (o) { var op = el('option', '', o[1]); op.value = o[0]; sel.appendChild(op); });
      sel.value = state.sort;
      sel.addEventListener('change', function () { state.sort = sel.value; drawResults(); });
      sortWrap.appendChild(sel);
      ctl.appendChild(sortWrap);
      var activeCount = ['unassigned', 'birds', 'empty', 'notSetUp'].filter(function (k) { return state.filters[k]; }).length;
      ctl.appendChild(btn('loc-filter-btn' + (activeCount ? ' on' : ''), activeCount ? 'Filter · ' + activeCount : 'Filter', openFilters));
      ctl.appendChild(el('span', 'loc-spacer'));
      var treeCtl = ctl;
      if (state.mode === 'tree') {
        treeCtl.appendChild(btn('loc-mini', 'Expand', function () { LocationModel.descendants(model.root, model.byId).forEach(function (n) { if (n.children.length) state.expanded[n.id] = true; }); state.expanded[model.root.id] = true; drawResults(); }));
        treeCtl.appendChild(btn('loc-mini', 'Collapse', function () { state.expanded = {}; drawResults(); }));
      } else {
        ctl.appendChild(segmented([['list', '☰ List'], ['grid', '▦ Grid']], state.present, function (p) { state.present = p; draw(); }, 'loc-present'));
      }
      wrap.appendChild(ctl);

      // 4. active filters, and what the search covers
      var chips = el('div', 'loc-chips');
      var labels = { unassigned: 'Unassigned only', birds: 'Has birds', empty: 'Empty', notSetUp: 'Not set up' };
      Object.keys(labels).forEach(function (k) {
        if (!state.filters[k]) return;
        var c = btn('loc-chip', labels[k] + '  ✕', function () { state.filters[k] = false; draw(); });
        chips.appendChild(c);
      });
      if (chips.firstChild) wrap.appendChild(chips);
      var scope = el('p', 'loc-scope');
      wrap.appendChild(scope);

      var body = el('div', 'loc-body');
      wrap.appendChild(body);

      function scopeText() {
        var searching = state.query.trim() || filtersActive();
        if (state.mode === 'browse') return searching ? 'Looking through everything inside ' + (focus.kind === 'aviary' ? 'My Aviary' : focus.name) + '.' : '';
        if (state.mode === 'tree') return searching ? 'Looking through everything in My Aviary.' : '';
        return searching ? 'Looking through all ' + LocationModel.PLURAL[state.allKind] + ', wherever they are.' : '';
      }

      // ---- results ---------------------------------------------------------------------
      function list(nodes, opts2) {
        var box = el('div', 'loc-items' + (state.present === 'grid' && state.mode !== 'tree' ? ' grid' : ''));
        nodes.forEach(function (n) {
          box.appendChild(item(n, { path: opts2 && opts2.paths ? pathLabel(n, model) : '', parent: parentName(n), onOpen: function () { open(n); } }));
        });
        return box;
      }

      function parentName(n) { var p = model.byId[n.parentId]; return p ? p.name : ''; }

      function open(n) {
        if (state.mode === 'all') { navigate(detailHash(n)); return; }
        state.focus = n.id; state.query = ''; draw();
      }

      function empty(text) { return el('p', 'list-empty', text); }

      function drawBrowse() {
        var searching = state.query.trim() || filtersActive();
        // breadcrumbs
        var crumbs = el('div', 'picker-crumbs loc-crumbs');
        var rootCrumb = btn('pick-link', model.root.name, function () { state.focus = model.root.id; state.query = ''; draw(); });
        crumbs.appendChild(rootCrumb);
        LocationModel.ancestors(focus, model.byId).concat(focus.id === model.root.id ? [] : [focus]).forEach(function (a) {
          if (a.kind === 'aviary') return;
          crumbs.appendChild(el('span', 'crumb-sep', '›'));
          crumbs.appendChild(btn('pick-link', a.name, function () { state.focus = a.id; state.query = ''; draw(); }));
        });
        body.appendChild(crumbs);
        body.appendChild(inspector(focus));

        var nodes;
        if (focus.kind === 'cage' || focus.kind === 'loose') {
          var birds = (focus.birdList || []).filter(function (bd) {
            var q = state.query.trim().toLowerCase();
            return !q || [bd.name, bd.band, birdShortLabel(bd)].join(' ').toLowerCase().indexOf(q) !== -1;
          });
          body.appendChild(el('p', 'loc-level', 'Birds in this ' + (focus.kind === 'cage' ? 'cage' : 'group')));
          var box = el('div', 'loc-items' + (state.present === 'grid' ? ' grid' : ''));
          birds.forEach(function (bd) { box.appendChild(item({ kind: 'bird', bird: bd }, { parent: focus.name, onOpen: function () { location.hash = '#/mybirds/birds/' + bd.id; } })); });
          body.appendChild(box);
          if (!birds.length) body.appendChild(empty(focus.directBirds ? 'No birds match.' : 'No birds here yet.'));
          return;
        }
        if (searching) {
          nodes = LocationModel.descendants(focus, model.byId).filter(function (n) { return matchesQuery(n, model) && matchesFilters(n); });
        } else {
          nodes = focus.children.filter(matchesFilters);
        }
        nodes = searching ? sortNodes(nodes) : state.sort === 'name' ? nodes : sortNodes(nodes);
        body.appendChild(el('p', 'loc-level', searching ? plural(nodes.length, 'match', 'matches') : levelLabel(focus)));
        body.appendChild(list(nodes, { paths: !!searching }));
        if (!nodes.length) body.appendChild(empty(searching ? 'Nothing matches.' : emptyText(focus)));
      }

      function levelLabel(n) {
        var kids = n.children.filter(function (c) { return c.kind !== 'loose'; });
        var kinds = {};
        kids.forEach(function (c) { kinds[c.typeLabel] = true; });
        var names = Object.keys(kinds);
        return names.length ? 'In ' + (n.kind === 'aviary' ? 'My Aviary' : n.name) : '';
      }

      function emptyText(n) {
        if (n.kind === 'aviary') return 'Nothing here yet — tap “+ Add new” to add a location, building, room or cage.';
        if (n.kind === 'room') return 'No cages in this room yet.';
        return 'Nothing in ' + n.name + ' yet — tap “+ Add new”.';
      }

      function drawTree() {
        var searching = state.query.trim() || filtersActive();
        var show = null; // when searching: matches plus the branches that lead to them
        if (searching) {
          show = {};
          LocationModel.descendants(model.root, model.byId).forEach(function (n) {
            if (matchesQuery(n, model) && matchesFilters(n)) { show[n.id] = true; LocationModel.ancestors(n, model.byId).forEach(function (a) { show[a.id] = true; }); }
          });
        }
        body.appendChild(inspector(focus));
        if (!state.treeOpened) { // first time in Tree: open every branch so the whole hierarchy is visible
          state.treeOpened = true;
          LocationModel.descendants(model.root, model.byId).forEach(function (n) { if (n.children.length) state.expanded[n.id] = true; });
        }
        var tree = el('div', 'loc-tree');
        function row(n, parentEl) {
          if (show && !show[n.id]) return;
          var node = el('div', 'loc-tree-node');
          var r = el('div', 'loc-tree-row');
          var hasKids = n.children.length > 0;
          var open = show ? true : !!state.expanded[n.id];
          var twirl = btn('loc-twirl' + (hasKids ? '' : ' none'), open ? '▾' : '▸', function () { state.expanded[n.id] = !state.expanded[n.id]; drawResults(); });
          twirl.setAttribute('aria-label', open ? 'Collapse' : 'Expand');
          twirl.disabled = !hasKids || !!show;
          r.appendChild(twirl);
          var it = item(n, { onOpen: function () { state.focus = n.id; drawResults(); } });
          if (state.focus === n.id) it.classList.add('selected');
          r.appendChild(it);
          node.appendChild(r);
          if (hasKids && open) {
            var kids = el('div', 'loc-tree-kids');
            sortChildren(n).forEach(function (c) { row(c, kids); });
            if (kids.firstChild) node.appendChild(kids);
          }
          parentEl.appendChild(node);
        }
        function sortChildren(n) { return state.sort === 'name' ? n.children : sortNodes(n.children); }
        sortChildren(model.root).forEach(function (c) { row(c, tree); });
        body.appendChild(tree);
        if (!tree.querySelector('.loc-tree-node') || (show && Object.keys(show).length === 0)) body.appendChild(empty('Nothing matches.'));
      }

      function drawAll() {
        var kinds = [['location', 'Locations'], ['building', 'Buildings'], ['room', 'Rooms'], ['cage', 'Cages']];
        var all = LocationModel.descendants(model.root, model.byId);
        var counts = {};
        kinds.forEach(function (k) { counts[k[0]] = all.filter(function (n) { return n.kind === k[0]; }).length; });
        body.appendChild(segmented(kinds.map(function (k) { return [k[0], k[1] + ' ' + counts[k[0]]]; }), state.allKind, function (k) { state.allKind = k; draw(); }, 'loc-kinds'));
        var nodes = all.filter(function (n) { return (n.kind === state.allKind || (state.allKind === 'cage' && n.kind === 'loose')) && matchesQuery(n, model) && matchesFilters(n); });
        nodes = sortNodes(nodes);
        body.appendChild(list(nodes, { paths: true }));
        if (!nodes.length) body.appendChild(empty(counts[state.allKind] ? 'Nothing matches.' : 'No ' + LocationModel.PLURAL[state.allKind] + ' yet — tap “+ Add new”.'));
      }

      function drawResults() {
        // Only the results below are redrawn, so the search box keeps its cursor.
        clearEl(body);
        scope.textContent = scopeText();
        if (state.mode === 'browse') drawBrowse();
        else if (state.mode === 'tree') drawTree();
        else drawAll();
      }
      drawResults();
    }

    draw();
  }

  function setPrefill(p) { state.prefill = p || {}; }

  return { render: render, item: item, takePrefill: takePrefill, setPrefill: setPrefill };
})();

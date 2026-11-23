// The Caging explorer: one consistent way to move around My Aviary > any place > any place inside it > … > birds.
//   Browse — drill down one level at a time, with breadcrumbs
//   Tree   — everything at once, with ▸ twirl-downs (opening a branch and selecting it are separate)
//   All    — every place in one list, wherever it sits, optionally just one kind (a dropdown)
// Browse and All can be shown as a list or as a grid; where you are is kept when you switch.
// Every entry — at any level, and the "Unassigned birds" one — is the same LocationItem.
// Built on js/location-model.js; the detail pages stay in js/screens/caging.js.
const LocationExplorer = (function () {
  var state = {
    mode: 'browse', present: 'list', focus: 'aviary:main', allType: '',
    query: '', sort: 'name', filters: { birds: false, empty: false, notSetUp: false },
    expanded: {}, prefill: null, editing: false, moveNote: null,
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

  // Small line icons for the controls (no text labels): they take their colour from the button.
  var ICON_PATHS = {
    funnel: 'M3 4h18l-7 8.5V19l-4 2v-8.5z',
    list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    expand: 'M6 5l6 6 6-6M6 13l6 6 6-6',
    collapse: 'M6 11l6-6 6 6M6 19l6-6 6 6',
    pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  };
  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'loc-icon');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICON_PATHS[name]);
    s.appendChild(p);
    return s;
  }
  function iconBtn(cls, name, label, onClick) {
    var b = btn(cls, '', onClick);
    b.appendChild(icon(name));
    b.setAttribute('aria-label', label);
    b.title = label;
    return b;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // The picture for a kind of place: the ones that ship with the app have their own; anything else gets the cage picture.
  var TYPE_ICONS = { location: 'icons/places/location.svg', building: 'icons/places/building.svg', room: 'icons/places/room.svg' };
  function iconFor(node) {
    if (node.kind === 'aviary') return 'icons/places/aviary.svg';
    if (node.kind === 'loose') return 'icons/places/birds.svg';
    return TYPE_ICONS[String(node.type).toLowerCase()] || 'icons/tinted/aviary/Caging.png';
  }

  // ---- the one item component --------------------------------------------------------------

  function thumbFor(node) {
    var photo = node.kind === 'loose' ? '' : mediaMainPhotoUrl(node.kind === 'aviary' ? 'aviary' : 'place', node.key);
    return makeThumb(photo ? { src: photo } : { icon: iconFor(node) });
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
    else sub = node.kind === 'loose' ? 'No place set' : node.kind === 'place' ? (node.children.length ? LocationModel.countsLine(node) : [node.typeLabel, node.record && node.record.description].filter(Boolean).join(' · ')) : LocationModel.countsLine(node);
    info.appendChild(el('span', 'loc-sub', sub));
    b.appendChild(info);

    // Grid cards: the parent's name lower left, what's inside lower right.
    var foot = el('span', 'loc-foot');
    foot.appendChild(el('span', 'loc-parent', opts.parent || ''));
    foot.appendChild(el('span', 'loc-contents', node.kind === 'bird' ? '' : contentsLabel(node)));
    b.appendChild(foot);

    if (node.kind !== 'bird') {
      var n = node.kind === 'loose' ? node.directBirds : node.birds;
      b.appendChild(el('span', 'loc-badge', n ? plural(n, 'bird', 'birds') : 'Empty'));
      b.appendChild(el('span', 'loc-chev', '›'));
    }
    if (opts.onOpen) b.addEventListener('click', opts.onOpen);
    return b;
  }

  // In a card, just the one number that matters: "3 Cages", "5 items", "2 birds", or "Empty".
  function contentsLabel(n) {
    if (n.kind === 'loose') return n.directBirds ? plural(n.directBirds, 'bird', 'birds') : 'Empty';
    var kids = n.children.filter(function (c) { return c.kind !== 'loose'; });
    if (!kids.length) return n.directBirds ? plural(n.directBirds, 'bird', 'birds') : 'Empty';
    var kinds = {};
    kids.forEach(function (c) { kinds[c.type] = (kinds[c.type] || 0) + 1; });
    var ks = Object.keys(kinds);
    return ks.length === 1 ? kids.length + ' ' + LocationModel.pluralType(placeTypeLabel(ks[0]), kids.length) : plural(kids.length, 'item', 'items');
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
    var hasBirds = node.kind === 'loose' ? node.directBirds > 0 : node.birds > 0;
    if (f.birds && !hasBirds) return false;
    if (f.empty && (hasBirds || node.kind === 'loose')) return false;
    if (f.notSetUp && node.setUp !== false) return false;
    return true;
  }

  function filtersActive() {
    var f = state.filters;
    return f.birds || f.empty || f.notSetUp;
  }

  function sortNodes(list) {
    var out = list.slice();
    if (state.sort === 'birds') {
      out.sort(function (a, b) { return (b.birds || 0) - (a.birds || 0) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    } else if (state.sort === 'items') {
      var size = function (n) { return n.counts.places || 0; };
      out.sort(function (a, b) { return size(b) - size(a) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    } else {
      out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    }
    return out;
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
      return node.key;
    }

    // Add a place: opens the form with where it goes and a suggested kind already filled in (both can be changed).
    function startAdd(prefill) {
      state.prefill = prefill || {};
      navigate('new');
    }

    function openFilters() {
      Modal.open({
        title: 'Filter',
        build: function (body, close) {
          var rows = [['birds', 'Has birds', ''], ['empty', 'Empty — no birds', ''], ['notSetUp', 'Not set up yet', 'Names used on birds that aren’t set up as a place']];
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
          body.appendChild(btn('add-record-btn', 'Clear filters', function () { state.filters = { birds: false, empty: false, notSetUp: false }; close(); draw(); }));
        },
      });
    }

    function segmented(options, current, onPick, cls) {
      var seg = el('div', 'loc-seg' + (cls ? ' ' + cls : ''));
      options.forEach(function (o) {
        var b = btn('loc-seg-btn' + (o[0] === current ? ' active' : ''), typeof o[1] === 'string' ? o[1] : '', function () { onPick(o[0]); });
        if (typeof o[1] !== 'string') { b.appendChild(icon(o[1].icon)); b.setAttribute('aria-label', o[1].label); b.title = o[1].label; }
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
      var line = node.kind === 'loose' ? 'Birds with no place set' : node.kind === 'place' && !node.children.length ? [node.typeLabel, node.record && node.record.description].filter(Boolean).join(' · ') : LocationModel.countsLine(node);
      info.appendChild(el('span', 'loc-sub', line));
      var n = node.kind === 'loose' ? node.directBirds : node.birds;
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

      // 2. one search box, with Add new beside it
      var bar = el('div', 'loc-searchbar');
      var sbox = ListTools.searchBox({ query: state.query });
      var search = sbox.input;
      search.classList.add('loc-search');
      search.placeholder = state.mode === 'browse' ? 'Search ' + (focus.kind === 'aviary' ? 'My Aviary' : focus.name) + '…' : state.mode === 'tree' ? 'Search ' + model.root.name + '…' : 'Search all ' + (state.allType ? LocationModel.pluralType(placeTypeLabel(state.allType), 2).toLowerCase() : 'places') + '…';
      search.addEventListener('input', function (e) { state.query = e.target.value; drawResults(); });
      bar.appendChild(sbox.box);
      var addParent = state.mode === 'all' ? '' : focus.kind === 'place' ? focus.key : '';
      if (state.mode !== 'tree' || state.editing) bar.appendChild(btn('loc-add', '+ Add new', function () { startAdd({ parentId: addParent, type: state.mode === 'all' && state.allType ? state.allType : suggestedPlaceType(addParent) }); }));
      if (state.mode === 'tree') {
        // The pencil (as on the Home Screen) turns edit mode on; in edit mode "+ Add new" appears beside it, and items can be dragged, renamed or deleted.
        var edit = btn('loc-edit-inline' + (state.editing ? ' on' : ''), state.editing ? '✓' : '✎', function () {
          state.editing = !state.editing;
          state.moveNote = null;
          if (state.editing) LocationModel.descendants(model.root).forEach(function (n) { if (n.children.length) state.expanded[n.id] = true; });
          draw();
        });
        edit.setAttribute('aria-label', state.editing ? 'Done editing' : 'Edit the tree');
        edit.title = state.editing ? 'Done' : 'Edit — move, rename or delete items';
        bar.appendChild(edit);
      }
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
      var activeCount = ['birds', 'empty', 'notSetUp'].filter(function (k) { return state.filters[k]; }).length;
      var filterBtn = iconBtn('loc-filter-btn' + (activeCount ? ' on' : ''), 'funnel', activeCount ? 'Filter — ' + activeCount + ' on' : 'Filter', openFilters);
      if (activeCount) filterBtn.appendChild(el('span', 'loc-filter-count', String(activeCount)));
      ctl.appendChild(filterBtn);
      // Browse / Tree / All, small, in the middle
      ctl.appendChild(segmented([['browse', 'Browse'], ['tree', 'Tree'], ['all', 'All']], state.mode, function (m) { state.mode = m; state.editing = false; state.moveNote = null; draw(); }, 'loc-modes-mini'));
      if (state.mode === 'tree') {
        var group = el('div', 'loc-seg loc-present');
        group.appendChild(iconBtn('loc-seg-btn', 'expand', 'Expand all', function () { LocationModel.descendants(model.root).forEach(function (n) { if (n.children.length) state.expanded[n.id] = true; }); state.expanded[model.root.id] = true; drawResults(); }));
        group.appendChild(iconBtn('loc-seg-btn', 'collapse', 'Collapse all', function () { state.expanded = {}; drawResults(); }));
        ctl.appendChild(group);
      } else {
        ctl.appendChild(segmented([['list', { icon: 'list', label: 'List' }], ['grid', { icon: 'grid', label: 'Grid' }]], state.present, function (p) { state.present = p; draw(); }, 'loc-present'));
      }
      wrap.appendChild(ctl);

      // 4. active filters, and what the search covers
      var chips = el('div', 'loc-chips');
      var labels = { birds: 'Has birds', empty: 'Empty', notSetUp: 'Not set up' };
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
        return searching ? 'Looking through all ' + (state.allType ? LocationModel.pluralType(placeTypeLabel(state.allType), 2).toLowerCase() : 'places') + ', wherever they are.' : '';
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
        var q0 = state.query.trim().toLowerCase();
        var hereBirds = (focus.birdList || []).filter(function (bd) { return !q0 || [bd.name, bd.band, birdShortLabel(bd)].join(' ').toLowerCase().indexOf(q0) !== -1; });
        if (focus.kind === 'loose') {
          body.appendChild(el('p', 'loc-level', 'Birds with no place'));
          var lbox = el('div', 'loc-items' + (state.present === 'grid' ? ' grid' : ''));
          hereBirds.forEach(function (bd) { lbox.appendChild(item({ kind: 'bird', bird: bd }, { parent: focus.name, onOpen: function () { location.hash = '#/mybirds/birds/' + bd.id; } })); });
          body.appendChild(lbox);
          if (!hereBirds.length) body.appendChild(empty(focus.directBirds ? 'No birds match.' : 'No birds here yet.'));
          return;
        }
        if (searching) {
          nodes = LocationModel.descendants(focus).filter(function (n) { return matchesQuery(n, model) && matchesFilters(n); });
        } else {
          nodes = focus.children.filter(matchesFilters);
        }
        nodes = searching ? sortNodes(nodes) : state.sort === 'name' ? nodes : sortNodes(nodes);
        if (nodes.length || !hereBirds.length) {
          body.appendChild(el('p', 'loc-level', searching ? plural(nodes.length, 'match', 'matches') : levelLabel(focus)));
          body.appendChild(list(nodes, { paths: !!searching }));
          if (!nodes.length) body.appendChild(empty(searching ? 'Nothing matches.' : emptyText(focus)));
        }
        if (hereBirds.length && focus.kind === 'place') { // birds kept directly in this place (a place can hold both places and birds)
          body.appendChild(el('p', 'loc-level', 'Birds here'));
          var bbox = el('div', 'loc-items' + (state.present === 'grid' ? ' grid' : ''));
          hereBirds.forEach(function (bd) { bbox.appendChild(item({ kind: 'bird', bird: bd }, { parent: focus.name, onOpen: function () { location.hash = '#/mybirds/birds/' + bd.id; } })); });
          body.appendChild(bbox);
        }
      }

      function levelLabel(n) {
        var kids = n.children.filter(function (c) { return c.kind !== 'loose'; });
        return kids.length ? 'In ' + (n.kind === 'aviary' ? 'My Aviary' : n.name) : '';
      }

      function emptyText(n) {
        if (n.kind === 'aviary') return 'Nothing here yet — tap “+ Add new” to add your first place: a building, room, coop, cage, shelf or something of your own.';
        return 'Nothing in ' + n.name + ' yet — tap “+ Add new”.';
      }

      function drawTree() {
        var searching = state.query.trim() || filtersActive();
        var show = null; // when searching: matches plus the branches that lead to them
        if (searching) {
          show = {};
          LocationModel.descendants(model.root).forEach(function (n) {
            if (matchesQuery(n, model) && matchesFilters(n)) { show[n.id] = true; LocationModel.ancestors(n, model.byId).forEach(function (a) { show[a.id] = true; }); }
          });
        }
        if (state.moveNote) {
          var note = el('div', 'loc-move-note');
          note.appendChild(el('span', '', state.moveNote.text));
          if (state.moveNote.undo) note.appendChild(btn('pick-link', 'Undo', function () { var u = state.moveNote.undo; state.moveNote = null; u(); }));
          body.appendChild(note);
        }
        if (!state.editing) body.appendChild(inspector(focus));
        if (!state.treeOpened) { // first time in Tree: open every branch so the whole hierarchy is visible
          state.treeOpened = true;
          LocationModel.descendants(model.root).forEach(function (n) { if (n.children.length) state.expanded[n.id] = true; });
        }
        var tree = el('div', 'loc-tree' + (state.editing ? ' editing' : ''));
        function row(n, parentEl) {
          if (show && !show[n.id]) return;
          var node = el('div', 'loc-tree-node');
          var r = el('div', 'loc-tree-row');
          r.dataset.id = n.id;
          var hasKids = n.children.length > 0;
          var open = show ? true : !!state.expanded[n.id];
          if (hasKids && open) r.dataset.open = '1';
          var twirl = btn('loc-twirl' + (hasKids ? '' : ' none'), open ? '▾' : '▸', function () { state.expanded[n.id] = !state.expanded[n.id]; drawResults(); });
          twirl.setAttribute('aria-label', open ? 'Collapse' : 'Expand');
          twirl.disabled = !hasKids || !!show;
          if (hasKids && open) r.appendChild(el('span', 'loc-stem'));
          r.appendChild(twirl);
          var it = item(n, { onOpen: function () { state.focus = n.id; drawResults(); } });
          if (state.focus === n.id) it.classList.add('selected');
          if (state.editing) {
            var chev = it.querySelector('.loc-chev');
            if (chev) {
              var tools = el('span', 'loc-tools');
              if (n.kind === 'place') tools.appendChild(toolBtn('pencil', 'Rename', function () { renameNode(n); }));
              if (n.kind === 'place' && n.setUp !== false) tools.appendChild(toolBtn('trash', 'Delete', function () { deleteNode(n); }));
              if (n.kind === 'place') { var hd = el('span', 'loc-handle', '≡'); hd.dataset.id = n.id; hd.addEventListener('click', function (e) { e.stopPropagation(); }); tools.appendChild(hd); }
              chev.parentNode.replaceChild(tools, chev);
            }
          }
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

      // ---- rename and delete in edit mode ----
      function toolBtn(name, label, onClick) {
        var b = el('span', 'loc-act');
        b.setAttribute('role', 'button');
        b.tabIndex = 0;
        b.setAttribute('aria-label', label);
        b.title = label;
        b.appendChild(icon(name));
        b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
        return b;
      }

      function renameNode(n) {
        if (!n.setUp) { navigate('new~' + n.key); return; } // a name that's only on birds: set it up as a place first
        var current = n.record.name;
        Modal.open({
          title: 'Rename ' + n.typeLabel.toLowerCase(),
          build: function (mbody, close) {
            var inp = el('input', 'form-input');
            inp.value = current;
            var msg = el('div');
            var go = btn('save-btn', 'Save', function () {
              var v = inp.value.trim();
              if (!v) { clearEl(msg); msg.appendChild(el('p', 'form-message error', 'Give it a name.')); return; }
              go.disabled = true;
              updateRecord('places', n.key, { name: v }).then(function () { close(); state.moveNote = { text: 'Renamed to “' + v + '”.' }; draw(); }).catch(function (err) { go.disabled = false; clearEl(msg); msg.appendChild(el('p', 'form-message error', err.message)); });
            });
            mbody.appendChild(inp);
            mbody.appendChild(msg);
            mbody.appendChild(go);
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
            setTimeout(function () { inp.focus(); inp.select(); }, 50);
          },
        });
      }

      function deleteNode(n) {
        var inside = n.children.filter(function (c) { return c.kind !== 'loose'; }).length;
        var note = (inside ? ' What’s inside it (' + inside + ') moves up one level.' : '') + (n.directBirds ? ' The ' + n.directBirds + ' bird' + (n.directBirds === 1 ? '' : 's') + ' in it will be left with no place.' : '');
        Modal.confirm({
          title: 'Delete ' + n.typeLabel.toLowerCase() + '?', message: 'Delete “' + n.name + '”?' + note + ' This can’t be undone.', confirmLabel: 'Delete', danger: true,
          onConfirm: function () { deleteRecord('places', n.key).then(function () { state.moveNote = { text: 'Deleted ' + n.name + '.' }; draw(); }).catch(failMove); },
        });
      }

      // ---- drag and drop in edit mode (pointer events, so it works on touch too) ----
      var drag = null;
      // Can `node` live directly under `parent` (a place, or My Aviary itself meaning "no parent")? Staying put doesn't count.
      // Anything can go inside anything — except into itself, or into something that's inside it (that would be a loop).
      function canDrop(node, parent) {
        if (!node || !parent || parent.id === node.id) return false;
        if (parent.id === node.parentId) return false;
        if (parent.kind === 'loose') return false;
        return LocationModel.ancestors(parent, model.byId).every(function (a) { return a.id !== node.id; });
      }

      // Where would a drop at this point go? Over the middle of a row it goes into that row; near its top or bottom edge, or in
      // the gap between rows, it goes beside it — under the same parent (or, below an open branch, as its first child).
      // -> { parent, line: { y, left, width } | null, zone: row element to outline | null }
      function targetAt(x, y) {
        var rows = Array.prototype.filter.call(body.querySelectorAll('.loc-tree-row'), function (r) { return !drag.rowEl.contains(r) || r === drag.rowEl; });
        if (!rows.length) return null;
        var tree = body.querySelector('.loc-tree').getBoundingClientRect();
        var hit = null;
        for (var i = 0; i < rows.length; i++) {
          var rc = rows[i].getBoundingClientRect();
          var nextTop = i + 1 < rows.length ? rows[i + 1].getBoundingClientRect().top : rc.bottom + 12;
          if (y >= (i === 0 ? -Infinity : rc.top - 5) && y < nextTop - 5) { hit = { row: rows[i], rc: rc }; break; }
        }
        if (!hit) hit = { row: rows[rows.length - 1], rc: rows[rows.length - 1].getBoundingClientRect() };
        var node = model.byId[hit.row.dataset.id];
        var itemRect = hit.row.querySelector('.loc-item').getBoundingClientRect();
        var rel = (y - hit.rc.top) / hit.rc.height;
        var parent, lineY, left = itemRect.left;
        if (rel >= 0.28 && rel <= 0.72 && node.id !== drag.node.id) return { parent: node, line: null, zone: hit.row };
        if (rel < 0.28) { parent = model.byId[node.parentId]; lineY = hit.rc.top - 4; }
        else if (hit.row.dataset.open === '1' && node.id !== drag.node.id) { parent = node; lineY = hit.rc.bottom + 4; left = itemRect.left + 22; }
        else { parent = model.byId[node.parentId]; lineY = hit.rc.bottom + 4; }
        return { parent: parent, line: { y: lineY - tree.top, left: left - tree.left, width: itemRect.width - (left - itemRect.left) }, zone: null };
      }

      body.addEventListener('pointerdown', function (e) {
        var h = e.target.closest && e.target.closest('.loc-handle');
        if (!h || !state.editing) return;
        var node = model.byId[h.dataset.id];
        var rowEl = h.closest('.loc-tree-row');
        var rect = rowEl.getBoundingClientRect();
        var itemEl = rowEl.querySelector('.loc-item');
        var irect = itemEl.getBoundingClientRect();
        var ghost = itemEl.cloneNode(true);
        ghost.classList.add('loc-ghost');
        ghost.style.width = irect.width + 'px';
        ghost.style.left = irect.left + 'px';
        ghost.style.top = irect.top + 'px';
        document.body.appendChild(ghost);
        rowEl.classList.add('drag-source');
        drag = { node: node, ghost: ghost, rowEl: rowEl, dx: e.clientX - irect.left, dy: e.clientY - irect.top, over: null };
        body.classList.add('dragging-now');
        e.preventDefault();
      });

      function clearMarks() {
        Array.prototype.forEach.call(body.querySelectorAll('.drop-ok'), function (z) { z.classList.remove('drop-ok'); });
        var old = body.querySelector('.loc-insert');
        if (old) old.parentNode.removeChild(old);
      }

      function markTargets(t) {
        clearMarks();
        drag.over = null;
        if (!t || !canDrop(drag.node, t.parent)) return;
        drag.over = t.parent;
        if (t.zone) t.zone.classList.add('drop-ok');
        if (t.line) {
          var bar = el('div', 'loc-insert');
          bar.style.top = t.line.y + 'px';
          bar.style.left = t.line.left + 'px';
          bar.style.width = t.line.width + 'px';
          body.querySelector('.loc-tree').appendChild(bar);
        }
      }

      function onMove(e) {
        if (!drag) return;
        drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
        drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
        if (e.clientY < 90) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
        markTargets(targetAt(e.clientX, e.clientY));
      }

      function onUp() {
        if (!drag) return;
        var d = drag;
        drag = null;
        d.ghost.parentNode.removeChild(d.ghost);
        d.rowEl.classList.remove('drag-source');
        body.classList.remove('dragging-now');
        clearMarks();
        if (d.over) moveNode(d.node, d.over);
      }
      if (state.unbind) state.unbind(); // one set of listeners at a time, however often the tree is redrawn
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      state.unbind = function () { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };

      function moveNode(node, target) {
        var to = target.kind === 'aviary' ? '' : target.key;
        var from = node.parentId === 'aviary:main' ? '' : (model.byId[node.parentId] || {}).key || '';
        var where = target.kind === 'aviary' ? 'out of its parent' : 'to ' + target.name;
        movePlace(node.key, to).then(function () {
          state.moveNote = { text: 'Moved ' + node.name + ' ' + where + '.', undo: function () { movePlace(node.key, from).then(function () { state.moveNote = { text: 'Put ' + node.name + ' back.' }; draw(); }).catch(failMove); } };
          draw();
        }).catch(failMove);
      }

      function failMove(err) { state.moveNote = { text: (err && err.message) || 'That didn’t move — try again.' }; draw(); }

      function drawAll() {
        var all = LocationModel.descendants(model.root).filter(function (n) { return n.kind === 'place'; });
        var counts = {};
        all.forEach(function (n) { counts[n.type] = (counts[n.type] || 0) + 1; });
        // a dropdown of the kinds of place you actually have (with how many of each)
        var pick = el('select', 'form-input loc-type-select');
        pick.setAttribute('aria-label', 'Kind of place');
        var allOpt = el('option', '', 'All places (' + all.length + ')'); allOpt.value = ''; pick.appendChild(allOpt);
        placeTypes().filter(function (t) { return counts[t] || t === state.allType; }).forEach(function (t) {
          var o = el('option', '', LocationModel.pluralType(placeTypeLabel(t), 2) + ' (' + (counts[t] || 0) + ')'); o.value = t; pick.appendChild(o);
        });
        pick.value = state.allType;
        pick.addEventListener('change', function () { state.allType = pick.value; draw(); });
        body.appendChild(pick);
        var nodes = all.filter(function (n) { return (!state.allType || n.type === state.allType) && matchesQuery(n, model) && matchesFilters(n); });
        nodes = sortNodes(nodes);
        body.appendChild(list(nodes, { paths: true }));
        if (!nodes.length) body.appendChild(empty(all.length ? 'Nothing matches.' : 'No places yet — tap “+ Add new”.'));
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

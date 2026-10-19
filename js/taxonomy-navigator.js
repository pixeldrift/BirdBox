// A taxonomy navigator: walk down Order › Family › Genus › Species and see how many species each
// holds, how many are commonly kept in aviculture, and how many of your own birds are in it.
// With onSelect it's a species chooser (tap a species to pick it); without, it's for browsing, and
// tapping a species opens its Birds of the World page.
//
//   TaxonomyNavigator.open({ start: { order, family, genus }, onSelect: function (species) {}, title })
const TaxonomyNavigator = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // How many of your birds fall in each group, from what the birds already carry.
  function flockCount(kind, name) {
    return BIRDS_SAMPLE.filter(function (b) {
      if (kind === 'order') return b.order === name;
      if (kind === 'family') return b.family === name;
      if (kind === 'genus') return b.scientificName && b.scientificName.split(' ')[0] === name;
      return false;
    }).length;
  }

  // A picture for a group or species: the icon the active icon pack uses for that part of the tree.
  function taxonIcon(kind, g, context) {
    var fake = { scientificName: 'x x', order: context.order || '', familyScientific: '' };
    if (kind === 'order') fake.order = g.name;
    if (kind === 'family') { fake.familyScientific = g.scientific || ''; fake.scientificName = 'x x'; }
    if (kind === 'genus') fake.scientificName = g.name + ' x';
    return resolveBirdIcon(fake);
  }

  var NEXT = { root: 'order', order: 'family', family: 'genus', genus: 'species' };
  var LEVEL_LABEL = { order: 'Orders', family: 'Families', genus: 'Genera', species: 'Species' };

  function open(opts) {
    opts = opts || {};
    var state = { path: [], kept: true }; // path: [{ kind, value }] of the levels opened so far
    var s = opts.start || {};
    if (s.order) state.path.push({ kind: 'order', value: s.order });
    if (s.order && s.family) state.path.push({ kind: 'family', value: s.family });
    if (s.order && s.family && s.genus) state.path.push({ kind: 'genus', value: s.genus });

    Modal.open({
      title: opts.title || 'Taxonomy',
      fixedHeight: true, // the popup keeps its size however many members a level has
      build: function (body, close) {
        var bar = el('div', 'nav-bar');
        var up = el('button', 'nav-up', '↑ Up one level');
        up.type = 'button';
        var scope = el('div', 'filter-chips');
        bar.appendChild(up);
        bar.appendChild(scope);
        var crumbs = el('div', 'picker-crumbs nav-crumbs');
        var list = el('div', 'pick-results nav-list');
        [bar, crumbs, list].forEach(function (e) { body.appendChild(e); });
        up.addEventListener('click', function () { if (state.path.length) { state.path.pop(); draw(); } });

        function drawCrumbs() {
          clearEl(crumbs);
          up.disabled = !state.path.length;
          var all = el('button', 'pick-link', 'All orders');
          all.type = 'button';
          all.addEventListener('click', function () { state.path = []; draw(); });
          crumbs.appendChild(all);
          state.path.forEach(function (p, i) {
            crumbs.appendChild(el('span', 'crumb-sep', '›'));
            var c = el('button', 'pick-link', p.value);
            c.type = 'button';
            c.addEventListener('click', function () { state.path = state.path.slice(0, i + 1); draw(); });
            crumbs.appendChild(c);
          });
        }

        function drawScope() {
          clearEl(scope);
          [[true, 'Commonly kept'], [false, 'All species']].forEach(function (o) {
            var chip = el('button', 'filter-chip' + (state.kept === o[0] ? ' active' : ''), o[1]);
            chip.type = 'button';
            chip.addEventListener('click', function () { state.kept = o[0]; draw(); });
            scope.appendChild(chip);
          });
        }

        function groupRow(kind, g) {
          var row = el('button', 'pick-option');
          row.type = 'button';
          var yours = flockCount(kind, g.name);
          var title = g.name + (g.scientific && g.scientific !== g.name ? ' — ' + g.scientific : '');
          var sub = (state.kept ? g.species + ' commonly kept' : g.species + ' species' + (g.kept ? ' · ' + g.kept + ' commonly kept' : '')) + (yours ? ' · ' + yours + ' of yours' : '');
          var ctx = { order: (state.path.filter(function (p) { return p.kind === 'order'; })[0] || {}).value };
          row.appendChild(pickLead(makeThumb({ icon: taxonIcon(kind, g, ctx) }), title, sub));
          row.appendChild(el('span', 'pick-chevron', '›'));
          row.addEventListener('click', function () { state.path.push({ kind: kind, value: g.name }); draw(); });
          return row;
        }

        function speciesRow(sp) {
          var row = el('button', 'pick-option');
          row.type = 'button';
          var mine = BIRDS_SAMPLE.filter(function (b) { return b.speciesCode === sp.code; }).length;
          row.appendChild(pickLead(makeThumb({ icon: resolveBirdIcon({ speciesCode: sp.code, scientificName: sp.scientificName, order: sp.order, species: sp.name }) }), sp.name, sp.scientificName + (mine ? ' · ' + mine + ' of yours' : '')));
          if (opts.onSelect) {
            row.addEventListener('click', function () { opts.onSelect(sp); close(); });
          } else {
            row.appendChild(el('span', 'pick-chevron', '↗'));
            row.addEventListener('click', function () { window.open(sp.birdsOfTheWorldUrl, '_blank', 'noopener'); });
          }
          return row;
        }

        function draw() {
          drawCrumbs();
          drawScope();
          clearEl(list);
          var last = state.path.length ? state.path[state.path.length - 1] : { kind: 'root', value: '' };
          list.appendChild(el('p', 'pick-empty', 'Loading…'));
          SpeciesApi.tree(last.kind, last.value, state.kept).then(function (rows) {
            clearEl(list);
            var next = NEXT[last.kind];
            list.appendChild(el('p', 'form-note', LEVEL_LABEL[next] + (last.value ? ' in ' + last.value : '')));
            if (!rows.length) list.appendChild(el('p', 'pick-empty', state.kept ? 'Nothing commonly kept here — try “All species”.' : 'Nothing here.'));
            rows.forEach(function (r) { list.appendChild(next === 'species' ? speciesRow(r) : groupRow(next, r)); });
          }).catch(function () {
            clearEl(list);
            list.appendChild(el('p', 'form-message error', 'Couldn’t load the taxonomy — check your connection and try again.'));
          });
        }
        draw();
      },
    });
  }

  return { open: open };
})();

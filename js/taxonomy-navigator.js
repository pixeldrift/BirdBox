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
      build: function (body, close) {
        var crumbs = el('div', 'picker-crumbs');
        var scope = el('div', 'filter-chips');
        var list = el('div', 'pick-results');
        [crumbs, scope, list].forEach(function (e) { body.appendChild(e); });

        function drawCrumbs() {
          clearEl(crumbs);
          var all = el('button', 'pick-link', 'All orders');
          all.type = 'button';
          all.addEventListener('click', function () { state.path = []; draw(); });
          crumbs.appendChild(all);
          state.path.forEach(function (p, i) {
            crumbs.appendChild(el('span', 'form-note', '›'));
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
          var text = el('span', 'pick-text');
          text.appendChild(el('span', '', g.name + (g.scientific && g.scientific !== g.name ? ' — ' + g.scientific : '')));
          var sub = (state.kept ? g.species + ' commonly kept' : g.species + ' species' + (g.kept ? ' · ' + g.kept + ' commonly kept' : '')) + (yours ? ' · ' + yours + ' of yours' : '');
          text.appendChild(el('small', '', sub));
          row.appendChild(text);
          row.appendChild(el('span', 'pick-chevron', '›'));
          row.addEventListener('click', function () { state.path.push({ kind: kind, value: g.name }); draw(); });
          return row;
        }

        function speciesRow(sp) {
          var row = el('button', 'pick-option');
          row.type = 'button';
          var mine = BIRDS_SAMPLE.filter(function (b) { return b.speciesCode === sp.code; }).length;
          row.appendChild(pickLead(makeThumb({ icon: 'icons/Birds.png' }), sp.name, sp.scientificName + (mine ? ' · ' + mine + ' of yours' : '')));
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

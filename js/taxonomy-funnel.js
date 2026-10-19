// The species box's taxonomy "funnel": the common name large and orange, the scientific name of the
// level you're looking at under a "Species:" label with ◀ ▶ arrows to step to the neighbouring
// group at that level, and a tapering row of circles — Ord · Fam · Gen · Spe · Sub · Mut — to jump
// between levels. Sub and Mut are greyed out when the bird has no subspecies / mutation.
//
//   TaxonomyFunnel.create(bird) -> element
const TaxonomyFunnel = (function () {
  var ORANGE = '#E8912D';
  var LEVELS = [
    { key: 'order', abbr: 'Ord', label: 'Order', r: 22 },
    { key: 'family', abbr: 'Fam', label: 'Family', r: 17 },
    { key: 'genus', abbr: 'Gen', label: 'Genus', r: 13 },
    { key: 'species', abbr: 'Spe', label: 'Species', r: 9 },
    { key: 'sub', abbr: 'Sub', label: 'Subspecies', r: 6 },
    { key: 'mut', abbr: 'Mut', label: 'Mutation', r: 4 },
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function svg(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function create(bird) {
    var root = el('div', 'funnel');
    var genus = bird.scientificName ? bird.scientificName.split(' ')[0] : '';
    // What we're looking at. `home` is the bird's own species; stepping to a neighbour leaves it.
    var focus = {
      order: bird.order || '', family: bird.family || '', familySci: bird.familyScientific || '', genus: genus,
      species: bird.speciesCode ? { code: bird.speciesCode, name: bird.speciesName, sci: bird.scientificName, url: bird.birdsOfTheWorldUrl } : null,
      home: true,
    };
    var level = 'species';
    var siblings = {}; // level -> list, fetched when you step

    var head = el('div', 'funnel-common');
    var label = el('div', 'funnel-label');
    var row = el('div', 'funnel-row');
    var prev = el('button', 'funnel-arrow', '◀');
    var value = el('div', 'funnel-value');
    var main = el('div', 'funnel-main');
    main.appendChild(value);
    main.appendChild(label);
    var next = el('button', 'funnel-arrow', '▶');
    [prev, next].forEach(function (b) { b.type = 'button'; });
    row.appendChild(prev);
    row.appendChild(main);
    row.appendChild(next);
    var graphic = el('div', 'funnel-graphic');
    var note = el('div', 'funnel-note');
    root.appendChild(el('h3', 'funnel-title', 'Taxonomy'));
    root.appendChild(head);
    root.appendChild(row);
    root.appendChild(graphic);
    root.appendChild(note);

    function available(key) {
      if (key === 'order') return !!focus.order;
      if (key === 'family') return !!focus.family;
      if (key === 'genus') return !!focus.genus;
      if (key === 'species') return !!focus.species;
      if (key === 'sub') return focus.home && !!bird.subspecies;
      if (key === 'mut') return focus.home && !!bird.mutation;
      return false;
    }

    // [common/English name, scientific/main name] for a level.
    function names(key) {
      if (key === 'order') return [focus.order, focus.order];
      if (key === 'family') return [focus.family, focus.familySci || focus.family];
      if (key === 'genus') return [focus.genus, focus.genus];
      if (key === 'species') return focus.species ? [focus.home ? (bird.mutation ? bird.mutation + ' ' : '') + focus.species.name : focus.species.name, focus.species.sci] : ['', ''];
      if (key === 'sub') return [bird.subspecies, bird.subspecies];
      return [bird.mutation, bird.mutation];
    }

    function drawText() {
      var n = names(level);
      var info = LEVELS.filter(function (l) { return l.key === level; })[0];
      head.textContent = n[0] || '—';
      label.textContent = info.label;
      value.textContent = n[1] || '—';
      value.classList.toggle('sci', level === 'species' || level === 'genus');
      var canStep = level !== 'sub' && level !== 'mut';
      prev.disabled = !canStep;
      next.disabled = !canStep;
      clearEl(note);
      if (level === 'species' && focus.species && focus.species.url) {
        var link = el('a', 'ext-link', 'Learn more at Birds of the World ↗');
        link.href = focus.species.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        note.appendChild(link);
      }
      var browse = el('button', 'pick-link', 'Browse the taxonomy');
      browse.type = 'button';
      browse.addEventListener('click', function () {
        TaxonomyNavigator.open({ title: 'Taxonomy', start: { order: focus.order, family: focus.family, genus: focus.genus } });
      });
      note.appendChild(browse);
    }

    // The tapering row of circles.
    function drawGraphic() {
      clearEl(graphic);
      var W = 300, H = 74, cy = 30, pad = 28;
      var step = (W - pad * 2) / (LEVELS.length - 1);
      var xs = LEVELS.map(function (l, i) { return pad + i * step; });
      var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'funnel-svg', role: 'group', 'aria-label': 'Taxonomy level' });
      // the taper behind the circles
      var top = LEVELS.map(function (l, i) { return xs[i] + ',' + (cy - l.r * 0.8); });
      var bottom = LEVELS.map(function (l, i) { return xs[LEVELS.length - 1 - i] + ',' + (cy + LEVELS[LEVELS.length - 1 - i].r * 0.8); });
      s.appendChild(svg('polygon', { points: top.concat(bottom).join(' '), fill: '#111' }));
      LEVELS.forEach(function (l, i) {
        var on = available(l.key);
        var sel = l.key === level;
        var g = svg('g', { role: 'button', tabindex: on ? '0' : '-1', 'aria-label': l.label, style: on ? 'cursor:pointer' : '' });
        // A level with nothing to show is a solid black dot, like the narrow end of the funnel.
        g.appendChild(svg('circle', { cx: xs[i], cy: cy, r: l.r, fill: on ? '#fff' : '#111', stroke: '#111', 'stroke-width': l.r > 8 ? 4 : 3 }));
        if (sel) g.appendChild(svg('circle', { cx: xs[i], cy: cy, r: Math.max(3, l.r * 0.45), fill: ORANGE }));
        var t = svg('text', { x: xs[i], y: 68, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: sel ? ORANGE : '#111' });
        t.textContent = l.abbr;
        g.appendChild(t);
        if (on) {
          g.addEventListener('click', function () { level = l.key; drawAll(); });
          g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { level = l.key; drawAll(); e.preventDefault(); } });
        }
        s.appendChild(g);
      });
      graphic.appendChild(s);
    }

    function drawAll() { drawText(); drawGraphic(); }

    // Step to the neighbouring group at the current level (the lower levels are cleared, since they
    // belonged to the group we left).
    function step(dir) {
      var key = level;
      var load = siblings[key] ? Promise.resolve(siblings[key]) : listSiblings(key).then(function (list) { siblings[key] = list; return list; });
      load.then(function (list) {
        if (!list.length) return;
        var here = list.findIndex(function (it) { return key === 'species' ? (focus.species && it.code === focus.species.code) : it.name === focus[key]; });
        var it = list[((here < 0 ? 0 : here) + dir + list.length) % list.length];
        focus.home = false;
        siblings = { }; siblings[key] = list;
        if (key === 'order') { focus.order = it.name; focus.family = ''; focus.familySci = ''; focus.genus = ''; focus.species = null; }
        if (key === 'family') { focus.family = it.name; focus.familySci = it.scientific || ''; focus.genus = ''; focus.species = null; }
        if (key === 'genus') { focus.genus = it.name; focus.species = null; }
        if (key === 'species') { focus.species = { code: it.code, name: it.name, sci: it.scientificName, url: it.birdsOfTheWorldUrl }; focus.genus = it.scientificName.split(' ')[0]; }
        drawAll();
      }).catch(function () {
        clearEl(note);
        note.appendChild(el('span', 'form-note', 'Couldn’t load the neighbouring groups — check your connection.'));
      });
    }

    function listSiblings(key) {
      if (key === 'order') return SpeciesApi.tree('root', '', false);
      if (key === 'family') return SpeciesApi.tree('order', focus.order, false);
      if (key === 'genus') return SpeciesApi.tree('family', focus.family, false);
      return SpeciesApi.tree('genus', focus.genus, false);
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    drawAll();
    return root;
  }

  return { create: create };
})();

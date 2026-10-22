// The species box's taxonomy "funnel": the common name large and orange, the scientific name of the
// level you're looking at under a "Species:" label with ◀ ▶ arrows to step to the neighbouring
// group at that level, and a tapering row of circles — Ord · Fam · Gen · Spe · Sub · Mut — to jump
// between levels. Sub and Mut are greyed out when the bird has no subspecies / mutation.
//
//   TaxonomyFunnel.create(bird) -> element
const TaxonomyFunnel = (function () {
  var ORANGE = '#E8912D';
  var LEVELS = [
    { key: 'order', abbr: 'Ord', label: 'Order', r: 15 },
    { key: 'family', abbr: 'Fam', label: 'Family', r: 12.5 },
    { key: 'genus', abbr: 'Gen', label: 'Genus', r: 10.8 },
    { key: 'species', abbr: 'Spe', label: 'Species', r: 9 },
    { key: 'sub', abbr: 'Sub', label: 'Subspecies', r: 7.4 },
    { key: 'mut', abbr: 'Mut', label: 'Mutation', r: 6 },
  ];

  // English names for the bird orders (the species list only carries the Latin ones).
  var ORDER_ENGLISH = {
    Struthioniformes: 'Ostriches', Rheiformes: 'Rheas', Tinamiformes: 'Tinamous', Casuariiformes: 'Cassowaries and Emu',
    Apterygiformes: 'Kiwis', Anseriformes: 'Waterfowl', Galliformes: 'Landfowl', Phoenicopteriformes: 'Flamingos',
    Podicipediformes: 'Grebes', Columbiformes: 'Pigeons and Doves', Mesitornithiformes: 'Mesites', Pterocliformes: 'Sandgrouse',
    Otidiformes: 'Bustards', Musophagiformes: 'Turacos', Cuculiformes: 'Cuckoos', Caprimulgiformes: 'Nightjars and Allies',
    Apodiformes: 'Swifts and Hummingbirds', Opisthocomiformes: 'Hoatzin', Gruiformes: 'Rails and Cranes',
    Charadriiformes: 'Shorebirds and Allies', Eurypygiformes: 'Kagu and Sunbittern', Phaethontiformes: 'Tropicbirds',
    Gaviiformes: 'Loons', Sphenisciformes: 'Penguins', Procellariiformes: 'Albatrosses and Petrels', Ciconiiformes: 'Storks',
    Suliformes: 'Cormorants and Allies', Pelecaniformes: 'Pelicans, Herons and Ibises', Accipitriformes: 'Hawks, Eagles and Allies',
    Strigiformes: 'Owls', Coliiformes: 'Mousebirds', Leptosomiformes: 'Cuckoo Roller', Trogoniformes: 'Trogons',
    Bucerotiformes: 'Hornbills and Hoopoes', Coraciiformes: 'Kingfishers and Allies', Piciformes: 'Woodpeckers and Allies',
    Cariamiformes: 'Seriemas', Falconiformes: 'Falcons', Psittaciformes: 'Parrots', Passeriformes: 'Perching Birds',
  };

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

  // Keeps a name on one line by shrinking its font (down to a floor, then it's trimmed with …),
  // so the box never grows or shrinks as you step through the levels.
  function fit(node, startRem, minRem) {
    var size = startRem;
    node.style.fontSize = size + 'rem';
    var guard = 0;
    while (node.scrollWidth > node.clientWidth + 1 && size > minRem && guard++ < 30) {
      size -= 0.05;
      node.style.fontSize = size + 'rem';
    }
  }

  function create(bird) {
    var root = el('div', 'funnel');
    var genus = bird.scientificName ? bird.scientificName.split(' ')[0] : '';
    var common = (bird.mutation ? bird.mutation + ' ' : '') + (bird.speciesName || bird.species || '');
    var level = 'species';

    var value = el('div', 'funnel-value');   // the English / common name, on its own line above the arrows
    var row = el('div', 'funnel-row');
    var prev = el('button', 'funnel-arrow', '◀');
    var middle = el('div', 'funnel-middle');
    var sci = el('div', 'funnel-sci');       // the scientific name between the arrows, in italics
    middle.appendChild(sci);
    var next = el('button', 'funnel-arrow', '▶');
    [prev, next].forEach(function (b) { b.type = 'button'; });
    row.appendChild(prev);
    row.appendChild(middle);
    row.appendChild(next);
    var label = el('div', 'funnel-label');
    var graphic = el('div', 'funnel-graphic');
    var note = el('div', 'funnel-note');
    [el('h3', 'funnel-title', 'Taxonomy'), value, row, label, graphic, note].forEach(function (e) { root.appendChild(e); });

    // What this bird has at each level. Levels it has nothing for are skipped by the arrows.
    function has(key) {
      if (key === 'order') return !!bird.order;
      if (key === 'family') return !!bird.family;
      if (key === 'genus') return !!genus;
      if (key === 'species') return !!bird.speciesCode;
      if (key === 'sub') return !!bird.subspecies;
      return !!bird.mutation;
    }
    // [English / common name, scientific name] for a level. Where there is no English name, the
    // scientific one stands alone.
    function names(key) {
      if (key === 'order') return [ORDER_ENGLISH[bird.order] || bird.order, ORDER_ENGLISH[bird.order] ? bird.order : ''];
      if (key === 'family') return [bird.family || bird.familyScientific, bird.family ? bird.familyScientific : ''];
      if (key === 'genus') return [genus, ''];
      if (key === 'species') return [common, bird.scientificName];
      if (key === 'sub') return [bird.subspecies, ''];
      return [bird.mutation, ''];
    }
    function present() { return LEVELS.filter(function (l) { return has(l.key); }).map(function (l) { return l.key; }); }

    function drawText() {
      var info = LEVELS.filter(function (l) { return l.key === level; })[0];
      var n = names(level);
      value.textContent = n[0] || '—';
      value.classList.toggle('sci', level === 'genus'); // a genus has only its Latin name
      sci.textContent = n[1] || '';
      fit(value, 1.15, 0.8);
      fit(sci, 0.95, 0.75);
      label.textContent = info.label;
      var keys = present();
      var at = keys.indexOf(level);
      prev.disabled = at <= 0;
      next.disabled = at < 0 || at >= keys.length - 1;
      clearEl(note);
      if (bird.birdsOfTheWorldUrl) {
        var link = el('a', 'ext-link', 'Learn more at Birds of the World ↗');
        link.href = bird.birdsOfTheWorldUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        note.appendChild(link);
      }
      var browse = el('button', 'pick-link', 'Browse Taxonomy Explorer');
      browse.type = 'button';
      browse.addEventListener('click', function () {
        TaxonomyNavigator.open({ title: 'Taxonomy', start: { order: bird.order, family: bird.family, genus: genus } });
      });
      note.appendChild(browse);
    }

    // The tapering row of circles. A level this bird has nothing for is a solid black dot.
    function drawGraphic() {
      clearEl(graphic);
      var W = 300, H = 62, cy = 22, pad = 24;
      var step = (W - pad * 2) / (LEVELS.length - 1);
      var xs = LEVELS.map(function (l, i) { return pad + i * step; });
      var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'funnel-svg', role: 'group', 'aria-label': 'Taxonomy level' });
      var top = LEVELS.map(function (l, i) { return xs[i] + ',' + (cy - l.r * 0.56); });
      var bottom = LEVELS.map(function (l, i) { return xs[LEVELS.length - 1 - i] + ',' + (cy + LEVELS[LEVELS.length - 1 - i].r * 0.56); });
      s.appendChild(svg('polygon', { points: top.concat(bottom).join(' '), class: 'funnel-taper' }));
      LEVELS.forEach(function (l, i) {
        var on = has(l.key);
        var sel = l.key === level;
        var g = svg('g', { role: 'button', tabindex: on ? '0' : '-1', 'aria-label': l.label, style: on ? 'cursor:pointer' : '' });
        g.appendChild(svg('circle', { cx: xs[i], cy: cy, r: l.r, class: on ? 'funnel-ring' : 'funnel-solid', 'stroke-width': 2.5 }));
        // The orange dot leaves the same clear gap inside every ring, whatever its size.
        if (sel) g.appendChild(svg('circle', { cx: xs[i], cy: cy, r: Math.max(1.5, l.r - 5.5), fill: ORANGE }));
        var t = svg('text', { x: xs[i], y: 58, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, class: sel ? 'funnel-abbr sel' : 'funnel-abbr' });
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

    // ◀ ▶ move to the previous / next level this bird has (Order … Species … Subspecies … Mutation);
    // the orange dot and the level name move with it.
    function go(dir) {
      var keys = present();
      var at = keys.indexOf(level);
      var to = keys[at + dir];
      if (to) { level = to; drawAll(); }
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    drawAll();
    return root;
  }

  return { create: create };
})();

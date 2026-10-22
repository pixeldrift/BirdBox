// Mybirds → Genealogy: the family tree of your real birds, with tools in a bottom drawer —
// who's selected, the inbreeding check for a pairing, and the mutation predictor. On a wide screen the
// drawer docks to the side. Picture by js/genealogy/tree-graph.js, maths by pedigree.js and genetics.js.
// Routes: (none) · <birdId> opens the tree around that bird.
const GenealogyScreen = (function () {
  var state = {
    selected: [], show: { parents: true, siblings: true, offspring: true, consang: true },
    tab: 'birds', drawer: 'half', desiredOutcome: '',
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

  function pct(n, d) { return (n * 100).toFixed(d === undefined ? 1 : d) + '%'; }

  function render(main, navigate, startId) {
    if (startId && getBird(startId) && state.selected.indexOf(startId) === -1) state.selected = [startId];
    state.selected = state.selected.filter(function (id) { return !!getBird(id); });

    var wrap = el('div', 'gen-screen drawer-' + state.drawer);
    var stage = el('div', 'gen-stage');
    var bar = el('div', 'gen-bar');
    var graphBox = el('div', 'gen-graph');
    var empty = el('div', 'gen-empty');
    var zoom = el('div', 'gen-zoom');
    var drawer = el('div', 'gen-drawer');
    stage.appendChild(bar);
    stage.appendChild(graphBox);
    graphBox.appendChild(empty);
    graphBox.appendChild(zoom);
    wrap.appendChild(stage);
    wrap.appendChild(drawer);
    main.appendChild(wrap);

    var nodes = Pedigree.nodes();
    var byId = Pedigree.index(nodes);
    var graph = TreeGraph.create(graphBox, { onSelect: toggle });

    function toggle(id) {
      var i = state.selected.indexOf(id);
      if (i === -1) state.selected.push(id); else state.selected.splice(i, 1);
      drawAll();
    }

    function addBirdPopup() {
      Modal.open({
        title: 'Add a bird to the tree',
        build: function (body, close) {
          body.appendChild(Picker.create({
            items: function () { return Picker.listItems('birds'); }, placeholder: 'Search band, name or species…',
            onChange: function (id) { if (!id) return; close(); if (state.selected.indexOf(id) === -1) state.selected.push(id); drawAll(); },
          }).el);
        },
      });
    }

    // ---- top bar: add a bird, and what to show around the selection ----
    function drawBar() {
      clearEl(bar);
      bar.appendChild(btn('loc-add gen-add', '+ Add bird', addBirdPopup));
      var toggles = el('div', 'gen-toggles');
      [['parents', 'Parents'], ['siblings', 'Siblings'], ['offspring', 'Offspring'], ['consang', 'Related']].forEach(function (t) {
        toggles.appendChild(btn('gen-toggle' + (state.show[t[0]] ? ' on' : ''), (state.show[t[0]] ? '✓ ' : '') + t[1], function () { state.show[t[0]] = !state.show[t[0]]; drawAll(); }));
      });
      bar.appendChild(toggles);
    }

    // ---- the drawer ----
    function setDrawer(mode) {
      state.drawer = mode;
      wrap.className = 'gen-screen drawer-' + mode;
      setTimeout(graph.fit, 260);
    }

    function selectedNodes() { return state.selected.map(function (id) { return byId[id]; }).filter(Boolean); }

    function drawDrawer() {
      clearEl(drawer);
      var sel = selectedNodes();
      var handle = btn('gen-handle', '');
      handle.setAttribute('aria-label', 'Show or hide the tools');
      handle.appendChild(el('span', 'gen-grip'));
      handle.appendChild(el('span', 'gen-summary', sel.length ? sel.length + (sel.length === 1 ? ' bird selected' : ' birds selected') : 'Tools'));
      handle.addEventListener('click', function () { setDrawer(state.drawer === 'closed' ? 'half' : state.drawer === 'half' ? 'full' : 'closed'); });
      drawer.appendChild(handle);

      var tabs = el('div', 'loc-seg gen-tabs');
      [['birds', 'Selected'], ['coi', 'Inbreeding'], ['genes', 'Genetics']].forEach(function (t) {
        tabs.appendChild(btn('loc-seg-btn' + (state.tab === t[0] ? ' active' : ''), t[1], function () { state.tab = t[0]; if (state.drawer === 'closed') setDrawer('half'); drawDrawer(); }));
      });
      drawer.appendChild(tabs);
      var body = el('div', 'gen-drawer-body');
      drawer.appendChild(body);
      if (state.tab === 'birds') drawSelected(body, sel);
      else if (state.tab === 'coi') drawCoi(body, sel);
      else drawGenes(body, sel);
    }

    function note(body, text, cls) { body.appendChild(el('p', cls || 'form-note', text)); }

    function drawSelected(body, sel) {
      if (!sel.length) { note(body, 'Add a bird, or tap one in the tree, to start. Pick two to check a pairing.'); return; }
      sel.forEach(function (n) {
        var row = el('div', 'relation-row');
        var holder = el('div', 'relation-body');
        holder.appendChild(birdChip(n.bird, function () { location.hash = '#/mybirds/birds/' + n.id; }));
        row.appendChild(holder);
        row.appendChild(btn('pick-link relation-remove', 'Remove', function () { toggle(n.id); }));
        body.appendChild(row);
      });
      body.appendChild(btn('pick-link', 'Clear all', function () { state.selected = []; drawAll(); }));
    }

    function drawCoi(body, sel) {
      if (sel.length !== 2) { note(body, 'Pick exactly two birds to see how closely related they are (' + sel.length + ' selected).'); return; }
      var a = sel[0], b = sel[1];
      if (a.sex && b.sex && a.sex === b.sex) { note(body, a.name + ' and ' + b.name + ' are both ' + (a.sex === 'F' ? 'female' : 'male') + ' and can’t be paired.', 'coi-samesex'); return; }
      var r = Pedigree.calculateCoi(a.id, b.id, byId);
      var F = r.F * 100, R = r.R * 100;
      var tier = Pedigree.tier(F);
      body.appendChild(el('div', 'coi-pair', a.name + ' × ' + b.name));
      [['Relatedness (R)', R], ['Inbreeding of their chicks (F)', F]].forEach(function (s) {
        var line = el('div', 'coi-stat');
        line.appendChild(el('span', '', s[0]));
        line.appendChild(el('strong', '', s[1].toFixed(1) + '%'));
        body.appendChild(line);
      });
      var meter = el('div', 'coi-meter');
      var track = el('div', 'coi-meter-track');
      var marker = el('div', 'coi-meter-marker');
      marker.style.left = Math.min(100, F / 50 * 100) + '%';
      track.appendChild(marker);
      meter.appendChild(track);
      var labels = el('div', 'coi-meter-labels');
      labels.appendChild(el('span', '', 'Safe to breed'));
      labels.appendChild(el('span', '', 'Very closely related'));
      meter.appendChild(labels);
      body.appendChild(meter);
      body.appendChild(el('div', 'coi-conclusion tier-' + tier.id, tier.label));
      body.appendChild(el('p', 'coi-relationship', Pedigree.describeRelationship(a.id, b.id, byId)));
    }

    function outcomeRows(rows, limit) {
      var box = el('div', 'outcome-list');
      rows.filter(function (r) { return r.probability > 0.001; }).slice(0, limit || 6).forEach(function (r) {
        var row = el('div', 'outcome-row');
        row.appendChild(el('span', 'outcome-name', r.name));
        var bar = el('span', 'outcome-bar');
        var fill = el('span');
        fill.style.width = Math.min(100, r.probability * 100) + '%';
        bar.appendChild(fill);
        row.appendChild(bar);
        row.appendChild(el('span', 'outcome-pct', pct(r.probability)));
        box.appendChild(row);
      });
      return box;
    }

    function drawGenes(body, sel) {
      var supported = Genetics.profiles.map(function (p) { return p.label; }).join(', ');
      if (!sel.length) { note(body, 'Pick one bird to find a mate, or two to predict their chicks. Works for: ' + supported + '.'); return; }
      if (sel.length > 2) { note(body, 'Pick just one or two birds for this tool (' + sel.length + ' selected).'); return; }
      var profiles = sel.map(Genetics.matchSpeciesProfile);
      if (profiles.some(function (p) { return !p; })) { note(body, 'This tool doesn’t cover that species yet. It works for: ' + supported + '.'); return; }
      if (profiles.length === 2 && profiles[0].id !== profiles[1].id) { note(body, sel[0].name + ' and ' + sel[1].name + ' are different species and can’t be bred together.', 'coi-samesex'); return; }
      var profile = profiles[0];

      if (sel.length === 2) {
        var a = sel[0], b = sel[1];
        if (a.sex && b.sex && a.sex === b.sex) { note(body, a.name + ' and ' + b.name + ' are both ' + (a.sex === 'F' ? 'female' : 'male') + ' and can’t be bred together.', 'coi-samesex'); return; }
        var mother = a.sex === 'F' ? a : b, father = a.sex === 'F' ? b : a;
        var p = Genetics.predictPair(mother, father, profile, nodes);
        body.appendChild(el('div', 'coi-pair', mother.name + ' × ' + father.name));
        note(body, profile.label);
        [[mother, p.motherStatus, 'mother'], [father, p.fatherStatus, 'father']].forEach(function (x) {
          var line = el('div', 'gene-status-line');
          line.appendChild(el('strong', '', x[0].name + ' (' + x[2] + ') '));
          profile.genes.forEach(function (g) { line.appendChild(el('span', 'gene-chip gene-' + x[1][g.key].tag, g.label + ': ' + Genetics.geneStatusLabel(x[1][g.key].tag))); });
          body.appendChild(line);
        });
        body.appendChild(el('h4', 'mutation-section-title', 'Likely chicks'));
        body.appendChild(outcomeRows(p.combined));
        if (p.hasSexLinked) {
          var det = el('details', 'sex-breakdown');
          det.appendChild(el('summary', '', 'Some genes are sex-linked — odds differ for sons and daughters'));
          var cols = el('div', 'sex-breakdown-cols');
          [['As sons', p.sons], ['As daughters', p.daughters]].forEach(function (c) { var d = el('div'); d.appendChild(el('h5', '', c[0])); d.appendChild(outcomeRows(c[1], 4)); cols.appendChild(d); });
          det.appendChild(cols);
          body.appendChild(det);
        }
        if (p.anyUnknown) note(body, 'Genes marked “clear (unproven)” haven’t been proven either way by a chick — real results could include more than shown.');
        return;
      }

      // one bird: find the best mate for a wanted outcome
      var bird = sel[0];
      body.appendChild(el('div', 'coi-pair', 'Best mate for ' + bird.name));
      note(body, profile.label);
      if (!bird.sex) { note(body, bird.name + '’s sex isn’t recorded, so mates can’t be matched.'); return; }
      var names = Genetics.outcomeNames(profile);
      if (names.indexOf(state.desiredOutcome) === -1) state.desiredOutcome = names[0];
      var field = el('label', 'form-field');
      field.appendChild(el('span', 'form-label', 'Wanted in the chicks'));
      var select = el('select', 'form-input');
      select.setAttribute('aria-label', 'Wanted in the chicks');
      names.forEach(function (n) { var o = el('option', '', n); o.value = n; select.appendChild(o); });
      select.value = state.desiredOutcome;
      select.addEventListener('change', function () { state.desiredOutcome = select.value; drawDrawer(); });
      field.appendChild(select);
      body.appendChild(field);
      var ranked = Genetics.rankMates(bird, profile, state.desiredOutcome, nodes, 6) || [];
      if (!ranked.length) { note(body, 'No bird in your collection has a real chance of producing “' + state.desiredOutcome + '” with ' + bird.name + '.'); return; }
      ranked.forEach(function (m) {
        var item = el('div', 'mate-result');
        var head = el('button', 'pick-link mate-name', m.other.name);
        head.type = 'button';
        head.addEventListener('click', function () { state.selected = [bird.id, m.other.id]; state.tab = 'coi'; drawAll(); });
        item.appendChild(head);
        item.appendChild(outcomeRows([{ name: 'Chance', probability: m.probability }], 1));
        item.appendChild(el('div', 'mate-relationship', Pedigree.describeRelationship(bird.id, m.other.id, byId)));
        body.appendChild(item);
      });
    }

    function drawAll() {
      drawBar();
      var ok = graph.update({ nodes: nodes, selected: new Set(state.selected), show: state.show });
      empty.style.display = ok ? 'none' : 'flex';
      clearEl(empty);
      if (!ok) {
        empty.appendChild(el('p', '', nodes.length ? 'Add a bird to see its family tree.' : 'No birds yet.'));
        empty.appendChild(btn('save-btn', '+ Add a bird', addBirdPopup));
      }
      drawDrawer();
    }

    [['＋', 1.25, 'Zoom in'], ['−', 0.8, 'Zoom out']].forEach(function (z) {
      var b = btn('gen-zoom-btn', z[0], function () { graph.zoomBy(z[1]); });
      b.setAttribute('aria-label', z[2]);
      zoom.appendChild(b);
    });
    var fitBtn = btn('gen-zoom-btn', '⤢', function () { graph.fit(); });
    fitBtn.setAttribute('aria-label', 'Fit to screen');
    zoom.appendChild(fitBtn);

    drawAll();
  }

  function renderList(main, navigate) { render(main, navigate, ''); }

  function renderDetail(main, id, navigate) { render(main, navigate, id); }

  return { renderList: renderList, renderDetail: renderDetail };
})();

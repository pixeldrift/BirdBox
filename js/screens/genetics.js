// Mybirds → Genetics: the breeding tools, working on the birds in the shared workbench (the same ones as on
// the Genealogy tab). Pick two birds to check how closely related they are and predict their chicks, or one
// bird to find the best mate for a wanted outcome. Maths in js/genealogy/pedigree.js and genetics.js.
// Routes: (none) · <birdId> puts that bird on the bench.
const GeneticsScreen = (function () {
  var desiredOutcome = '';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function pct(n, d) { return (n * 100).toFixed(d === undefined ? 1 : d) + '%'; }

  function render(main, navigate, startId) {
    if (startId && getBird(startId)) Workbench.only([startId]);
    Workbench.tidy();

    var wrap = el('div', 'gen-screen drawer-' + Workbench.mode);
    var stage = el('div', 'gen-stage');
    var tools = el('div', 'gen-tools');
    stage.appendChild(tools);
    wrap.appendChild(stage);
    main.appendChild(wrap);

    var nodes = Pedigree.nodes();
    var byId = Pedigree.index(nodes);
    var bench = Workbench.drawer({
      onChange: drawAll,
      link: { label: 'Family tree ›', go: function () { location.hash = '#/mybirds/genealogy'; } },
    });
    wrap.appendChild(bench.el);

    function selectedNodes() { return Workbench.selected.map(function (id) { return byId[id]; }).filter(Boolean); }

    function section(title) {
      var box = el('div', 'detail-section');
      box.appendChild(el('h3', '', title));
      tools.appendChild(box);
      return box;
    }

  function note(body, text, cls) { body.appendChild(el('p', cls || 'form-note', text)); }

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
    if (names.indexOf(desiredOutcome) === -1) desiredOutcome = names[0];
    var field = el('label', 'form-field');
    field.appendChild(el('span', 'form-label', 'Wanted in the chicks'));
    var select = el('select', 'form-input');
    select.setAttribute('aria-label', 'Wanted in the chicks');
    names.forEach(function (n) { var o = el('option', '', n); o.value = n; select.appendChild(o); });
    select.value = desiredOutcome;
    select.addEventListener('change', function () { desiredOutcome = select.value; drawAll(); });
    field.appendChild(select);
    body.appendChild(field);
    var ranked = Genetics.rankMates(bird, profile, desiredOutcome, nodes, 6) || [];
    if (!ranked.length) { note(body, 'No bird in your collection has a real chance of producing “' + desiredOutcome + '” with ' + bird.name + '.'); return; }
    ranked.forEach(function (m) {
      var item = el('div', 'mate-result');
      var head = el('button', 'pick-link mate-name', m.other.name);
      head.type = 'button';
      head.addEventListener('click', function () { Workbench.only([bird.id, m.other.id]); bench.refresh(); drawAll(); });
      item.appendChild(head);
      item.appendChild(outcomeRows([{ name: 'Chance', probability: m.probability }], 1));
      item.appendChild(el('div', 'mate-relationship', Pedigree.describeRelationship(bird.id, m.other.id, byId)));
      body.appendChild(item);
    });
  }


    function drawAll() {
      clearEl(tools);
      var sel = selectedNodes();
      drawCoi(section('Inbreeding'), sel);
      drawGenes(section('Offspring predictor'), sel);
    }

    drawAll();
  }

  function renderList(main, navigate) { render(main, navigate, ''); }

  function renderDetail(main, id, navigate) { render(main, navigate, id); }

  return { renderList: renderList, renderDetail: renderDetail };
})();

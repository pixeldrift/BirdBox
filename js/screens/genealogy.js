// Mybirds → Genealogy: the family tree of your real birds, with the shared workbench
// (js/genealogy/workbench.js) in a drawer. The inbreeding check and mutation predictor are on the Genetics tab. Picture by js/genealogy/tree-graph.js, maths by pedigree.js and genetics.js.
// Routes: (none) · <birdId> opens the tree around that bird.
const GenealogyScreen = (function () {
  var show = { parents: true, siblings: true, offspring: true, consang: true };

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

  function render(main, navigate, startId) {
    if (startId && getBird(startId)) Workbench.only([startId]);
    Workbench.tidy();

    var wrap = el('div', 'gen-screen drawer-' + Workbench.mode);
    var stage = el('div', 'gen-stage');
    var bar = el('div', 'gen-bar');
    var graphBox = el('div', 'gen-graph');
    var empty = el('div', 'gen-empty');
    var zoom = el('div', 'gen-zoom');
    stage.appendChild(bar);
    stage.appendChild(graphBox);
    graphBox.appendChild(empty);
    graphBox.appendChild(zoom);
    wrap.appendChild(stage);
    main.appendChild(wrap);

    var nodes = Pedigree.nodes();
    var graph = TreeGraph.create(graphBox, { onSelect: function (id) { Workbench.toggle(id); drawAll(); bench.refresh(); } });
    var bench = Workbench.drawer({
      onChange: drawAll, onResize: function () { graph.fit(); },
      link: { label: 'Check pairing ›', go: function () { location.hash = '#/mybirds/genetics'; } },
    });
    wrap.appendChild(bench.el);

    // ---- top bar: what to show around the selection ----
    function drawBar() {
      clearEl(bar);
      var toggles = el('div', 'gen-toggles');
      [['parents', 'Parents'], ['siblings', 'Siblings'], ['offspring', 'Offspring'], ['consang', 'Related']].forEach(function (t) {
        toggles.appendChild(btn('gen-toggle' + (show[t[0]] ? ' on' : ''), (show[t[0]] ? '✓ ' : '') + t[1], function () { show[t[0]] = !show[t[0]]; drawAll(); }));
      });
      bar.appendChild(toggles);
    }

    function drawAll() {
      drawBar();
      var ok = graph.update({ nodes: nodes, selected: new Set(Workbench.selected), show: show });
      empty.style.display = ok ? 'none' : 'flex';
      clearEl(empty);
      if (!ok) empty.appendChild(el('p', '', nodes.length ? 'Add a bird in the workbench below to see its family tree.' : 'No birds yet.'));
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

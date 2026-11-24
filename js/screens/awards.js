// My Birds → Awards: every show, race and trial result in one place — newest first, searchable, with a trophy for a win. A result's own page
// (photos, notes, edit) lives with its bird: #/mybirds/birds/award~<id>.
const AwardsScreen = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function resultHash(id) { return '#/mybirds/birds/award~' + id; }

  function haystack(a) {
    var b = a.birdId ? getBird(a.birdId) : null;
    return [a.event, a.placement, a.kind, a.category, a.judge, a.notes, b ? [b.name, b.band, birdShortLabel(b)].join(' ') : ''].filter(Boolean).join(' ').toLowerCase();
  }

  // "+ Add Result": choose the bird, then the form for its result.
  function addResult() {
    Modal.open({
      title: 'Which bird?',
      build: function (body, close) {
        body.appendChild(Picker.birds({ placeholder: 'Search your birds…', allowClear: false, onChange: function (id) {
          if (!id) return;
          close();
          location.hash = '#/mybirds/birds/award~new~' + id;
        } }).el);
      },
    });
  }

  function renderList(main) {
    clearEl(main);
    var state = { query: '', kind: [], show: [] };
    var wrap = el('div', 'list-screen');
    var tools = ListTools.create({
      screen: 'awards', noView: true, placeholder: 'Search results…', ariaLabel: 'Search results', query: state.query,
      add: { label: '+ Add Result', onClick: addResult },
      onQuery: function (v) { state.query = v; draw(); }, onRedraw: function () { draw(); },
      filters: [
        { key: 'show', label: 'Placing', options: [['won', 'Won something'], ['top', 'First place or a title']] },
        { key: 'kind', label: 'Kind', options: AWARD_KINDS.map(function (k) { return [k, k]; }) },
      ],
      get: function (k) { return state[k]; }, set: function (k, v) { state[k] = v; },
    });
    var count = el('p', 'list-count');
    var list = el('div', 'list-rows');

    function draw() {
      tools.refresh();
      var words = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var results = AWARDS_SAMPLE.filter(function (a) {
        if (state.kind.length && state.kind.indexOf(a.kind) === -1) return false;
        if (state.show.length && !state.show.some(function (k) { return k === 'won' ? isAwardWon(a) : isTopPlacement(a); })) return false;
        if (!words.length) return true;
        var hay = haystack(a);
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
      var wins = results.filter(isAwardWon).length;
      clearEl(count);
      count.appendChild(el('strong', '', String(results.length)));
      count.appendChild(document.createTextNode(results.length === 1 ? ' result' : ' results'));
      if (wins) count.appendChild(document.createTextNode(' · ' + wins + (wins === 1 ? ' win' : ' wins')));
      clearEl(list);
      if (!results.length) list.appendChild(el('p', 'list-empty', AWARDS_SAMPLE.length ? 'No results match that.' : 'No results yet — tap “+ Add Result” to record a show, race or trial.'));
      results.forEach(function (a) {
        var bird = a.birdId ? getBird(a.birdId) : null;
        var row = el('button', 'list-row');
        row.type = 'button';
        var av = el('span', 'list-row-avatar');
        var photo = mediaMainPhotoUrl('award', a.id);
        fillThumb(av, photo ? { src: photo } : { icon: 'icons/tinted/mybirds/Awards.png' });
        var info = el('span', 'list-row-info');
        info.appendChild(el('span', 'list-row-title', (isTopPlacement(a) ? '★ ' : '') + (a.placement || 'Entered')));
        info.appendChild(el('span', 'list-row-sub', [a.event, a.category].filter(Boolean).join(' · ')));
        var meta = el('span', 'media-meta');
        meta.appendChild(el('span', 'list-row-sub', bird ? birdShortLabel(bird) + (bird.band ? ' · ' + bird.band : '') : ''));
        meta.appendChild(el('span', 'media-date', a.date ? formatDate(a.date) : ''));
        info.appendChild(meta);
        row.appendChild(av);
        row.appendChild(info);
        row.addEventListener('click', function () { location.hash = resultHash(a.id); });
        list.appendChild(row);
      });
    }

    draw();
    [tools.bar, tools.chips, count, list].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);
  }

  // A result's page is part of its bird's page; send people straight there.
  function renderDetail(main, id) { location.hash = resultHash(id); }

  return { renderList: renderList, renderDetail: renderDetail };
})();

// Aviary → Feed/Water: what everyone is fed. "By place" lists every cage with the plan that applies to it (its own,
// or the nearest one above); "By food" lists each supply that's in a plan, where it's used and how much is left.
// Plans are edited on the cage, room, building, location, bird or aviary pages ("Care & feeding").
// The aviary-wide plan is edited here. Routes: none.
const FeedWaterScreen = (function () {
  var state = { view: 'place', query: '', noPlanOnly: false };

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

  function summary(items) {
    return items.map(function (c) { return careLineText(c); }).join(' · ');
  }

  function renderList(main, navigate) {
    var wrap = el('div', 'list-screen');
    var top = el('div');
    var body = el('div');
    wrap.appendChild(top);
    wrap.appendChild(body);
    main.appendChild(wrap);

    function draw() {
      clearEl(top);
      clearEl(body);
      var seg = el('div', 'loc-seg loc-modes');
      [['place', 'By place'], ['food', 'By food']].forEach(function (v) {
        seg.appendChild(btn('loc-seg-btn' + (state.view === v[0] ? ' active' : ''), v[1], function () { state.view = v[0]; draw(); }));
      });
      top.appendChild(seg);
      var search = el('input', 'search-input');
      search.type = 'search';
      search.placeholder = state.view === 'place' ? 'Search cages…' : 'Search foods…';
      search.value = state.query;
      search.addEventListener('input', function (e) { state.query = e.target.value; drawBody(); });
      top.appendChild(search);
      drawBody();
    }

    function drawBody() {
      clearEl(body);
      var q = state.query.trim().toLowerCase();
      if (state.view === 'place') {
        // aviary-wide plan, editable right here
        body.appendChild(CareSection.render({ targetType: 'aviary', targetId: 'main', name: AVIARY.name, refresh: draw }));
        var filter = btn('pick-link', state.noPlanOnly ? 'Show all cages' : 'Only cages with no plan', function () { state.noPlanOnly = !state.noPlanOnly; drawBody(); });
        var count = el('p', 'list-count');
        var list = el('div', 'list-rows');
        var rows = allCages().filter(function (c) { return !q || (c.code + ' ' + cagePlaceLabel(c.code)).toLowerCase().indexOf(q) !== -1; }).map(function (c) {
          return { cage: c, plan: effectiveCare('cage', c.code) };
        }).filter(function (r) { return !state.noPlanOnly || !r.plan.items.length; });
        count.textContent = rows.length + (rows.length === 1 ? ' cage' : ' cages') + ' ';
        count.appendChild(filter);
        body.appendChild(count);
        rows.forEach(function (r) {
          var b = el('button', 'list-row');
          b.type = 'button';
          var av = el('span', 'list-row-avatar');
          av.appendChild(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }));
          b.appendChild(av);
          var info = el('span', 'list-row-info');
          info.appendChild(el('span', 'list-row-title', r.cage.code));
          info.appendChild(el('span', 'list-row-sub', r.plan.items.length ? summary(r.plan.items) : 'No plan — ' + cagePlaceLabel(r.cage.code)));
          b.appendChild(info);
          b.appendChild(el('span', 'type-badge ' + (r.plan.items.length ? 'type-breeder' : 'status-inactive-user'), r.plan.items.length ? (r.plan.own ? 'Own plan' : 'From ' + r.plan.from.label) : 'No plan'));
          b.addEventListener('click', function () { location.hash = '#/aviary/caging/' + r.cage.code; });
          list.appendChild(b);
        });
        if (!rows.length) list.appendChild(el('p', 'list-empty', allCages().length ? 'Nothing matches.' : 'No cages yet.'));
        body.appendChild(list);
        return;
      }
      // by food
      var foods = {};
      CARE_SAMPLE.forEach(function (c) {
        var key = c.supplyId || 'label:' + c.label.toLowerCase();
        (foods[key] = foods[key] || { key: key, supplyId: c.supplyId, label: c.label, uses: [] }).uses.push(c);
      });
      var items = Object.keys(foods).map(function (k) { return foods[k]; }).filter(function (f) {
        var s = f.supplyId ? getSupply(f.supplyId) : null;
        return !q || ((s ? s.name : f.label) + ' ' + (s ? s.category : '')).toLowerCase().indexOf(q) !== -1;
      }).sort(function (a, b) { return b.uses.length - a.uses.length; });
      var list2 = el('div', 'list-rows');
      items.forEach(function (f) {
        var s = f.supplyId ? getSupply(f.supplyId) : null;
        var b = el('button', 'list-row');
        b.type = 'button';
        var av = el('span', 'list-row-avatar');
        var url = s ? supplyThumbUrl(s) : '';
        av.appendChild(makeThumb(url ? { src: url } : { icon: 'icons/tinted/aviary/FeedWater.png' }));
        b.appendChild(av);
        var info = el('span', 'list-row-info');
        info.appendChild(el('span', 'list-row-title', s ? s.name : f.label));
        info.appendChild(el('span', 'list-row-sub', 'In ' + f.uses.length + (f.uses.length === 1 ? ' plan' : ' plans') + (s ? ' · ' + supplyAmount(s) + ' on hand' : '')));
        b.appendChild(info);
        if (s && supplyIsLow(s)) b.appendChild(el('span', 'type-badge supply-low', 'Low'));
        if (s) b.addEventListener('click', function () { location.hash = '#/aviary/supplies/' + s.id; });
        list2.appendChild(b);
      });
      if (!items.length) list2.appendChild(el('p', 'list-empty', 'No foods in any plan yet. Open a cage or bird and add one under “Care & feeding”.'));
      body.appendChild(list2);
    }

    draw();
  }

  return { renderList: renderList, renderDetail: renderList };
})();

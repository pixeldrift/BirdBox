// Shared controls for the Birds and Supplies lists: [search] [list | grid] [filter ▾]. The filter button opens a popup
// of choices; what's switched on shows as ✕ chips under the bar (same as the Caging controls). Grid cards share one look.
//
//   var tools = ListTools.create({ screen: 'birds', placeholder, ariaLabel, query, onQuery, onRedraw,
//                                  filters: [{ key, label, options: [[value, label], …] }, …]   ← pick any number of each
//                                           (or a function returning that list, when the options change)
//                                  get(key) → array of picked values, set(key, array) })
//   add: { label, onClick } puts a small add button beside the search box (the top row of every list page)
//   noSearch / noView leave out the search box / list-grid toggle; tools.filterBtn is the button on its own
//   tools.bar   the search + toggle + filter row     tools.chips   the active-filter chips
//   tools.view  'list' | 'grid' (remembered)         tools.card(spec) builds a grid card
const ListTools = (function () {
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

  var PATHS = {
    funnel: 'M3 4h18l-7 8.5V19l-4 2v-8.5z',
    list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    logout: 'M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M15 8l4 4-4 4M19 12H9',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    close: 'M6 6l12 12M18 6L6 18',
    prev: 'M15 5l-7 7 7 7',
    next: 'M9 5l7 7-7 7',
  };
  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'loc-icon');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', PATHS[name]);
    s.appendChild(p);
    return s;
  }

  // The search box used everywhere (a pair of binoculars before the text). Returns { box, input } — box is what you add to the page.
  function searchBox(o) {
    var input = el('input', 'search-input'); // the binoculars come from the stylesheet, for every search box in the app
    input.type = 'search';
    input.placeholder = o.placeholder || 'Search…';
    input.setAttribute('aria-label', o.ariaLabel || 'Search');
    input.value = o.query || '';
    if (o.onQuery) input.addEventListener('input', function (e) { o.onQuery(e.target.value); });
    return { box: input, input: input };
  }

  // The top row of a list page, always in the same place: the search box, with a small add button to its right.
  //   topRow({ placeholder, ariaLabel, query, onQuery, noSearch, add: { label, onClick } })
  function topRow(o) {
    var row = el('div', 'list-top');
    if (!o.noSearch) row.appendChild(searchBox(o).box);
    else row.appendChild(el('span', 'list-top-gap'));
    if (o.add) row.appendChild(btn('add-mini', o.add.label, o.add.onClick));
    return row;
  }

  function loadView(screen) { try { return localStorage.getItem('birdbox-view-' + screen) === 'grid' ? 'grid' : 'list'; } catch (e) { return 'list'; } }
  function saveView(screen, v) { try { localStorage.setItem('birdbox-view-' + screen, v); } catch (e) { /* just not remembered */ } }

  function create(o) {
    var api = { view: loadView(o.screen) };

    var bar = el('div', 'list-tools-wrap');
    if (!o.noSearch || o.add) bar.appendChild(topRow(o));
    var sub = el('div', 'list-tools');
    bar.appendChild(sub);

    var seg = el('div', 'loc-seg loc-present');
    function drawSeg() {
      clearEl(seg);
      [['list', 'List'], ['grid', 'Grid']].forEach(function (v) {
        var b = btn('loc-seg-btn' + (api.view === v[0] ? ' active' : ''), '', function () {
          api.view = v[0]; saveView(o.screen, v[0]); drawSeg(); o.onRedraw();
        });
        b.appendChild(icon(v[0]));
        b.setAttribute('aria-label', v[1] + ' view');
        b.title = v[1] + ' view';
        seg.appendChild(b);
      });
    }
    drawSeg();
    if (!o.noView) sub.appendChild(seg);

    var filterBtn = btn('loc-filter-btn', '', function () { openFilters(); });
    filterBtn.appendChild(icon('funnel'));
    sub.appendChild(filterBtn);
    api.bar = bar;
    api.filterBtn = filterBtn;

    function filterList() { return typeof o.filters === 'function' ? o.filters() : (o.filters || []); }
    var chips = el('div', 'loc-chips');
    api.chips = chips;

    function active() {
      var out = [];
      filterList().forEach(function (f) {
        (o.get(f.key) || []).forEach(function (v) {
          out.push({ key: f.key, value: v, label: f.options.filter(function (x) { return x[0] === v; }).map(function (x) { return x[1]; })[0] || String(v) });
        });
      });
      return out;
    }

    // Redraws the filter button's count and the chips; call after anything changes.
    api.refresh = function () {
      var on = active();
      filterBtn.classList.toggle('on', !!on.length);
      filterBtn.setAttribute('aria-label', on.length ? 'Filter — ' + on.length + ' on' : 'Filter');
      filterBtn.title = on.length ? 'Filter — ' + on.length + ' on' : 'Filter';
      var old = filterBtn.querySelector('.loc-filter-count');
      if (old) old.remove();
      if (on.length) filterBtn.appendChild(el('span', 'loc-filter-count', String(on.length)));
      clearEl(chips);
      on.forEach(function (a) {
        chips.appendChild(btn('loc-chip', a.label + '  ✕', function () {
          o.set(a.key, (o.get(a.key) || []).filter(function (v) { return v !== a.value; }));
          o.onRedraw();
        }));
      });
    };

    // Pick as many as you like; nothing picked means no filter. Changes apply instantly, so closing the popup any way keeps them.
    function openFilters() {
      Modal.open({
        title: 'Filter',
        build: function (body, close) {
          function drawBody() {
            clearEl(body);
            filterList().forEach(function (f) {
              if (f.label) body.appendChild(el('p', 'subsection-label', f.label));
              var list = el('div', 'app-select-list');
              f.options.forEach(function (opt) {
                var sel = (o.get(f.key) || []).indexOf(opt[0]) !== -1;
                var b = btn('app-select-option' + (sel ? ' selected' : ''), '', function () {
                  var cur = (o.get(f.key) || []).slice();
                  var i = cur.indexOf(opt[0]);
                  if (i === -1) cur.push(opt[0]); else cur.splice(i, 1);
                  o.set(f.key, cur);
                  o.onRedraw();
                  drawBody();
                });
                b.appendChild(el('span', '', opt[1]));
                if (sel) b.appendChild(el('span', 'app-select-check', '✓'));
                list.appendChild(b);
              });
              body.appendChild(list);
            });
            var actions = el('div', 'filter-actions');
            actions.appendChild(btn('add-record-btn', 'Clear filters', function () {
              filterList().forEach(function (f) { o.set(f.key, []); });
              o.onRedraw();
              drawBody();
            }));
            actions.appendChild(btn('save-btn', 'Apply', close));
            body.appendChild(actions);
          }
          drawBody();
        },
      });
    }

    // A grid card: picture on top, name, a line of detail, and a badge. spec: { thumb: element, title, sub, badge, badgeClass, onClick }
    api.card = function (spec) {
      var c = btn('tile-card', '', spec.onClick);
      var t = el('span', 'tile-thumb');
      t.appendChild(spec.thumb);
      c.appendChild(t);
      c.appendChild(el('span', 'tile-title', spec.title));
      if (spec.sub) { var sub = el('span', 'tile-sub'); if (typeof spec.sub === 'string') sub.textContent = spec.sub; else sub.appendChild(spec.sub); c.appendChild(sub); }
      if (spec.badge) c.appendChild(el('span', 'tile-badge ' + (spec.badgeClass || ''), spec.badge));
      return c;
    };

    api.refresh();
    return api;
  }

  // Search boxes everywhere: tapping in opens the box wide (the add button tucks away), and tapping anywhere else — or pressing Search —
  // puts the keyboard away again.
  function searchBar(input) { return input.closest('.list-top, .loc-searchbar'); }
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.matches && e.target.matches('input[type="search"]')) { var bar = searchBar(e.target); if (bar) bar.classList.add('searching'); }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target && e.target.matches && e.target.matches('input[type="search"]')) { var bar = searchBar(e.target); if (bar) bar.classList.remove('searching'); }
  });
  document.addEventListener('pointerdown', function (e) {
    var a = document.activeElement;
    if (a && a.matches && a.matches('input[type="search"]') && e.target !== a && !(e.target.closest && e.target.closest('input[type="search"]'))) a.blur();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('input[type="search"]')) e.target.blur();
  });

  return { create: create, searchBox: searchBox, topRow: topRow, icon: icon };
})();

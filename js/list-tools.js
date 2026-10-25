// Shared controls for the Birds and Supplies lists: [search] [list | grid] [filter ▾]. The filter button opens a popup
// of choices; what's switched on shows as ✕ chips under the bar (same as the Caging controls). Grid cards share one look.
//
//   var tools = ListTools.create({ screen: 'birds', placeholder, ariaLabel, query, onQuery, onRedraw,
//                                  filters: [{ key, label, options: [[value, label], …] }, …]   ← pick any number of each
//                                  get(key) → array of picked values, set(key, array) })
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

  function loadView(screen) { try { return localStorage.getItem('birdbox-view-' + screen) === 'grid' ? 'grid' : 'list'; } catch (e) { return 'list'; } }
  function saveView(screen, v) { try { localStorage.setItem('birdbox-view-' + screen, v); } catch (e) { /* just not remembered */ } }

  function create(o) {
    var api = { view: loadView(o.screen) };

    var bar = el('div', 'list-tools');
    var search = el('input', 'search-input');
    search.type = 'search';
    search.placeholder = o.placeholder || 'Search…';
    search.setAttribute('aria-label', o.ariaLabel || 'Search');
    search.value = o.query || '';
    search.addEventListener('input', function (e) { o.onQuery(e.target.value); });
    bar.appendChild(search);

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
    bar.appendChild(seg);

    var filterBtn = btn('loc-filter-btn', '', function () { openFilters(); });
    filterBtn.appendChild(icon('funnel'));
    bar.appendChild(filterBtn);
    api.bar = bar;

    var chips = el('div', 'loc-chips');
    api.chips = chips;

    function active() {
      var out = [];
      (o.filters || []).forEach(function (f) {
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

    // Pick as many as you like; nothing picked means no filter. Nothing changes until Apply.
    function openFilters() {
      var staged = {};
      (o.filters || []).forEach(function (f) { staged[f.key] = (o.get(f.key) || []).slice(); });
      Modal.open({
        title: 'Filter',
        build: function (body, close) {
          function drawBody() {
            clearEl(body);
            (o.filters || []).forEach(function (f) {
              if (f.label) body.appendChild(el('p', 'subsection-label', f.label));
              var list = el('div', 'app-select-list');
              f.options.forEach(function (opt) {
                var sel = staged[f.key].indexOf(opt[0]) !== -1;
                var b = btn('app-select-option' + (sel ? ' selected' : ''), '', function () {
                  var i = staged[f.key].indexOf(opt[0]);
                  if (i === -1) staged[f.key].push(opt[0]); else staged[f.key].splice(i, 1);
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
              (o.filters || []).forEach(function (f) { staged[f.key] = []; });
              drawBody();
            }));
            actions.appendChild(btn('save-btn', 'Apply', function () {
              (o.filters || []).forEach(function (f) { o.set(f.key, staged[f.key]); });
              close();
              o.onRedraw();
            }));
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
      if (spec.sub) c.appendChild(el('span', 'tile-sub', spec.sub));
      if (spec.badge) c.appendChild(el('span', 'tile-badge ' + (spec.badgeClass || ''), spec.badge));
      return c;
    };

    api.refresh();
    return api;
  }

  return { create: create };
})();

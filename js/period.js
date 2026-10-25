// "Which time are we looking at?" — a bar for screens with money in them. Pick Day, Week, Month or Year and step
// with ‹ ›, jump straight to any date / month / year, pick a custom date range, or look at All time.
// Everything is shared, so Accounting keeps the period you chose.
//
//   var period = PeriodBar.create({ onChange: function () { … }, firstYear: 2019 });
//   period.el          the bar          period.range()  → { start, end } ISO dates (inclusive), or null for All time
//   period.label()     'October 2026'   period.contains(isoDate) → boolean
const PeriodBar = (function () {
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MODES = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['range', 'Range'], ['all', 'All']];
  var shared = { mode: 'month', anchor: '', from: '', to: '' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function parts(s) { return { y: +s.slice(0, 4), m: +s.slice(5, 7) - 1, d: +s.slice(8, 10) }; }
  function pretty(s, withYear) {
    var p = parts(s);
    return MONTHS[p.m].slice(0, 3) + ' ' + p.d + (withYear ? ', ' + p.y : '');
  }

  function init() {
    if (!shared.anchor) { shared.anchor = todayISO(); shared.from = addDaysISO(shared.anchor, -29); shared.to = shared.anchor; }
  }

  function range() {
    init();
    var a = shared.anchor, p = parts(a);
    if (shared.mode === 'day') return { start: a, end: a };
    if (shared.mode === 'week') { var s = addDaysISO(a, -dateOf(a).getDay()); return { start: s, end: addDaysISO(s, 6) }; }
    if (shared.mode === 'month') return { start: iso(p.y, p.m, 1), end: iso(p.y, p.m, new Date(p.y, p.m + 1, 0).getDate()) };
    if (shared.mode === 'year') return { start: iso(p.y, 0, 1), end: iso(p.y, 11, 31) };
    if (shared.mode === 'range') {
      var f = shared.from || shared.to, t = shared.to || shared.from;
      if (!f) return null;
      return f <= t ? { start: f, end: t } : { start: t, end: f };
    }
    return null;
  }

  function label() {
    var r = range();
    if (shared.mode === 'all' || !r) return shared.mode === 'range' ? 'Pick a start and end date' : 'All time';
    if (shared.mode === 'day') return dateOf(r.start).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (shared.mode === 'week') return pretty(r.start, parts(r.start).y !== parts(r.end).y) + ' – ' + pretty(r.end, true);
    if (shared.mode === 'month') return MONTHS[parts(r.start).m] + ' ' + parts(r.start).y;
    if (shared.mode === 'year') return String(parts(r.start).y);
    return pretty(r.start, true) + ' – ' + pretty(r.end, true);
  }

  function contains(d) {
    var r = range();
    if (!r) return shared.mode === 'all';
    var x = String(d).slice(0, 10);
    return x >= r.start && x <= r.end;
  }

  function step(dir) {
    var a = shared.anchor, p = parts(a);
    if (shared.mode === 'day') shared.anchor = addDaysISO(a, dir);
    else if (shared.mode === 'week') shared.anchor = addDaysISO(a, 7 * dir);
    else if (shared.mode === 'month') { var d = new Date(p.y, p.m + dir, 1); shared.anchor = iso(d.getFullYear(), d.getMonth(), Math.min(p.d, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
    else if (shared.mode === 'year') shared.anchor = iso(p.y + dir, Math.min(p.m, 11), Math.min(p.d, p.m === 1 ? 28 : p.d));
  }

  function create(o) {
    init();
    var bar = el('div', 'period-bar');
    var firstYear = o.firstYear || new Date().getFullYear();

    function changed() { draw(); if (o.onChange) o.onChange(); }

    function dateInput(value, onPick, placeholder) {
      var i = el('input', 'form-input');
      i.type = 'date';
      if (placeholder) i.placeholder = placeholder;
      i.value = value || '';
      i.addEventListener('change', function () { if (i.value) onPick(i.value); });
      return i;
    }
    function field(text, control) {
      var f = el('label', 'period-field');
      f.appendChild(el('span', 'period-field-label', text));
      f.appendChild(control);
      return f;
    }
    function select(options, value, onPick) {
      var s = el('select', 'form-input');
      options.forEach(function (op) { var e = el('option', '', op[1]); e.value = op[0]; s.appendChild(e); });
      s.value = String(value);
      s.addEventListener('change', function () { onPick(s.value); });
      return s;
    }

    function draw() {
      clearEl(bar);
      var seg = el('div', 'loc-seg period-seg');
      MODES.forEach(function (m) {
        var b = el('button', 'loc-seg-btn' + (shared.mode === m[0] ? ' active' : ''), m[1]);
        b.type = 'button';
        b.addEventListener('click', function () {
          if (m[0] === 'range' && !shared.from) { shared.to = todayISO(); shared.from = addDaysISO(shared.to, -29); }
          shared.mode = m[0];
          changed();
        });
        seg.appendChild(b);
      });
      bar.appendChild(seg);

      var nav = el('div', 'period-nav');
      var stepping = ['day', 'week', 'month', 'year'].indexOf(shared.mode) !== -1;
      if (stepping) {
        var prev = el('button', 'cal-nav', '‹'); prev.type = 'button'; prev.setAttribute('aria-label', 'Previous');
        prev.addEventListener('click', function () { step(-1); changed(); });
        nav.appendChild(prev);
      }
      var title = el('strong', 'period-label', label());
      nav.appendChild(title);
      if (stepping) {
        var next = el('button', 'cal-nav', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Next');
        next.addEventListener('click', function () { step(1); changed(); });
        nav.appendChild(next);
      }
      bar.appendChild(nav);

      var pick = el('div', 'period-pick');
      var p = parts(shared.anchor);
      if (shared.mode === 'day') pick.appendChild(field('Go to day', dateInput(shared.anchor, function (v) { shared.anchor = v; changed(); })));
      if (shared.mode === 'week') pick.appendChild(field('Week containing', dateInput(shared.anchor, function (v) { shared.anchor = v; changed(); })));
      if (shared.mode === 'month' || shared.mode === 'year') {
        var years = [];
        var lo = Math.min(firstYear, p.y), hi = Math.max(new Date().getFullYear(), p.y);
        for (var y = hi; y >= lo; y--) years.push([String(y), String(y)]);
        if (shared.mode === 'month') pick.appendChild(field('Month', select(MONTHS.map(function (n, i) { return [String(i), n]; }), p.m, function (v) { shared.anchor = iso(p.y, +v, 1); changed(); })));
        pick.appendChild(field('Year', select(years, p.y, function (v) { shared.anchor = iso(+v, p.m, shared.mode === 'year' ? 1 : 1); changed(); })));
      }
      if (shared.mode === 'range') {
        pick.appendChild(field('From', dateInput(shared.from, function (v) { shared.from = v; changed(); })));
        pick.appendChild(field('To', dateInput(shared.to, function (v) { shared.to = v; changed(); })));
      }
      if (pick.firstChild) bar.appendChild(pick);

      if (stepping) {
        var todayLabel = { day: 'Today', week: 'This week', month: 'This month', year: 'This year' }[shared.mode];
        var today = el('button', 'pick-link period-today', todayLabel);
        today.type = 'button';
        today.addEventListener('click', function () { shared.anchor = todayISO(); changed(); });
        bar.appendChild(today);
      }
    }
    draw();

    return { el: bar, range: range, label: label, contains: contains };
  }

  return { create: create };
})();

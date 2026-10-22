// BirdBox's own date picker. Every <input type="date"> is swapped for a button that opens an in-app
// calendar sheet instead of the native date picker. The real input stays in the page, hidden, as the
// source of truth (value is 'YYYY-MM-DD', and 'input' / 'change' events fire as usual), so code that
// reads or sets `input.value` keeps working. Honours min / max.
const AppDate = (function () {
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function parse(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
    return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
  }
  function pretty(v) {
    var p = parse(v);
    return p ? MONTHS[p.m].slice(0, 3) + ' ' + p.d + ', ' + p.y : '';
  }

  var valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function enhance(input) {
    if (input.__appDate) return;
    input.__appDate = true;

    var btn = el('button', 'app-select-btn app-date-btn');
    btn.type = 'button';
    var text = el('span', 'app-select-text');
    btn.appendChild(text);
    btn.appendChild(el('span', 'app-select-arrow', '▾'));

    function sync() {
      btn.className = input.className.replace(/\bapp-select-native\b/g, '').trim() + ' app-select-btn app-date-btn';
      text.textContent = pretty(input.value) || input.getAttribute('placeholder') || 'Pick a date';
      text.classList.toggle('blank', !input.value);
      btn.disabled = input.disabled;
    }

    Object.defineProperty(input, 'value', {
      configurable: true,
      get: function () { return valueDesc.get.call(input); },
      set: function (v) { valueDesc.set.call(input, v); sync(); },
    });

    function choose(v) {
      valueDesc.set.call(input, v);
      sync();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function open() {
      var cur = parse(input.value);
      var now = new Date();
      var today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
      var min = input.min || '', max = input.max || '';
      var view = { y: (cur || today).y, m: (cur || today).m, mode: 'days' };
      var title = (input.closest('.form-field, .fact') && (input.closest('.form-field, .fact').querySelector('.form-label, .fact-label') || {}).textContent) || 'Pick a date';

      Modal.open({
        title: title.trim(),
        build: function (body, close) {
          var head = el('div', 'cal-head');
          var prev = el('button', 'cal-nav', '‹'); prev.type = 'button'; prev.setAttribute('aria-label', 'Previous');
          var next = el('button', 'cal-nav', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Next');
          var label = el('button', 'cal-title'); label.type = 'button';
          head.appendChild(prev); head.appendChild(label); head.appendChild(next);
          var grid = el('div');
          var foot = el('div', 'cal-foot');
          body.appendChild(head); body.appendChild(grid); body.appendChild(foot);

          function disabled(v) { return (min && v < min) || (max && v > max); }

          function draw() {
            clearEl(grid);
            if (view.mode === 'days') {
              label.textContent = MONTHS[view.m] + ' ' + view.y + ' ▾';
              var week = el('div', 'cal-grid cal-week');
              DAYS.forEach(function (d) { week.appendChild(el('span', '', d)); });
              grid.appendChild(week);
              var g = el('div', 'cal-grid');
              var first = new Date(view.y, view.m, 1).getDay();
              var days = new Date(view.y, view.m + 1, 0).getDate();
              for (var i = 0; i < first; i++) g.appendChild(el('span'));
              for (var d = 1; d <= days; d++) {
                (function (day) {
                  var v = iso(view.y, view.m, day);
                  var b = el('button', 'cal-day' + (cur && cur.y === view.y && cur.m === view.m && cur.d === day ? ' selected' : '') +
                    (today.y === view.y && today.m === view.m && today.d === day ? ' today' : ''), String(day));
                  b.type = 'button';
                  b.disabled = !!disabled(v);
                  b.addEventListener('click', function () { close(); choose(v); });
                  g.appendChild(b);
                })(d);
              }
              grid.appendChild(g);
            } else if (view.mode === 'months') {
              label.textContent = view.y + ' ▾';
              var mg = el('div', 'cal-pick');
              MONTHS.forEach(function (name, i) {
                var b = el('button', 'cal-opt' + (i === view.m ? ' selected' : ''), name.slice(0, 3));
                b.type = 'button';
                b.addEventListener('click', function () { view.m = i; view.mode = 'days'; draw(); });
                mg.appendChild(b);
              });
              grid.appendChild(mg);
            } else {
              label.textContent = 'Choose a year';
              var yg = el('div', 'cal-pick cal-years');
              var minY = min ? +min.slice(0, 4) : today.y - 100, maxY = max ? +max.slice(0, 4) : today.y + 10;
              for (var y = maxY; y >= minY; y--) {
                (function (yy) {
                  var b = el('button', 'cal-opt' + (yy === view.y ? ' selected' : ''), String(yy));
                  b.type = 'button';
                  b.addEventListener('click', function () { view.y = yy; view.mode = 'months'; draw(); });
                  yg.appendChild(b);
                })(y);
              }
              grid.appendChild(yg);
              setTimeout(function () { var s = yg.querySelector('.selected'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'center' }); }, 0);
            }
          }

          function step(dir) {
            if (view.mode === 'days') { view.m += dir; if (view.m < 0) { view.m = 11; view.y--; } if (view.m > 11) { view.m = 0; view.y++; } }
            else view.y += dir;
            draw();
          }
          prev.addEventListener('click', function () { step(-1); });
          next.addEventListener('click', function () { step(1); });
          label.addEventListener('click', function () { view.mode = view.mode === 'days' ? 'months' : view.mode === 'months' ? 'years' : 'days'; draw(); });

          var todayBtn = el('button', 'pick-link', 'Today'); todayBtn.type = 'button';
          todayBtn.addEventListener('click', function () { var v = iso(today.y, today.m, today.d); if (!disabled(v)) { close(); choose(v); } });
          foot.appendChild(todayBtn);
          if (!input.required) {
            var clearBtn = el('button', 'pick-link', 'Clear'); clearBtn.type = 'button';
            clearBtn.addEventListener('click', function () { close(); choose(''); });
            foot.appendChild(clearBtn);
          }
          draw();
        },
      });
    }

    btn.addEventListener('click', open);
    input.classList.add('app-select-native');
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    if (input.parentNode) input.parentNode.insertBefore(btn, input);
    input.__appDateBtn = btn;
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ['class', 'disabled', 'min', 'max'] });
    sync();
  }

  function place(input) {
    if (input.type !== 'date') return;
    if (!input.__appDate) enhance(input);
    var btn = input.__appDateBtn;
    if (btn && input.parentNode && btn.parentNode !== input.parentNode) input.parentNode.insertBefore(btn, input);
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.tagName === 'INPUT') place(root);
    Array.prototype.forEach.call(root.querySelectorAll ? root.querySelectorAll('input') : [], place);
  }

  new MutationObserver(function (records) {
    records.forEach(function (r) { Array.prototype.forEach.call(r.addedNodes, scan); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  scan(document.documentElement);

  return { enhance: enhance };
})();

// BirdBox's own time picker. Every <input type="time"> is swapped for a button that opens an in-app list of times
// (every 15 minutes) instead of the native time picker. The real input stays in the page, hidden, as the source of
// truth (value is 'HH:MM', 24-hour), so code that reads or sets input.value keeps working.
const AppTime = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function pretty(v) {
    var m = /^(\d{1,2}):(\d{2})/.exec(v || '');
    if (!m) return '';
    var h = +m[1], mm = m[2];
    return ((h + 11) % 12 + 1) + ':' + mm + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  var valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function enhance(input) {
    if (input.__appTime) return;
    input.__appTime = true;
    var btn = el('button', 'app-select-btn app-date-btn');
    btn.type = 'button';
    var text = el('span', 'app-select-text');
    btn.appendChild(text);
    btn.appendChild(el('span', 'app-select-arrow', '▾'));

    function sync() {
      btn.className = input.className.replace(/\bapp-select-native\b/g, '').trim() + ' app-select-btn app-date-btn';
      text.textContent = pretty(input.value) || input.getAttribute('placeholder') || 'Pick a time';
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

    btn.addEventListener('click', function () {
      var holder = input.closest('.form-field');
      var labelEl = holder && holder.querySelector('.form-label');
      var cur = input.value;
      Modal.open({
        title: (labelEl && labelEl.textContent.trim()) || 'Pick a time',
        build: function (body, close) {
          var list = el('div', 'app-select-list');
          var chosen = null;
          var values = [];
          for (var h = 0; h < 24; h++) for (var m = 0; m < 60; m += 15) values.push(('0' + h).slice(-2) + ':' + ('0' + m).slice(-2));
          if (cur && values.indexOf(cur) === -1) values.unshift(cur);
          if (!input.required) {
            var none = el('button', 'app-select-option', 'No time');
            none.type = 'button';
            none.addEventListener('click', function () { close(); choose(''); });
            list.appendChild(none);
          }
          values.forEach(function (v) {
            var row = el('button', 'app-select-option' + (v === cur ? ' selected' : ''));
            row.type = 'button';
            row.appendChild(el('span', '', pretty(v)));
            if (v === cur) { row.appendChild(el('span', 'app-select-check', '✓')); chosen = row; }
            row.addEventListener('click', function () { close(); choose(v); });
            list.appendChild(row);
          });
          body.appendChild(list);
          setTimeout(function () {
            var target = chosen || list.children[Math.min(list.children.length - 1, 33)]; // 8:00 AM when nothing chosen
            if (target && target.scrollIntoView) target.scrollIntoView({ block: 'center' });
          }, 0);
        },
      });
    });

    input.classList.add('app-select-native');
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    if (input.parentNode) input.parentNode.insertBefore(btn, input);
    input.__appTimeBtn = btn;
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ['class', 'disabled'] });
    sync();
  }

  function place(input) {
    if (input.type !== 'time') return;
    if (!input.__appTime) enhance(input);
    var btn = input.__appTimeBtn;
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

  return { enhance: enhance, pretty: pretty };
})();

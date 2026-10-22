// BirdBox's own dropdown. Every <select> on the page is automatically swapped for a button that opens
// an in-app picker sheet (the same sheet style as our other popups) instead of the phone's or
// browser's native dropdown. The real <select> stays in the page, hidden, as the source of truth, so
// code that reads or sets `select.value`, adds options, or listens for 'change' keeps working
// unchanged. The button copies the select's classes, so it looks like the control it replaces.
const AppSelect = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

  function enhance(select) {
    if (select.__appSelect || select.multiple) return;
    select.__appSelect = true;

    var btn = el('button', 'app-select-btn');
    btn.type = 'button';
    var text = el('span', 'app-select-text');
    var arrow = el('span', 'app-select-arrow', '▾');
    btn.appendChild(text);
    btn.appendChild(arrow);

    function selectedOption() { return select.options[select.selectedIndex] || null; }

    function sync() {
      btn.className = select.className.replace(/\bapp-select-native\b/g, '').trim() + ' app-select-btn';
      var o = selectedOption();
      var label = o ? o.textContent : '';
      text.textContent = label || (select.getAttribute('data-placeholder') || 'Choose…');
      text.classList.toggle('blank', !o || !o.value);
      btn.disabled = select.disabled;
      var aria = select.getAttribute('aria-label');
      if (aria) btn.setAttribute('aria-label', aria);
    }

    // Setting select.value from code refreshes the button too.
    Object.defineProperty(select, 'value', {
      configurable: true,
      get: function () { return valueDesc.get.call(select); },
      set: function (v) { valueDesc.set.call(select, v); sync(); },
    });

    function open() {
      var holder = select.closest('.form-field, .fact, .hatch-cell');
      var labelEl = holder && holder.querySelector('.form-label, .fact-label, label');
      var title = select.getAttribute('aria-label') || select.getAttribute('data-title') || (labelEl && labelEl.textContent.trim()) || 'Choose';
      var m = Modal.open({
        title: title,
        build: function (body, close) {
          var list = el('div', 'app-select-list');
          var chosen = null;
          Array.prototype.forEach.call(select.options, function (o, i) {
            if (o.disabled && !o.value) return;
            var row = el('button', 'app-select-option' + (i === select.selectedIndex ? ' selected' : ''));
            row.type = 'button';
            row.appendChild(el('span', '', o.textContent || '—'));
            if (i === select.selectedIndex) { row.appendChild(el('span', 'app-select-check', '✓')); chosen = row; }
            row.disabled = o.disabled;
            row.addEventListener('click', function () {
              close();
              if (i !== select.selectedIndex) {
                select.selectedIndex = i;
                sync();
                select.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
            list.appendChild(row);
          });
          body.appendChild(list);
          if (chosen && chosen.scrollIntoView) setTimeout(function () { chosen.scrollIntoView({ block: 'center' }); }, 0);
        },
      });
      return m;
    }

    btn.addEventListener('click', open);
    select.classList.add('app-select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    if (select.parentNode) select.parentNode.insertBefore(btn, select);

    // Stay in step when options or classes change after the fact.
    new MutationObserver(sync).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] });
    // If the select is moved into the page later, bring the button along.
    select.__appSelectBtn = btn;
    sync();
  }

  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SELECT') place(root);
    Array.prototype.forEach.call(root.querySelectorAll ? root.querySelectorAll('select') : [], place);
  }

  function place(select) {
    if (!select.__appSelect) enhance(select);
    var btn = select.__appSelectBtn;
    if (btn && select.parentNode && btn.parentNode !== select.parentNode) select.parentNode.insertBefore(btn, select);
  }

  new MutationObserver(function (records) {
    records.forEach(function (r) { Array.prototype.forEach.call(r.addedNodes, scan); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  scan(document.documentElement);

  return { enhance: enhance };
})();

// A text box with an app-styled list of suggestions under it (instead of the phone's own dropdown). You can type anything —
// the list only narrows as you type and fills the box when you tap one.
//
//   SuggestInput.attach(inputEl, function () { return [{ value, hint }]; })
// `hint` is the small grey text on the right (e.g. "American · large fowl & bantam").
const SuggestInput = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function attach(input, getItems) {
    var wrap = el('div', 'suggest-wrap');
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var list = el('div', 'suggest-list');
    list.hidden = true;
    wrap.appendChild(list);
    input.autocomplete = 'off';

    function draw() {
      clearEl(list);
      var q = input.value.trim().toLowerCase();
      var items = (getItems() || []).filter(function (i) { return !q || i.value.toLowerCase().indexOf(q) !== -1; });
      if (q) items = items.filter(function (i) { return i.value.toLowerCase() !== q; }); // nothing to suggest once it's typed in full
      items = items.slice(0, 40);
      list.hidden = !items.length || document.activeElement !== input;
      items.forEach(function (i) {
        var b = el('button', 'suggest-option');
        b.type = 'button';
        b.appendChild(el('span', 'suggest-value', i.value));
        if (i.hint) b.appendChild(el('span', 'suggest-hint', i.hint));
        // mousedown (not click) so it lands before the box loses focus
        b.addEventListener('mousedown', function (e) {
          e.preventDefault();
          input.value = i.value;
          list.hidden = true;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        list.appendChild(b);
      });
    }
    input.addEventListener('focus', draw);
    input.addEventListener('input', draw);
    input.addEventListener('blur', function () { setTimeout(function () { list.hidden = true; }, 120); });
  }

  return { attach: attach };
})();

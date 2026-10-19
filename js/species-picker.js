// Type-ahead species chooser. The user types any name they know — "goffin", "african grey",
// "quaker", even a misspelling — and picks from the matches; the chosen species is what gets
// saved. Matches show the US common name first, the name that matched if different ("also known
// as"), and the scientific name in small italics. Before typing, it offers the species already
// in the user's flock and their recent picks.
const SpeciesPicker = (function () {
  var uid = 0;

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  // opts: { onChange(speciesOrNull), value: species|null, placeholder }
  function create(opts) {
    opts = opts || {};
    uid += 1;
    var listId = 'species-list-' + uid;
    var value = opts.value || null;
    var results = [];
    var active = -1;
    var timer = null;
    var controller = null;

    var root = el('div', 'species-picker');
    var input = el('input', 'form-input');
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = opts.placeholder || 'Start typing a name — e.g. Sun Conure, Goffin’s, African Grey';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);

    var list = el('ul', 'species-results');
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    var chosen = el('div', 'species-chosen');
    chosen.hidden = true;

    root.appendChild(input);
    root.appendChild(list);
    root.appendChild(chosen);

    function open(items, message) {
      results = items;
      active = items.length ? 0 : -1;
      clearEl(list);
      if (message) {
        var msg = el('li', 'species-message', message);
        msg.setAttribute('role', 'presentation');
        list.appendChild(msg);
      }
      items.forEach(function (s, i) {
        var li = el('li', 'species-option');
        li.setAttribute('role', 'option');
        li.id = listId + '-' + i;
        var name = el('span', 'sp-name', s.name);
        li.appendChild(name);
        if (s.matchedName) li.appendChild(el('span', 'sp-via', 'also known as ' + s.matchedName));
        if (s.scientificName) li.appendChild(el('span', 'sp-sci', s.scientificName));
        // mousedown (not click) so the choice lands before the input loses focus and closes the list
        li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(s); });
        list.appendChild(li);
      });
      list.hidden = !items.length && !message;
      input.setAttribute('aria-expanded', String(!list.hidden));
      paintActive();
    }

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function paintActive() {
      Array.prototype.forEach.call(list.querySelectorAll('.species-option'), function (li, i) {
        li.classList.toggle('active', i === active);
        if (i === active) input.setAttribute('aria-activedescendant', li.id);
      });
    }

    function showSuggestions() {
      var seen = {};
      var items = SpeciesApi.flockSpecies().concat(SpeciesApi.recent()).filter(function (s) {
        if (seen[s.code]) return false;
        seen[s.code] = true;
        return true;
      }).slice(0, 8);
      if (items.length) open(items, 'Your birds and recent picks');
      else close();
    }

    function run(q) {
      if (controller) controller.abort();
      controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      SpeciesApi.search(q, controller && controller.signal).then(function (found) {
        if (input.value.trim() !== q) return;
        var items = SpeciesApi.personalize(found);
        open(items, items.length ? '' : 'No species found — try another spelling or a different name.');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        open([], 'Couldn’t search just now — check your connection and try again.');
      });
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (!q) { showSuggestions(); return; }
      timer = setTimeout(function () { run(q); }, 150);
    });
    input.addEventListener('focus', function () { if (!input.value.trim()) showSuggestions(); });
    input.addEventListener('blur', function () { setTimeout(close, 100); });
    input.addEventListener('keydown', function (e) {
      if (list.hidden || !results.length) return;
      if (e.key === 'ArrowDown') { active = (active + 1) % results.length; paintActive(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { active = (active - 1 + results.length) % results.length; paintActive(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (active >= 0) { choose(results[active]); e.preventDefault(); } }
      else if (e.key === 'Escape') { close(); }
    });

    function paintChosen() {
      clearEl(chosen);
      chosen.hidden = !value;
      input.hidden = !!value;
      if (!value) return;
      var text = el('span', 'species-chosen-text');
      text.appendChild(el('strong', '', value.name));
      if (value.scientificName) text.appendChild(el('em', 'sp-sci', value.scientificName));
      chosen.appendChild(text);
      if (value.birdsOfTheWorldUrl) {
        var link = el('a', 'ext-link', 'Birds of the World ↗');
        link.href = value.birdsOfTheWorldUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        chosen.appendChild(link);
      }
      var change = el('button', 'species-change', 'Change');
      change.type = 'button';
      change.addEventListener('click', function () {
        value = null;
        input.value = '';
        paintChosen();
        input.focus();
        if (opts.onChange) opts.onChange(null);
      });
      chosen.appendChild(change);
    }

    function choose(s) {
      value = s;
      SpeciesApi.remember(s);
      close();
      paintChosen();
      if (opts.onChange) opts.onChange(s);
    }

    paintChosen();
    // Or choose by walking down the taxonomy (order › family › genus › species).
    var browse = el('button', 'pick-link', 'Browse the taxonomy');
    browse.type = 'button';
    browse.addEventListener('click', function () {
      TaxonomyNavigator.open({ title: 'Choose a species', onSelect: function (s) { choose(s); } });
    });
    root.appendChild(browse);
    var paintOrig = paintChosen;
    paintChosen = function () { paintOrig(); browse.hidden = !!value; };
    paintChosen();

    return { el: root, getValue: function () { return value; }, focus: function () { input.focus(); }, set: choose };
  }

  return { create: create };
})();

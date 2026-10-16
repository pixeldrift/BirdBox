// BirdBox's one picker: choose a single record (a bird, a contact, a cage, a building, a location…)
// from a list that can be as long as you like. It's a small search box that narrows the list as
// you type — never a long dropdown. Once something is chosen it shows that record, with Change
// (and Clear, when the field can be empty).
//
//   var p = Picker.birds({ value: id, exclude: [selfId], allowClear: true, onChange: function (id) {} });
//   form.appendChild(p.el);   p.get() -> the chosen id, or ''
//
// Presets: Picker.birds / contacts / locations / buildings / cages. Anything else:
//   Picker.create({ items: function () { return [{ id, title, sub, lead: function () { return element; }, hay }]; }, ... })
// Options: value, onChange(id), placeholder, allowClear, maxResults (default 8),
//          addNew: { label (text, or function(typedText) -> text), needsText, onClick(typedText, done(newId)) }
//                  — shows an "add new" row at the end of the list; done(newId) selects the new record.
const Picker = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function create(opts) {
    var value = opts.value || '';
    var max = opts.maxResults || 8;
    var root = el('div', 'picker');
    var chosenBox = el('div', 'pick-selected picker-chosen');
    var input = el('input', 'form-input');
    input.type = 'search';
    input.placeholder = opts.placeholder || 'Search…';
    input.autocomplete = 'off';
    var list = el('div', 'pick-results');
    root.appendChild(chosenBox);
    root.appendChild(input);
    root.appendChild(list);
    var active = -1;
    var shown = [];

    function findItem(id) {
      return opts.items().filter(function (i) { return i.id === id; })[0] || null;
    }

    function leadOf(item) {
      return item.lead ? item.lead() : pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), item.title, item.sub);
    }

    function setValue(id) {
      value = id || '';
      input.value = '';
      draw();
      if (opts.onChange) opts.onChange(value);
    }

    function draw() {
      clearEl(chosenBox);
      clearEl(list);
      var item = value ? findItem(value) : null;
      if (value && !item) item = { id: value, title: value, sub: '' }; // something removed or not loaded: still show it
      if (item) {
        input.hidden = true;
        list.hidden = true;
        var lead = leadOf(item);
        lead.classList.add('picker-lead');
        chosenBox.appendChild(lead);
        var change = el('button', 'pick-link', 'Change');
        change.type = 'button';
        change.addEventListener('click', function () { value = ''; draw(); input.focus(); });
        chosenBox.appendChild(change);
        if (opts.allowClear) {
          var clear = el('button', 'pick-link', 'Clear');
          clear.type = 'button';
          clear.addEventListener('click', function () { setValue(''); });
          chosenBox.appendChild(clear);
        }
        chosenBox.hidden = false;
        return;
      }
      chosenBox.hidden = true;
      input.hidden = false;
      // The suggestions appear when you tap into the box and go away when you leave it, so a form
      // with several pickers stays short.
      list.hidden = document.activeElement !== input;
      if (!list.hidden) drawList();
    }

    function drawList() {
      clearEl(list);
      var words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var all = opts.items();
      var matches = all.filter(function (i) {
        var hay = ((i.title || '') + ' ' + (i.sub && typeof i.sub === 'string' ? i.sub : '') + ' ' + (i.hay || '')).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      shown = matches.slice(0, max);
      active = shown.length && words.length ? 0 : -1;
      if (!shown.length) list.appendChild(el('p', 'pick-empty', all.length ? 'No matches.' : 'Nothing to choose from yet.'));
      shown.forEach(function (item, i) {
        var row = el('button', 'pick-option');
        row.type = 'button';
        row.appendChild(leadOf(item));
        row.addEventListener('click', function () { setValue(item.id); });
        row.dataset.index = String(i);
        list.appendChild(row);
      });
      if (matches.length > shown.length) {
        list.appendChild(el('p', 'pick-empty', (matches.length - shown.length) + ' more — keep typing to narrow it down'));
      } else if (!words.length && all.length > max) {
        list.appendChild(el('p', 'pick-empty', 'Type to search all ' + all.length));
      }
      if (opts.addNew) {
        var typed = input.value.trim();
        var addLabel = typeof opts.addNew.label === 'function' ? opts.addNew.label(typed) : opts.addNew.label;
        var add = el('button', 'pick-option add-new', addLabel);
        add.type = 'button';
        add.addEventListener('click', function () {
          if (opts.addNew.needsText && !input.value.trim()) { input.focus(); return; }
          opts.addNew.onClick(input.value.trim(), function (newId) { if (newId) setValue(newId); });
        });
        list.appendChild(add);
      }
      highlight();
    }

    function highlight() {
      Array.prototype.forEach.call(list.querySelectorAll('.pick-option[data-index]'), function (b) {
        b.classList.toggle('active', Number(b.dataset.index) === active);
      });
    }

    var hideTimer = null;
    input.addEventListener('focus', function () { clearTimeout(hideTimer); list.hidden = false; drawList(); });
    input.addEventListener('blur', function () {
      // Wait a moment so a tap on a suggestion still lands before the list goes away.
      hideTimer = setTimeout(function () { list.hidden = true; }, 200);
    });
    input.addEventListener('input', function () { list.hidden = false; drawList(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && shown.length) { active = (active + 1) % shown.length; highlight(); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && shown.length) { active = (active - 1 + shown.length) % shown.length; highlight(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (active >= 0 && shown[active]) setValue(shown[active].id); e.preventDefault(); }
      else if (e.key === 'Escape') { input.value = ''; drawList(); }
    });

    draw();
    return { el: root, get: function () { return value; }, set: function (id) { value = id || ''; draw(); }, refresh: draw };
  }

  function lowerJoin(parts) {
    return parts.filter(Boolean).join(' ');
  }

  function birds(opts) {
    var exclude = opts.exclude || [];
    return create(Object.assign({ placeholder: 'Search by band, name or species…' }, opts, {
      items: function () {
        return BIRDS_SAMPLE.filter(function (b) { return exclude.indexOf(b.id) === -1; }).map(function (b) {
          return { id: b.id, title: birdShortLabel(b), sub: birdSubLine(b), lead: function () { return birdPickLead(b); },
            hay: lowerJoin([b.band, b.name, b.mutation, b.sex, b.cage, b.subspecies]) };
        });
      },
    }));
  }

  function contacts(opts) {
    return create(Object.assign({ placeholder: 'Search contacts…' }, opts, {
      items: function () {
        return CONTACTS_SAMPLE.map(function (c) {
          return { id: c.id, title: c.name, lead: function () { return contactPickLead(c); }, hay: lowerJoin([c.company, c.city, c.state, c.type]) };
        });
      },
    }));
  }

  function locations(opts) {
    return create(Object.assign({ placeholder: 'Search locations…' }, opts, {
      items: function () {
        return LOCATIONS_SAMPLE.map(function (l) {
          return { id: l.id, title: l.name, sub: l.description, hay: l.description,
            lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), l.name, l.description); } };
        });
      },
    }));
  }

  function buildings(opts) {
    return create(Object.assign({ placeholder: 'Search buildings…' }, opts, {
      items: function () {
        return BUILDINGS_SAMPLE.map(function (b) {
          var loc = buildingLocation(b);
          var sub = [b.code, loc ? loc.name : '', b.description].filter(Boolean).join(' · ');
          return { id: b.code, title: b.nickname, sub: sub, hay: lowerJoin([b.code, b.description, loc ? loc.name : '']),
            lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), b.nickname, sub); } };
        });
      },
    }));
  }

  // Cages in use and set up, with the building and location they're in.
  function cages(opts) {
    return create(Object.assign({ placeholder: 'Search cages…' }, opts, {
      items: function () {
        return allCages().map(function (c) {
          var info = cagePlaceLabel(c.code);
          return { id: c.code, title: c.code, sub: info, hay: info,
            lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), c.code, info); } };
        });
      },
    }));
  }

  return { create: create, birds: birds, contacts: contacts, locations: locations, buildings: buildings, cages: cages };
})();

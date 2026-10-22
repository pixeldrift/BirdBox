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
// Hierarchy: set tree: true and give items a parentId (and selectable: false for the ones that are
// only folders). With nothing typed the list is browsed level by level (All › Home farm › Building 2),
// tapping a folder opens it; typing searches every selectable item at once.
// Options: value, onChange(id), placeholder, allowClear, maxResults (default 8), tree, rootLabel,
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
    var path = []; // folder ids opened so far when browsing a tree

    function findItem(id) {
      return opts.items().filter(function (i) { return i.id === id && i.selectable !== false; })[0] || null;
    }

    function leadOf(item) {
      return item.lead ? item.lead() : pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), item.title, item.sub);
    }

    function setValue(id) {
      value = id || '';
      path = [];
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

    // Browsing a tree: the folders and items inside the folder you've opened.
    function drawBrowse(all) {
      var byId = {};
      all.forEach(function (i) { byId[i.id] = i; });
      var current = path.length ? path[path.length - 1] : null;
      var crumbs = el('div', 'picker-crumbs');
      var root = el('button', 'pick-link', opts.rootLabel || 'All');
      root.type = 'button';
      root.addEventListener('click', function () { path = []; drawList(); input.focus(); });
      crumbs.appendChild(root);
      path.forEach(function (id, idx) {
        crumbs.appendChild(el('span', 'crumb-sep', '›'));
        var c = el('button', 'pick-link', byId[id] ? byId[id].title : id);
        c.type = 'button';
        c.addEventListener('click', function () { path = path.slice(0, idx + 1); drawList(); input.focus(); });
        crumbs.appendChild(c);
      });
      list.appendChild(crumbs);
      var kids = all.filter(function (i) { return (i.parentId || null) === current; });
      var hasKids = function (i) { return all.some(function (k) { return k.parentId === i.id; }); };
      shown = [];
      if (!kids.length) list.appendChild(el('p', 'pick-empty', 'Nothing in here yet.'));
      kids.slice(0, 40).forEach(function (item) {
        var folder = hasKids(item) || item.selectable === false;
        if (!folder) {
          var leaf = el('button', 'pick-option');
          leaf.type = 'button';
          leaf.appendChild(leadOf(item));
          leaf.addEventListener('click', function () { setValue(item.id); });
          list.appendChild(leaf);
          return;
        }
        var split = el('div', 'pick-split');
        var open = el('button', 'pick-option');
        open.type = 'button';
        open.appendChild(leadOf(item));
        open.appendChild(el('span', 'pick-chevron', '›'));
        open.addEventListener('click', function () { path.push(item.id); drawList(); input.focus(); });
        split.appendChild(open);
        if (item.selectable !== false) {
          var choose = el('button', 'pick-choose', 'Choose');
          choose.type = 'button';
          choose.addEventListener('click', function () { setValue(item.id); });
          split.appendChild(choose);
        }
        list.appendChild(split);
      });
      if (kids.length > 40) list.appendChild(el('p', 'pick-empty', (kids.length - 40) + ' more — type to search'));
    }

    function drawList() {
      clearEl(list);
      var words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var all = opts.items();
      if (opts.tree && !words.length) {
        drawBrowse(all);
        appendAddNew();
        return;
      }
      if (opts.tree) all = all.filter(function (i) { return i.selectable !== false; });
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
      appendAddNew();
      highlight();
    }

    function appendAddNew() {
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

  // Locations > buildings (and cages) as one tree. `kind` is which level can be chosen.
  function placeTree(kind) {
    var items = [];
    LOCATIONS_SAMPLE.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (l) {
      items.push({ id: 'loc:' + l.id, title: l.name, sub: l.description, parentId: null, selectable: false, hay: l.description,
        lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), l.name, l.description); } });
    });
    BUILDINGS_SAMPLE.slice().sort(function (a, b) { return String(a.nickname).localeCompare(String(b.nickname), undefined, { numeric: true }); }).forEach(function (b) {
      var loc = buildingLocation(b);
      var sub = [b.code, b.description].filter(Boolean).join(' · ');
      items.push({ id: kind === 'building' ? b.code : 'bld:' + b.code, title: 'Building ' + b.nickname, sub: sub, parentId: loc ? 'loc:' + loc.id : null,
        selectable: kind === 'building', hay: lowerJoin([b.code, b.description, loc ? loc.name : '']),
        lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), 'Building ' + b.nickname, sub); } });
    });
    if (kind === 'cage') {
      allCages().forEach(function (c) {
        var b = buildingForCage(c.code);
        var info = cagePlaceLabel(c.code);
        items.push({ id: c.code, title: c.code, sub: info, parentId: b ? 'bld:' + b.code : null, selectable: true, hay: info,
          lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), c.code, info); } });
      });
    }
    return items;
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

  function rooms(opts) {
    return create(Object.assign({ placeholder: 'Search rooms…' }, opts, {
      items: function () {
        return ROOMS_SAMPLE.map(function (r) {
          var b = buildingForRoom(r);
          var sub = [b ? 'Building ' + b.nickname : '', r.description].filter(Boolean).join(' · ');
          return { id: r.id, title: r.name, sub: sub, hay: sub, lead: function () { return pickLead(makeThumb({ icon: 'icons/tinted/aviary/Caging.png' }), r.name, sub); } };
        });
      },
    }));
  }

  function buildings(opts) {
    return create(Object.assign({ placeholder: 'Search buildings, or tap to browse…', tree: true, rootLabel: 'All locations' }, opts, {
      items: function () { return placeTree('building'); },
    }));
  }

  // Cages, browsed Location › Building › Cage (or searched by number, building or location).
  function cages(opts) {
    var exclude = opts.exclude || [];
    return create(Object.assign({ placeholder: 'Search cages, or tap to browse…', tree: true, rootLabel: 'All locations' }, opts, {
      items: function () { return placeTree('cage').filter(function (i) { return exclude.indexOf(i.id) === -1; }); },
    }));
  }

  // Plain lists of records in picker form, for "link an existing …" pickers (see js/relations.js).
  // kind: birds | contacts | transactions | waybills | health | cages | buildings; filter(rec) is optional.
  function listItems(kind, filter) {
    var keep = filter || function () { return true; };
    function icon(name) { return makeThumb({ icon: 'icons/tinted/' + name }); }
    if (kind === 'birds') {
      return BIRDS_SAMPLE.filter(keep).map(function (b) {
        return { id: b.id, title: birdShortLabel(b), sub: birdSubLine(b), lead: function () { return birdPickLead(b); },
          hay: lowerJoin([b.band, b.name, b.mutation, b.sex, b.cage]) };
      });
    }
    if (kind === 'contacts') {
      return CONTACTS_SAMPLE.filter(keep).map(function (c) {
        return { id: c.id, title: c.name, lead: function () { return contactPickLead(c); }, hay: lowerJoin([c.company, c.city, c.state, c.type]) };
      });
    }
    if (kind === 'transactions') {
      return TRANSACTIONS_SAMPLE.filter(keep).map(function (t) {
        var cl = t.clientId ? getContact(t.clientId) : null;
        var sub = [formatDate(t.date), formatMoney(t.amount), cl ? cl.name : ''].filter(Boolean).join(' · ');
        return { id: t.id, title: t.item, sub: sub, hay: lowerJoin([t.category, t.funding]),
          lead: function () { return pickLead(icon('business/Accounting.png'), t.item, sub); } };
      });
    }
    if (kind === 'waybills') {
      return WAYBILLS_SAMPLE.filter(keep).map(function (w) {
        var info = mediaTargetInfo({ targetType: 'waybill', targetId: w.id });
        var birds = (w.birdIds || []).map(getBird).filter(Boolean);
        return { id: w.id, title: info.text, sub: waybillStateLabel(w), hay: lowerJoin([w.waybillNumber, w.carrier].concat(birds.map(function (b) { return b.band + ' ' + birdShortLabel(b); }))),
          lead: function () { var t = makeThumb(waybillThumbSpec(w)); return pickLead(t, info.text, waybillStateLabel(w)); } };
      });
    }
    if (kind === 'health') {
      return HEALTH_RECORDS_SAMPLE.filter(keep).map(function (r) {
        var b = getBird(r.birdId);
        var sub = [formatDate(r.date), b ? birdShortLabel(b) + (b.band ? ' · ' + b.band : '') : ''].filter(Boolean).join(' · ');
        return { id: r.id, title: r.type, sub: sub, hay: lowerJoin([r.provider, b ? b.band : '']),
          lead: function () { return pickLead(makeThumb(healthThumbSpec(r)), r.type, sub); } };
      });
    }
    if (kind === 'supplies') {
      return SUPPLIES_SAMPLE.filter(keep).map(function (s) {
        var sub = [s.category, supplyAmount(s)].filter(Boolean).join(' · ');
        var url = mediaMainPhotoUrl('supply', s.id);
        return { id: s.id, title: s.name, sub: sub, hay: lowerJoin([s.brand, s.category, s.description]),
          lead: function () { return pickLead(makeThumb(url ? { src: url } : { icon: 'icons/tinted/aviary/Supplies.png' }), s.name, sub); } };
      });
    }
    if (kind === 'cages') {
      return allCages().filter(keep).map(function (c) {
        var info = cagePlaceLabel(c.code);
        return { id: c.code, title: c.code, sub: info, hay: info, lead: function () { return pickLead(icon('aviary/Caging.png'), c.code, info); } };
      });
    }
    if (kind === 'buildings') {
      return BUILDINGS_SAMPLE.filter(keep).map(function (b) {
        var loc = buildingLocation(b);
        var sub = [b.code, loc ? loc.name : '', b.description].filter(Boolean).join(' · ');
        return { id: b.code, title: 'Building ' + b.nickname, sub: sub, hay: sub, lead: function () { return pickLead(icon('aviary/Caging.png'), 'Building ' + b.nickname, sub); } };
      });
    }
    return [];
  }

  return { listItems: listItems, create: create, birds: birds, contacts: contacts, locations: locations, rooms: rooms, buildings: buildings, cages: cages };
})();

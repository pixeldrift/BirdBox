// One form for adding and editing contacts, accounting entries, health records and buildings,
// built from the field lists in js/data/record-schemas.js. Reached from the pencil on a record
// (#/…/edit~<id>) or an "+ Add" button (#/…/new). Editing also offers Delete, with a confirmation.
const RecordForm = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Search-and-pick for a linked record (a contact or a bird). Returns { el, get }.
  function refPicker(kind, initialId, onChange) {
    var value = initialId || '';
    var box = el('div');
    var search = el('input', 'form-input');
    search.type = 'search';
    search.placeholder = kind === 'contact' ? 'Search contacts…' : 'Search by band, name or species…';
    var out = el('div', 'pick-results');
    box.appendChild(search);
    box.appendChild(out);

    function find(id) { return kind === 'contact' ? getContact(id) : getBird(id); }

    function draw() {
      clearEl(out);
      var chosen = value ? find(value) : null;
      if (chosen) {
        search.hidden = true;
        var row = el('div', 'pick-selected');
        row.style.alignItems = 'center';
        row.appendChild(kind === 'contact' ? contactChip(chosen, null) : birdChip(chosen, null));
        var change = el('button', 'pick-link', 'Change');
        change.type = 'button';
        change.addEventListener('click', function () { value = ''; search.value = ''; onChange(''); draw(); });
        row.appendChild(change);
        out.appendChild(row);
        return;
      }
      search.hidden = false;
      var words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return;
      var pool = kind === 'contact' ? CONTACTS_SAMPLE : BIRDS_SAMPLE;
      var found = pool.filter(function (r) {
        var hay = (kind === 'contact' ? [r.name, r.company, r.city] : [r.band, r.name, birdShortLabel(r), r.mutation]).filter(Boolean).join(' ').toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      }).slice(0, 6);
      if (!found.length) out.appendChild(el('p', 'pick-empty', 'No matches.'));
      found.forEach(function (r) {
        var o = el('button', 'pick-option');
        o.type = 'button';
        o.appendChild(kind === 'contact' ? contactPickLead(r) : birdPickLead(r));
        o.addEventListener('click', function () { value = r.id; onChange(value); draw(); });
        out.appendChild(o);
      });
    }
    search.addEventListener('input', draw);
    draw();
    return { el: box, get: function () { return value; } };
  }

  // Handles the "new" and "edit~<id>" routes for a screen. Returns true if it took over.
  function route(main, id, type, navigate, setTitle) {
    if (id === 'new') { render(main, { type: type, navigate: navigate, setTitle: setTitle }); return true; }
    if (id && id.indexOf('edit~') === 0) { render(main, { type: type, id: id.slice(5), navigate: navigate, setTitle: setTitle }); return true; }
    return false;
  }

  // opts: { type, id (edit) | prefill (new), navigate, setTitle }
  function render(main, opts) {
    clearEl(main);
    var def = RECORD_TYPES_UI[opts.type];
    var editing = !!opts.id;
    var rec = editing ? findRecord(opts.type, opts.id) : null;
    if (editing && !rec) { main.appendChild(el('p', '', 'That ' + def.singular + ' wasn’t found.')); return; }
    opts.setTitle((editing ? 'Edit ' : 'Add ') + def.singular.replace(/^./, function (c) { return c.toUpperCase(); }));

    // Buildings don't have a page of their own — go back to the cage list instead.
    function goTo(recId) {
      if (opts.type === 'buildings') location.hash = def.hash.replace(/\/$/, ''); else opts.navigate(recId);
    }

    var base = Object.assign({}, def.defaults, opts.prefill || {}, rec || {});
    var getters = {};
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');

    def.fields.forEach(function (f) {
      if (f.createOnly && editing) return;
      var control, get;
      var current = base[f.key] === null || base[f.key] === undefined ? '' : base[f.key];
      if (f.ref) {
        var rp = refPicker(f.ref, current, function () {});
        control = rp.el;
        get = rp.get;
      } else if (f.type === 'enum') {
        control = el('select', 'form-input');
        if (!f.required) { var blank = el('option', '', '—'); blank.value = ''; control.appendChild(blank); }
        f.options.forEach(function (o) { var opt = el('option', '', o); opt.value = o; control.appendChild(opt); });
        control.value = current;
        get = function () { return control.value; };
      } else if (f.type === 'textarea') {
        control = el('textarea', 'form-input');
        control.rows = 3;
        control.value = current;
        get = function () { return control.value; };
      } else {
        control = el('input', 'form-input');
        control.type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
        if (f.type === 'number') control.step = '0.01';
        control.value = f.type === 'date' ? String(current).slice(0, 10) : current;
        get = function () { return control.value; };
      }
      getters[f.key] = get;
      var label = el(f.ref ? 'div' : 'label', 'form-field');
      label.appendChild(el('span', 'form-label', f.label + (f.required ? ' *' : '')));
      label.appendChild(control);
      if (f.hint) label.appendChild(el('p', 'form-note', f.hint));
      form.appendChild(label);
    });

    var errorBox = el('div');
    var save = el('button', 'save-btn', editing ? 'Save Changes' : 'Add ' + def.singular.replace(/^./, function (c) { return c.toUpperCase(); }));
    save.type = 'submit';
    form.appendChild(errorBox);
    form.appendChild(save);

    var cancel = el('button', 'add-record-btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', function () {
      if (editing) goTo(opts.id); else location.hash = def.hash.replace(/\/$/, '');
    });
    form.appendChild(cancel);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      var data = {};
      Object.keys(getters).forEach(function (k) { data[k] = getters[k](); });
      save.disabled = true;
      var label = save.textContent;
      save.textContent = 'Saving…';
      var job = editing ? updateRecord(opts.type, opts.id, data) : createRecord(opts.type, data);
      job.then(function (saved) {
        goTo(saved[def.pk]);
      }).catch(function (err) {
        save.disabled = false;
        save.textContent = label;
        errorBox.appendChild(el('p', 'form-message error', err.message));
      });
    });
    wrap.appendChild(form);

    // Delete — only when editing, and only after confirming.
    if (editing) {
      var danger = el('div', 'detail-section');
      var del = el('button', 'add-record-btn danger-btn', 'Delete this ' + def.singular);
      del.type = 'button';
      var delMsg = el('div');
      del.addEventListener('click', function () {
        var note = opts.type === 'contacts' ? ' Their shipments and accounting entries stay, just no longer linked to them.' :
          opts.type === 'buildings' ? ' Birds in its cages keep their cage numbers.' : '';
        if (!window.confirm('Delete “' + def.nameOf(rec) + '”?' + note + ' This can’t be undone.')) return;
        del.disabled = true;
        deleteRecord(opts.type, opts.id).then(function () {
          location.hash = def.hash.replace(/\/$/, '');
        }).catch(function (err) {
          del.disabled = false;
          clearEl(delMsg);
          delMsg.appendChild(el('p', 'form-message error', err.message));
        });
      });
      danger.appendChild(del);
      danger.appendChild(delMsg);
      wrap.appendChild(danger);
    }

    main.appendChild(wrap);
  }

  return { render: render, route: route };
})();

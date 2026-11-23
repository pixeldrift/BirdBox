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

  var PICKERS = { contact: 'contacts', bird: 'birds', place: 'places', user: 'users' };

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
    opts.setTitle((editing ? 'Edit ' : 'Add ') + T(def.singular).replace(/^./, function (c) { return c.toUpperCase(); }));

    // Where to go after saving: the caller's choice, else that record's own page.
    function goTo(recId) {
      if (opts.after) opts.after(recId); else opts.navigate(recId);
    }

    var base = Object.assign({}, def.defaults, opts.prefill || {}, rec || {});
    var getters = {};
    var fieldEls = {};
    var hiddenValues = {};
    var controls = {};
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');

    def.fields.forEach(function (f) {
      if (f.createOnly && editing) return;
      if (opts.hide && opts.hide.indexOf(f.key) !== -1) { if (!editing) hiddenValues[f.key] = base[f.key]; return; } // e.g. someone editing their own profile doesn't change their own role; a new record keeps its prefilled value
      var control, get;
      var current = base[f.key] === null || base[f.key] === undefined ? '' : base[f.key];
      if (f.ref) {
        var rp = Picker[PICKERS[f.ref]](Object.assign({ value: current, allowClear: !f.required }, f.pickerOpts ? f.pickerOpts(rec) : {}));
        control = rp.el;
        get = rp.get;
      } else if (f.type === 'placetype') {
        // pick from the types (the ones that ship with the app, ones you've made, ones in use) — or make a new one right here
        control = el('div');
        var sel = el('select', 'form-input');
        placeTypes().forEach(function (t) { var o = el('option', '', placeTypeLabel(t)); o.value = t; sel.appendChild(o); });
        var neu = el('option', '', '+ A new kind of place…'); neu.value = '__new__'; sel.appendChild(neu);
        if (current && placeTypes().indexOf(current) === -1) { var cur = el('option', '', current); cur.value = current; sel.insertBefore(cur, neu); }
        sel.value = current || leafPlaceType();
        var custom = el('input', 'form-input');
        custom.placeholder = 'Name it — e.g. Hutch, Pasture, Tractor';
        custom.style.display = 'none';
        custom.style.marginTop = '8px';
        sel.addEventListener('change', function () { custom.style.display = sel.value === '__new__' ? '' : 'none'; if (sel.value === '__new__') custom.focus(); });
        control.appendChild(sel);
        control.appendChild(custom);
        get = function () { return sel.value === '__new__' ? custom.value.trim() : sel.value; };
        control.addEventListener('change', function () {}); // (the select's own change event bubbles to showWhen handlers)
      } else if (f.type === 'checks') {
        // tick any number of the options; the value is a comma-separated list
        control = el('div', 'check-list');
        var have = String(current).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        var boxes = f.options.map(function (o) {
          var row = el('label', 'check-row');
          var cb = el('input'); cb.type = 'checkbox'; cb.checked = have.indexOf(o) !== -1; cb.value = o;
          row.appendChild(cb); row.appendChild(el('span', '', o));
          control.appendChild(row);
          return cb;
        });
        get = function () { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }).join(', '); };
      } else if (f.type === 'enum') {
        control = el('select', 'form-input');
        if (!f.required) { var blank = el('option', '', '—'); blank.value = ''; control.appendChild(blank); }
        f.options.forEach(function (o) { var opt = el('option', '', o); opt.value = o; control.appendChild(opt); });
        control.value = current;
        get = function () { return control.value; };
      } else if (f.type === 'suggest') {
        // free text with tappable suggestions underneath (e.g. the disease a test was for)
        var inner = el('input', 'form-input');
        inner.placeholder = f.placeholder || 'Type, or tap one below';
        inner.value = current;
        var chipsRow = el('div', 'suggest-chips');
        (f.suggestions() || []).forEach(function (s) {
          var chip = el('button', 'loc-chip suggest-chip', s);
          chip.type = 'button';
          chip.addEventListener('click', function () { inner.value = s; });
          chipsRow.appendChild(chip);
        });
        control = el('div');
        control.appendChild(inner);
        control.appendChild(chipsRow);
        get = function () { return inner.value.trim(); };
      } else if (f.type === 'textarea') {
        control = el('textarea', 'form-input');
        control.rows = 3;
        control.value = current;
        get = function () { return control.value; };
      } else {
        control = el('input', 'form-input');
        control.type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text';
        if (f.type === 'phone') control.addEventListener('blur', function () { control.value = formatPhone(control.value); });
        if (f.type === 'number') control.step = '0.01';
        control.value = f.type === 'date' ? String(current).slice(0, 10) : current;
        get = function () { return control.value; };
      }
      getters[f.key] = get;
      var label = el(f.ref || f.type === 'suggest' || f.type === 'placetype' || f.type === 'checks' ? 'div' : 'label', 'form-field');
      fieldEls[f.key] = label;
      controls[f.key] = control;
      label.appendChild(el('span', 'form-label', T(f.label) + (f.required || f.requiredIfShown ? ' *' : '')));
      label.appendChild(control);
      if (f.hint) label.appendChild(el('p', 'form-note', T(f.hint)));
      form.appendChild(label);
    });

    // Fields that only apply for one value of another field (a test's disease and result show for 'Disease Test').
    function shown(f) { return !f.showWhen || getters[f.showWhen.key]() === f.showWhen.value; }
    def.fields.forEach(function (f) {
      if (!f.showWhen || !fieldEls[f.key] || !controls[f.showWhen.key]) return;
      var sync = function () { fieldEls[f.key].style.display = shown(f) ? '' : 'none'; };
      controls[f.showWhen.key].addEventListener('change', sync);
      sync();
    });

    var errorBox = el('div');
    var save = el('button', 'save-btn', editing ? 'Save Changes' : 'Add ' + def.singular.replace(/^./, function (c) { return c.toUpperCase(); }));
    save.type = 'submit';
    form.appendChild(errorBox);

    var cancel = el('button', 'add-record-btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', function () {
      if (opts.onCancel) opts.onCancel(); else if (editing) goTo(opts.id); else location.hash = def.hash.replace(/\/$/, '');
    });
    var actions = el('div', 'form-actions'); // small, side by side, Save on the right
    actions.appendChild(cancel);
    actions.appendChild(save);
    form.appendChild(actions);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      var data = Object.assign({}, hiddenValues);
      Object.keys(getters).forEach(function (k) { data[k] = getters[k](); });
      var missing = def.fields.filter(function (f) { return f.showWhen && shown(f) && f.requiredIfShown && !data[f.key]; })[0];
      if (missing) { errorBox.appendChild(el('p', 'form-message error', missing.label + ' is required')); return; }
      def.fields.forEach(function (f) { if (f.showWhen && !shown(f)) data[f.key] = ''; });
      save.disabled = true;
      var label = save.textContent;
      save.textContent = 'Saving…';
      var job = editing ? updateRecord(opts.type, opts.id, data) : createRecord(opts.type, data);
      job.then(function (saved) {
        if (def.afterSave) def.afterSave(Object.assign({}, data, saved));
        goTo(saved[def.pk]);
      }).catch(function (err) {
        save.disabled = false;
        save.textContent = label;
        errorBox.appendChild(el('p', 'form-message error', err.message));
      });
    });
    wrap.appendChild(form);

    // Delete — only when editing, and only after confirming.
    if (editing && !def.noDelete && !opts.noDelete) {
      var danger = el('div', 'detail-section');
      var del = el('button', 'add-record-btn danger-btn', 'Delete this ' + def.singular);
      del.type = 'button';
      var delMsg = el('div');
      del.addEventListener('click', function () {
        var inCage = opts.type === 'places' ? birdsInCage(opts.id).length : 0;
        var inside = opts.type === 'places' ? placeChildren(opts.id).length : 0;
        var note = opts.type === 'contacts' ? ' Their shipments and accounting entries stay, just no longer linked to them.' :
          opts.type === 'places' ? (inside ? ' What’s inside it (' + inside + ') moves up one level.' : '') + (inCage ? ' The ' + inCage + ' bird' + (inCage === 1 ? '' : 's') + ' in it will be left with no place.' : '') : '';
        Modal.confirm({
          title: 'Delete ' + def.singular + '?', message: 'Delete “' + def.nameOf(rec) + '”?' + note + ' This can’t be undone.', confirmLabel: 'Delete', danger: true,
          onConfirm: function () {
            del.disabled = true;
            deleteRecord(opts.type, opts.id).then(function () {
              if (opts.afterDelete) opts.afterDelete(); else location.hash = def.hash.replace(/\/$/, '');
            }).catch(function (err) {
              del.disabled = false;
              clearEl(delMsg);
              delMsg.appendChild(el('p', 'form-message error', err.message));
            });
          },
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

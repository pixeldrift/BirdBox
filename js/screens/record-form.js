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

  var PICKERS = { contact: 'contacts', bird: 'birds', location: 'locations', building: 'buildings', room: 'rooms', user: 'users' };

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

    // Where to go after saving: the caller's choice, else that record's own page.
    function goTo(recId) {
      if (opts.after) opts.after(recId); else opts.navigate(recId);
    }

    var base = Object.assign({}, def.defaults, opts.prefill || {}, rec || {});
    var getters = {};
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');

    def.fields.forEach(function (f) {
      if (f.createOnly && editing) return;
      if (opts.hide && opts.hide.indexOf(f.key) !== -1) return; // e.g. someone editing their own profile doesn't change their own role
      var control, get;
      var current = base[f.key] === null || base[f.key] === undefined ? '' : base[f.key];
      if (f.ref) {
        var rp = Picker[PICKERS[f.ref]]({ value: current, allowClear: !f.required });
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
        control.type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'phone' ? 'tel' : 'text';
        if (f.type === 'phone') control.addEventListener('blur', function () { control.value = formatPhone(control.value); });
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
      if (opts.onCancel) opts.onCancel(); else if (editing) goTo(opts.id); else location.hash = def.hash.replace(/\/$/, '');
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
    if (editing && !def.noDelete && !opts.noDelete) {
      var danger = el('div', 'detail-section');
      var del = el('button', 'add-record-btn danger-btn', 'Delete this ' + def.singular);
      del.type = 'button';
      var delMsg = el('div');
      del.addEventListener('click', function () {
        var inCage = opts.type === 'cages' ? birdsInCage(opts.id).length : 0;
        var note = opts.type === 'contacts' ? ' Their shipments and accounting entries stay, just no longer linked to them.' :
          opts.type === 'buildings' ? ' Its cages stay, just no longer filed under it.' :
          opts.type === 'locations' ? ' Its buildings stay, just no longer on a location.' :
          opts.type === 'cages' ? (inCage ? ' The ' + inCage + ' bird' + (inCage === 1 ? '' : 's') + ' in it will be left with no cage.' : '') : '';
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

// Adding birds: a single-bird form (#/mybirds/birds/new) and a CSV batch import
// (#/mybirds/birds/import). Both end up in addBirds() (js/data/birds-sample.js), which
// POSTs to /api/birds — the server re-validates everything, so this file's checks are
// for fast, friendly feedback, not the only line of defense.
const BirdsAddScreen = (function () {
  var SEXES = ['Male', 'Female', 'Unsexed'];
  var STATUSES = ['Available', 'Reserved', 'Sold', 'Deceased'];

  var TEMPLATE_HEADERS = ['band', 'name', 'sex', 'species', 'subspecies', 'mutation', 'hatch_date',
    'status', 'cage', 'mother_band', 'father_band', 'paired_band', 'cost', 'price', 'registry_public', 'notes'];
  // species = the common name you know the bird by; it's matched to the standard species list.
  var TEMPLATE_EXAMPLES = [
    ['AR 20001 CA', 'Pepper', 'Female', 'Green-cheeked Conure', '', 'Cinnamon', '2024-03-15', 'Available', 'F2-004', '', '', '', '250', '650', 'no', 'Example row — replace or delete me'],
    ['AR 20002 CA', '', 'Male', 'Cockatiel', '', 'Lutino', '3/2/2024', 'Reserved', '', '', '', 'AR 20001 CA', '', '120', 'yes', ''],
  ];
  var REQUIRED_COLUMNS = ['sex'];

  function distinct(values) {
    var seen = {};
    return values.filter(function (v) {
      if (!v || seen[v]) return false;
      seen[v] = true;
      return true;
    }).sort();
  }

  function isRealDate(y, m, d) {
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function normalizeDate(v) {
    v = (v || '').trim();
    if (!v) return { value: '' };
    var bad = { error: 'Hatch date "' + v + '" isn’t a real date — use YYYY-MM-DD or M/D/YYYY' };
    var iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return isRealDate(+iso[1], +iso[2], +iso[3]) ? { value: v } : bad;
    var us = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us && isRealDate(+us[3], +us[1], +us[2])) {
      return { value: us[3] + '-' + ('0' + us[1]).slice(-2) + '-' + ('0' + us[2]).slice(-2) };
    }
    return bad;
  }

  function matchOption(v, options) {
    var lower = (v || '').trim().toLowerCase();
    return options.filter(function (o) { return o.toLowerCase() === lower; })[0] || null;
  }

  function parseBool(v) {
    return /^(yes|y|true|1)$/i.test((v || '').trim());
  }

  // Friendly validation shared by the form and the CSV preview. `raw` uses the same keys
  // as the API; parent fields are bird ids (already resolved by the caller).
  function check(raw, extraIds) {
    var band = (raw.band || '').trim().replace(/\s+/g, ' '); // optional: some birds have no band
    if (!raw.speciesCode) return { error: 'Choose a species' };
    var sex = matchOption(raw.sex, SEXES);
    if (!sex) return { error: 'Sex must be Male, Female, or Unsexed' };
    var status = raw.status ? matchOption(raw.status, STATUSES) : 'Available';
    if (!status) return { error: 'Status must be one of ' + STATUSES.join(', ') };
    var date = normalizeDate(raw.hatchDate);
    if (date.error) return { error: date.error };
    var cost = (raw.cost || '').toString().replace(/[$,\s]/g, '');
    var price = (raw.price || '').toString().replace(/[$,\s]/g, '');
    if ((cost && isNaN(Number(cost))) || (price && isNaN(Number(price)))) return { error: 'Cost and price must be numbers' };
    if (band && findBirdByBand(band)) return { error: 'A bird with band ' + band + ' already exists' };
    var id = raw.id || newBirdId();
    var bird = {
      id: id, band: band, name: (raw.name || '').trim(), sex: sex, speciesCode: raw.speciesCode, speciesName: raw.speciesName || '',
      subspecies: (raw.subspecies || '').trim(), mutation: (raw.mutation || '').trim(),
      hatchDate: date.value, hatchPrecision: raw.hatchPrecision || 'day', hatchApprox: !!raw.hatchApprox, status: status, cage: (raw.cage || '').trim(),
      locationContactId: raw.locationContactId || '', locationText: (raw.locationText || '').trim(),
      motherId: raw.motherId || '', fatherId: raw.fatherId || '', pairedId: raw.pairedId || '',
      cost: cost, price: price, registryPublic: !!raw.registryPublic, notes: (raw.notes || '').trim(),
    };
    return { bird: bird, id: id };
  }

  function field(labelText, control, hint, asDiv) {
    // asDiv: for controls with their own buttons/links (the species picker), where a wrapping
    // <label> would hijack clicks.
    var label = document.createElement(asDiv ? 'div' : 'label');
    label.className = 'form-field';
    var span = document.createElement('span');
    span.className = 'form-label';
    span.textContent = labelText;
    label.appendChild(span);
    label.appendChild(control);
    if (hint) {
      var note = document.createElement('p');
      note.className = 'form-note';
      note.textContent = hint;
      label.appendChild(note);
    }
    return label;
  }

  function input(type, extra) {
    var el = document.createElement('input');
    el.type = type;
    el.className = 'form-input';
    Object.keys(extra || {}).forEach(function (k) { el[k] = extra[k]; });
    return el;
  }

  function select(options, blankLabel) {
    var el = document.createElement('select');
    el.className = 'form-input';
    if (blankLabel !== undefined) {
      var blank = document.createElement('option');
      blank.value = '';
      blank.textContent = blankLabel;
      el.appendChild(blank);
    }
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      el.appendChild(opt);
    });
    return el;
  }

  function datalist(id, values) {
    var dl = document.createElement('datalist');
    dl.id = id;
    values.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v;
      dl.appendChild(opt);
    });
    return dl;
  }

  function message(kind, text) {
    var p = document.createElement('p');
    p.className = 'form-message ' + kind;
    p.textContent = text;
    return p;
  }

  // `editing` (optional): a bird to change instead of adding a new one. Its band number stays fixed
  // because other records (parents, shipments, files…) point at it.
  // Hatch date as three small dropdowns — year, month, day — each with "-Unspecified-" on top, so a
  // bird can be dated by year, by month, or by day, plus an "approximate" tick. A day needs a month.
  function hatchField(initial) {
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var iso = initial && initial.hatchDate ? String(initial.hatchDate).slice(0, 10) : '';
    var prec = (initial && initial.hatchPrecision) || 'day';
    var y0 = iso ? +iso.slice(0, 4) : 0, m0 = iso && prec !== 'year' ? +iso.slice(5, 7) : 0, d0 = iso && prec === 'day' ? +iso.slice(8, 10) : 0;
    var root = document.createElement('div');
    var row = document.createElement('div');
    row.className = 'hatch-row';
    function sel(options, value) {
      var s = document.createElement('select');
      s.className = 'form-input';
      var none = document.createElement('option');
      none.value = '';
      none.textContent = '-Unspecified-';
      s.appendChild(none);
      options.forEach(function (o) { var e = document.createElement('option'); e.value = o[0]; e.textContent = o[1]; s.appendChild(e); });
      s.value = value ? String(value) : '';
      return s;
    }
    var thisYear = new Date().getFullYear();
    var years = []; for (var y = thisYear; y >= thisYear - 60; y--) years.push([y, String(y)]);
    if (y0 && y0 < thisYear - 60) years.push([y0, String(y0)]);
    var yearSel = sel(years, y0);
    var monthSel = sel(MONTHS.map(function (m, i) { return [i + 1, m]; }), m0);
    var daySel = sel([], d0);
    function fillDays() {
      var keep = daySel.value;
      var n = yearSel.value && monthSel.value ? new Date(+yearSel.value, +monthSel.value, 0).getDate() : 31;
      while (daySel.options.length > 1) daySel.removeChild(daySel.lastChild);
      for (var d = 1; d <= n; d++) { var o = document.createElement('option'); o.value = d; o.textContent = d; daySel.appendChild(o); }
      daySel.value = keep && +keep <= n ? keep : '';
    }
    function sync() {
      monthSel.disabled = !yearSel.value;
      if (!yearSel.value) monthSel.value = '';
      daySel.disabled = !monthSel.value;
      if (!monthSel.value) daySel.value = '';
      fillDays();
    }
    yearSel.addEventListener('change', sync);
    monthSel.addEventListener('change', sync);
    fillDays();
    daySel.value = d0 ? String(d0) : '';
    sync();
    [['Year', yearSel], ['Month', monthSel], ['Day', daySel]].forEach(function (p) {
      var cell = document.createElement('label');
      cell.className = 'hatch-cell';
      var l = document.createElement('span');
      l.className = 'form-note';
      l.textContent = p[0];
      cell.appendChild(l);
      cell.appendChild(p[1]);
      row.appendChild(cell);
    });
    var approx = document.createElement('input');
    approx.type = 'checkbox';
    approx.checked = !!(initial && initial.hatchApprox);
    var approxLabel = document.createElement('label');
    approxLabel.className = 'form-note hatch-approx';
    approxLabel.appendChild(approx);
    approxLabel.appendChild(document.createTextNode(' Approximate'));
    var age = document.createElement('div');
    age.className = 'form-note';
    root.appendChild(row);
    root.appendChild(approxLabel);
    root.appendChild(age);
    function value() {
      var yv = yearSel.value, mv = monthSel.value, dv = daySel.value;
      if (!yv) return { hatchDate: '', hatchPrecision: 'day', hatchApprox: false };
      var precision = dv ? 'day' : mv ? 'month' : 'year';
      var date = yv + '-' + ('0' + (mv || 1)).slice(-2) + '-' + ('0' + (dv || 1)).slice(-2);
      return { hatchDate: date, hatchPrecision: precision, hatchApprox: approx.checked };
    }
    function showAge() {
      var v = value();
      var a = v.hatchDate ? birdAge(v) : '';
      age.textContent = a ? 'Age: ' + a : '';
    }
    root.addEventListener('change', showAge);
    showAge();
    return { el: root, get: value };
  }

  function renderForm(main, navigate, setTitle, editing) {
    clearEl(main);
    setTitle(editing ? 'Edit Bird' : 'Add Bird');

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';
    var form = document.createElement('form');
    form.className = 'detail-section record-form';

    var band = input('text', { placeholder: 'e.g. AR 20001 CA' });
    var name = input('text', { placeholder: 'Optional' });
    var sex = select(SEXES.map(function (s) { return { value: s, label: s }; }));
    sex.value = 'Unsexed';
    var picked = editing && editing.speciesCode ? { code: editing.speciesCode, name: editing.speciesName, scientificName: editing.scientificName } : null;
    var speciesPicker = SpeciesPicker.create({
      value: picked,
      onChange: function (s) {
        picked = s;

      },
    });
    var subspecies = input('text', { placeholder: 'Only if it applies — e.g. Congo, Timneh' });
    var mutation = input('text', { placeholder: 'Optional' });
    var hatchCtl = hatchField(editing);
    var status = select(STATUSES.map(function (s) { return { value: s, label: s }; }));
    var locCtl = BirdPopups.locationField({ cage: editing ? editing.cage : '', contactId: editing ? editing.locationContactId : '', text: editing ? editing.locationText : '' });
    var selfIds = editing ? [editing.id] : [];
    var mother = Picker.birds({ value: editing ? editing.motherId : '', exclude: selfIds, allowClear: true, placeholder: 'Unknown — search to choose…' });
    var father = Picker.birds({ value: editing ? editing.fatherId : '', exclude: selfIds, allowClear: true, placeholder: 'Unknown — search to choose…' });
    var paired = Picker.birds({ value: editing ? editing.pairedId : '', exclude: selfIds, allowClear: true, placeholder: 'Not paired — search to choose…' });
    var cost = input('number', { min: '0', step: '0.01', placeholder: '0.00' });
    var price = input('number', { min: '0', step: '0.01', placeholder: '0.00' });
    var notes = document.createElement('textarea');
    notes.className = 'form-input';
    notes.rows = 3;


    var errorBox = document.createElement('div');
    var saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = editing ? 'Save Changes' : 'Add Bird';

    if (editing) {
      band.value = editing.band || '';
      name.value = editing.name || '';
      sex.value = editing.sex;
      subspecies.value = editing.subspecies || '';
      mutation.value = editing.mutation || '';
      status.value = editing.status;
      cost.value = editing.cost === null || editing.cost === undefined ? '' : editing.cost;
      price.value = editing.price === null || editing.price === undefined ? '' : editing.price;
      notes.value = editing.notes || '';
    }

    [field('Band number', band, 'Optional — leave blank if this bird has no band.'), field('Name', name), field('Sex', sex), field('Species', speciesPicker.el, 'Search by any name you know — common, trade, or scientific.', true),
      field('Subspecies / form', subspecies), field('Mutation', mutation), field('Hatch date', hatchCtl.el, undefined, true),
      field('Status', status), field('Location', locCtl.el, undefined, true), field('Mother', mother.el, undefined, true), field('Father', father.el, undefined, true),
      field('Paired with', paired.el, undefined, true), field('Cost', cost), field('Asking price', price), field('Notes', notes),
      errorBox, saveBtn].forEach(function (el) { form.appendChild(el); });
    SuggestInput.attach(subspecies, function () { return suggestItems(picked, 'subspecies'); });
    SuggestInput.attach(mutation, function () { return suggestItems(picked, 'mutation'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      if (editing) { saveEdit(); return; }
      var result = check({
        band: band.value, name: name.value, sex: sex.value,
        speciesCode: picked ? picked.code : '', speciesName: picked ? picked.name : '',
        subspecies: subspecies.value, mutation: mutation.value, hatchDate: hatchCtl.get().hatchDate, hatchPrecision: hatchCtl.get().hatchPrecision, hatchApprox: hatchCtl.get().hatchApprox,
        status: status.value, cage: locCtl.get().cage, locationContactId: locCtl.get().locationContactId, locationText: locCtl.get().locationText, motherId: mother.get(), fatherId: father.get(),
        pairedId: paired.get(), cost: cost.value, price: price.value, notes: notes.value,
      });
      if (result.error) {
        errorBox.appendChild(message('error', result.error));
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addBirds([result.bird]).then(function (data) {
        if (data.created.length) {
          // Started from "Add New Bird" in a shipment? Hand the bird back to it.
          var back = BirdsAddScreen.afterAdd;
          BirdsAddScreen.afterAdd = null;
          if (back) back(data.created[0]); else navigate(data.created[0].id);
        } else {
          throw new Error(data.rejected.length ? data.rejected[0].error : 'Could not save this bird');
        }
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Add Bird';
        errorBox.appendChild(message('error', err.message));
      });
    });

    // Saving changes to an existing bird.
    function saveEdit() {
      if (!picked) { errorBox.appendChild(message('error', 'Choose a species')); return; }
      var date = { value: hatchCtl.get().hatchDate };
      if ((cost.value && isNaN(Number(cost.value))) || (price.value && isNaN(Number(price.value)))) {
        errorBox.appendChild(message('error', 'Cost and price must be numbers'));
        return;
      }
      var wasSold = editing.status === 'Sold';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      editBird(editing.id, {
        band: band.value, name: name.value, sex: sex.value, speciesCode: picked.code, subspecies: subspecies.value, mutation: mutation.value,
        hatchDate: date.value, hatchPrecision: hatchCtl.get().hatchPrecision, hatchApprox: hatchCtl.get().hatchApprox, status: status.value, cage: locCtl.get().cage, locationContactId: locCtl.get().locationContactId, locationText: locCtl.get().locationText, motherId: mother.get(), fatherId: father.get(),
        pairedId: paired.get(), cost: cost.value, price: price.value, notes: notes.value,
      }).then(function (bird) {
        if (status.value === 'Sold' && !wasSold) {
          // Newly marked Sold: ask about shipping / a hand-over / ownership, like the status chips do.
          clearEl(main);
          var done = document.createElement('div');
          done.className = 'detail-screen';
          done.appendChild(message('info', 'Saved.'));
          var follow = document.createElement('div');
          done.appendChild(follow);
          main.appendChild(done);
          SoldFollowUp.render(follow, bird, function () { navigate(bird.id); });
          return;
        }
        navigate(bird.id);
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        errorBox.appendChild(message('error', err.message));
      });
    }

    wrap.appendChild(form);

    // Deleting a bird — always asks first, and says what goes with it.
    if (editing) {
      var danger = document.createElement('div');
      danger.className = 'detail-section';
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'add-record-btn danger-btn';
      del.textContent = 'Delete this bird';
      var delMsg = document.createElement('div');
      del.addEventListener('click', function () {
        var records = HEALTH_RECORDS_SAMPLE.filter(function (r) { return r.birdId === editing.id; }).length;
        var text = 'Delete ' + birdShortLabel(editing) + (editing.band ? ' (' + editing.band + ')' : '') + '?' +
          (records ? ' Its ' + records + ' health record' + (records === 1 ? '' : 's') + ' will be deleted too.' : '') +
          ' Photos stay in the Media library. Shipments, accounting entries and its offspring keep their records but no longer link to it. This can’t be undone.';
        Modal.confirm({
          title: 'Delete this bird?', message: text, confirmLabel: 'Delete', danger: true,
          onConfirm: function () {
            del.disabled = true;
            deleteBird(editing.id).then(function () {
              location.hash = '#/mybirds/birds';
            }).catch(function (err) {
              del.disabled = false;
              clearEl(delMsg);
              delMsg.appendChild(message('error', err.message));
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

  // ---- chickens and other domestic birds: starter lists for the breed / colour fields ----
  var DOMESTIC = {
    colours: ['White', 'Black', 'Blue', 'Splash', 'Buff', 'Partridge', 'Gray', 'Lavender', 'Naked neck'],
  };
  function isChicken(species) {
    return !!species && /^Gallus gallus/i.test(species.scientificName || '');
  }
  // What to suggest for the breed / colour boxes: values already used on this species (yours first), then, for chickens,
  // the standard breeds (js/data/domestic-breeds.js) and a starter list of colours.
  function suggestItems(species, key) {
    var used = distinct(BIRDS_SAMPLE.filter(function (b) { return species && b.speciesCode === species.code; }).map(function (b) { return b[key]; }));
    var out = used.map(function (v) { return { value: v, hint: 'In your flock' }; });
    var extra = key === 'subspecies' ? domesticBreedsFor(species).map(function (x) { return { value: x.name, hint: x.hint }; })
      : (isChicken(species) ? DOMESTIC.colours.map(function (v) { return { value: v }; }) : []);
    var seen = {};
    out.forEach(function (o) { seen[o.value.toLowerCase()] = true; });
    extra.forEach(function (o) { if (!seen[o.value.toLowerCase()]) { seen[o.value.toLowerCase()] = true; out.push(o); } });
    return out;
  }

  // A hatch: add a whole batch of chicks (or poults, or squabs…) in one go — same parents, hatch date, breed and place.
  // Bands are optional and can be given now (one per line, in order) or added later from the banding list.
  function renderClutch(main, navigate, setTitle, prefill) {
    clearEl(main);
    setTitle(T('Add a clutch'));
    prefill = prefill || BirdsAddScreen.clutchPrefill || {};
    BirdsAddScreen.clutchPrefill = null;
    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';
    var form = document.createElement('form');
    form.className = 'detail-section record-form';

    var mother = Picker.birds({ value: prefill.motherId || '', allowClear: true, placeholder: 'Unknown — search to choose…', onChange: function () { inherit(); } });
    var father = Picker.birds({ value: prefill.fatherId || '', allowClear: true, placeholder: 'Unknown — search to choose…', onChange: function () { inherit(); } });
    var picked = null;
    function fillLists() { /* the suggestion boxes read `picked` each time they open */ }
    var speciesPicker = SpeciesPicker.create({ value: null, onChange: function (s) { picked = s; fillLists(); } });
    var breed = input('text', { placeholder: 'Only if it applies — e.g. Silkie' });
    var colour = input('text', { placeholder: 'Optional — e.g. White, Naked neck' });
    var today = new Date().toISOString().slice(0, 10);
    var hatchCtl = hatchField({ hatchDate: today, hatchPrecision: 'day' });
    var count = input('number', { min: '1', max: '100', value: '6' });
    var locCtl = BirdPopups.locationField({ cage: prefill.cage || '', contactId: '', text: '' });
    var bands = document.createElement('textarea');
    bands.className = 'form-input';
    bands.rows = 3;
    bands.placeholder = 'Optional — one band number per line, in order';
    var notes = document.createElement('textarea');
    notes.className = 'form-input';
    notes.rows = 2;
    var errorBox = document.createElement('div');
    var saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = T('Add the clutch');

    // Picking a parent fills in the species, breed and colour from it, if those are still empty.
    function inherit() {
      var parent = getBird(mother.get()) || getBird(father.get());
      if (!parent || picked) return;
      if (parent.speciesCode) {
        picked = { code: parent.speciesCode, name: parent.speciesName, scientificName: parent.scientificName };
        speciesPicker.set(picked);
        if (!breed.value) breed.value = parent.subspecies || '';
        fillLists();
      }
    }
    inherit(); // started from a bird's page: the parents are already chosen

    [field('Mother', mother.el, undefined, true), field('Father', father.el, undefined, true),
      field('Species', speciesPicker.el, 'Search by any name you know — Chicken, Sun Conure…', true),
      field('Breed / form', breed), field('Colour / mutation', colour), field('Hatch date', hatchCtl.el, undefined, true),
      field('How many hatched', count, 'They’re added as unsexed chicks with no band — add the sex when the DNA result is back and the bands when you have them.'),
      field('Where they are', locCtl.el, undefined, true),
      field('Band numbers', bands, 'Optional. Only fill in the ones you’ve already assigned — the rest can be done later from the banding list.'),
      field('Notes', notes), errorBox, saveBtn].forEach(function (e) { form.appendChild(e); });
    SuggestInput.attach(breed, function () { return suggestItems(picked, 'subspecies'); });
    SuggestInput.attach(colour, function () { return suggestItems(picked, 'mutation'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      if (!picked) { errorBox.appendChild(message('error', 'Choose a species')); return; }
      var n = Math.round(Number(count.value));
      if (!(n >= 1 && n <= 100)) { errorBox.appendChild(message('error', 'How many hatched? Enter a number from 1 to 100.')); return; }
      var bandLines = bands.value.split('\n').map(function (l) { return l.trim(); });
      var hatch = hatchCtl.get();
      var list = [];
      for (var i = 0; i < n; i++) {
        var r = check({
          band: bandLines[i] || '', name: '', sex: 'Unsexed', speciesCode: picked.code, speciesName: picked.name,
          subspecies: breed.value, mutation: colour.value, hatchDate: hatch.hatchDate, hatchPrecision: hatch.hatchPrecision, hatchApprox: hatch.hatchApprox,
          status: 'Available', cage: locCtl.get().cage, locationContactId: locCtl.get().locationContactId, locationText: locCtl.get().locationText,
          motherId: mother.get(), fatherId: father.get(), pairedId: '', notes: notes.value,
        });
        if (r.error) { errorBox.appendChild(message('error', (bandLines[i] ? 'Band ' + bandLines[i] + ': ' : 'Chick ' + (i + 1) + ': ') + r.error)); return; }
        list.push(r.bird);
      }
      var dup = {};
      for (var j = 0; j < list.length; j++) {
        var k = list[j].band ? bandKey(list[j].band) : '';
        if (k && dup[k]) { errorBox.appendChild(message('error', 'Band ' + list[j].band + ' is listed twice.')); return; }
        if (k) dup[k] = true;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addBirds(list).then(function (data) {
        clearEl(main);
        var done = document.createElement('div');
        done.className = 'detail-screen';
        var box = document.createElement('div');
        box.className = 'detail-section';
        box.appendChild(message('info', data.created.length + (data.created.length === 1 ? ' chick' : ' chicks') + ' added' + (data.rejected.length ? ' — ' + data.rejected.length + ' couldn’t be saved: ' + data.rejected[0].error : '') + '.'));
        var needBands = data.created.filter(function (b) { return !b.band; }).length;
        if (needBands) {
          var addBands = document.createElement('button');
          addBands.type = 'button';
          addBands.className = 'btn-positive';
          addBands.textContent = 'Add bands now (' + needBands + ')';
          addBands.addEventListener('click', function () { navigate('banding'); });
          box.appendChild(addBands);
        }
        var again = document.createElement('button');
        again.type = 'button';
        again.className = 'btn-positive';
        again.textContent = T('+ Add another clutch');
        again.addEventListener('click', function () { BirdsAddScreen.clutchPrefill = { motherId: mother.get(), fatherId: father.get(), cage: locCtl.get().cage }; renderClutch(main, navigate, setTitle); });
        box.appendChild(again);
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'add-record-btn';
        back.textContent = 'Back to my birds';
        back.addEventListener('click', function () { location.hash = '#/mybirds/birds'; });
        box.appendChild(back);
        done.appendChild(box);
        main.appendChild(done);
      }).catch(function (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = T('Add the clutch');
        errorBox.appendChild(message('error', err.message));
      });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  // The banding list: every bird that doesn't have a band yet, with a box for the number. Type it and press Enter (or tap
  // away) and it's saved and you move on to the next one.
  function renderBanding(main, navigate, setTitle) {
    clearEl(main);
    setTitle('Needs a band');
    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';
    var box = document.createElement('div');
    box.className = 'detail-section';
    var head = document.createElement('h3');
    box.appendChild(head);
    box.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: 'Type a band number and press Enter — it’s saved and you move to the next bird. Leave one blank to skip it.' }));
    var list = document.createElement('div');
    box.appendChild(list);
    var message0 = document.createElement('div');
    box.appendChild(message0);

    function pending() {
      return BIRDS_SAMPLE.filter(function (b) { return !b.band && !birdIsArchived(b); })
        .sort(function (a, b) { return String(b.hatchDate || '').localeCompare(String(a.hatchDate || '')) || (a.name || '').localeCompare(b.name || ''); });
    }

    function draw() {
      var birds = pending();
      head.textContent = birds.length ? birds.length + (birds.length === 1 ? ' bird needs a band' : ' birds need a band') : 'Every bird has a band';
      clearEl(list);
      birds.forEach(function (b) {
        var row = document.createElement('div');
        row.className = 'banding-row';
        var info = document.createElement('div');
        info.className = 'banding-info';
        info.appendChild(Object.assign(document.createElement('strong'), { textContent: birdShortLabel(b) }));
        var parents = [b.motherId, b.fatherId].map(getBird).filter(Boolean).map(function (p) { return birdShortLabel(p); }).join(' × ');
        info.appendChild(Object.assign(document.createElement('small'), { textContent: [b.sex, birdHatchLabel(b) ? 'hatched ' + birdHatchLabel(b) : '', b.mutation, parents ? 'from ' + parents : ''].filter(Boolean).join(' · ') }));
        row.appendChild(info);
        var field0 = input('text', { placeholder: 'Band number' });
        field0.setAttribute('aria-label', 'Band number for ' + birdShortLabel(b));
        field0.enterKeyHint = 'next';
        var saved = false;
        function save() {
          var v = field0.value.trim();
          if (!v || saved) return Promise.resolve(false);
          saved = true;
          clearEl(message0);
          field0.disabled = true;
          return editBird(b.id, { band: v }).then(function () { row.classList.add('done'); var left = pending().length; head.textContent = left ? left + (left === 1 ? ' bird needs a band' : ' birds need a band') : 'Every bird has a band'; return true; }).catch(function (err) {
            saved = false; field0.disabled = false; field0.focus();
            message0.appendChild(message('error', birdShortLabel(b) + ': ' + err.message));
            return false;
          });
        }
        field0.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          var next = row.nextElementSibling && row.nextElementSibling.querySelector('input');
          save().then(function (ok) { if (ok && next) next.focus(); });
        });
        field0.addEventListener('blur', function () { save(); });
        row.appendChild(field0);
        list.appendChild(row);
      });
    }
    draw();
    var done = document.createElement('button');
    done.type = 'button';
    done.className = 'btn-positive';
    done.textContent = 'Done';
    done.addEventListener('click', function () { location.hash = '#/mybirds/birds'; });
    box.appendChild(done);
    wrap.appendChild(box);
    main.appendChild(wrap);
  }

  function downloadTemplate() {
    Csv.download('birdbox-birds-template.csv', Csv.stringify([TEMPLATE_HEADERS].concat(TEMPLATE_EXAMPLES)));
  }

  function headerKey(h) {
    return h.trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  // Turns parsed CSV rows into Promise<{ ready: [{ line, bird, from }], problems: [{ line, error }] }>
  // (or { fatal }). Species names are matched against the standard species list on the server;
  // only an exact match is accepted automatically — near spellings are suggested, never assumed.
  function analyze(rows) {
    var headers = rows[0].map(headerKey);
    var hasName = headers.indexOf('species') !== -1, hasCode = headers.indexOf('species_code') !== -1;
    var missing = REQUIRED_COLUMNS.filter(function (c) { return headers.indexOf(c) === -1; });
    if (!hasName && !hasCode) missing.push('species');
    if (missing.length) return Promise.resolve({ fatal: 'Missing required column' + (missing.length > 1 ? 's' : '') + ': ' + missing.join(', ') + '. Download the template to see the expected headers.' });

    function cell(r, name) {
      var i = headers.indexOf(name);
      return i === -1 ? '' : (r[i] || '');
    }
    var body = rows.slice(1);
    var names = [];
    body.forEach(function (r) {
      var n = cell(r, 'species').trim();
      if (n && !cell(r, 'species_code').trim() && names.indexOf(n) === -1) names.push(n);
    });

    var lookup = names.length ? SpeciesApi.resolve(names) : Promise.resolve([]);
    return lookup.then(function (resolved) {
      var byInput = {};
      resolved.forEach(function (r) { byInput[r.input] = r; });
      return build(body, headers, cell, byInput);
    });
  }

  function speciesProblem(input, r) {
    if (!r || r.status === 'none') return 'Species “' + input + '” wasn’t found in the species list';
    var names = (r.candidates || []).map(function (c) { return c.name; }).join(', ');
    if (r.status === 'close') return 'Species “' + input + '” wasn’t found — did you mean ' + names + '?';
    return 'Species “' + input + '” matches several species (' + names + ') — use one of those names';
  }

  function build(body, headers, cell, byInput) {
    // Each row gets its bird's ID up front, so a row can name another row's band as its parent.
    var fileIds = {};   // band key -> new ID, for rows in this file
    var rowIds = [];
    body.forEach(function (r) {
      var id = newBirdId() + Math.random().toString(36).slice(2, 4);
      rowIds.push(id);
      var b = cell(r, 'band');
      if (b && b.trim() && !fileIds[bandKey(b)]) fileIds[bandKey(b)] = id;
    });

    function parent(r, name) {
      var v = cell(r, name).trim();
      if (!v) return { id: '' };
      var existing = findBirdByBand(v);
      if (existing) return { id: existing.id };
      if (fileIds[bandKey(v)]) return { id: fileIds[bandKey(v)] };
      return { error: name.replace('_band', '') + ' band ' + v + ' isn’t in your flock or in this file' };
    }

    var ready = [], problems = [], seen = {};
    body.forEach(function (r, i) {
      var line = i + 2;
      var mother = parent(r, 'mother_band'), father = parent(r, 'father_band'), paired = parent(r, 'paired_band');
      var parentError = mother.error || father.error || paired.error;

      var code = cell(r, 'species_code').trim(), spName = '', from = '', speciesError = '';
      if (code) {
        spName = code;
      } else {
        var input = cell(r, 'species').trim();
        if (!input) speciesError = 'Species is required';
        else {
          var res = byInput[input];
          if (res && res.status === 'exact') {
            code = res.species.code;
            spName = res.species.name;
            from = input.toLowerCase() === spName.toLowerCase() ? '' : input;
          } else speciesError = speciesProblem(input, res);
        }
      }

      var result = check({
        id: rowIds[i], band: cell(r, 'band'), name: cell(r, 'name'), sex: cell(r, 'sex'), speciesCode: code, speciesName: spName,
        subspecies: cell(r, 'subspecies'), mutation: cell(r, 'mutation'), hatchDate: cell(r, 'hatch_date'),
        status: cell(r, 'status'), cage: cell(r, 'cage'), motherId: mother.id, fatherId: father.id,
        pairedId: paired.id, cost: cell(r, 'cost'), price: cell(r, 'price'),
        registryPublic: parseBool(cell(r, 'registry_public')), notes: cell(r, 'notes'),
      });
      if (speciesError && (!result.error || result.error === 'Choose a species')) problems.push({ line: line, error: speciesError });
      else if (result.error) problems.push({ line: line, error: result.error });
      else if (parentError) problems.push({ line: line, error: parentError });
      else if (result.bird.band && seen[bandKey(result.bird.band)]) problems.push({ line: line, error: 'Band ' + result.bird.band + ' appears more than once in this file' });
      else { if (result.bird.band) seen[bandKey(result.bird.band)] = true; ready.push({ line: line, bird: result.bird, from: from }); }
    });
    return { ready: ready, problems: problems };
  }

  function renderImport(main, navigate, setTitle) {
    clearEl(main);
    setTitle('Import Birds');

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var intro = document.createElement('div');
    intro.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = 'Import from a spreadsheet';
    var steps = document.createElement('p');
    steps.className = 'notes-text';
    steps.textContent = 'Download the template, fill in one row per bird, save it as a CSV, then upload it here. ' +
      'Only sex and species are required — a band number is optional, for birds that don’t have one. For species, use the name you know the bird by — Sun Conure, African Grey, Goffin’s Cockatoo — and we’ll match it to the standard species list. You’ll see a preview before anything is added.';
    var tplBtn = document.createElement('button');
    tplBtn.type = 'button';
    tplBtn.className = 'btn-positive';
    tplBtn.textContent = 'Download CSV template';
    tplBtn.addEventListener('click', downloadTemplate);
    var fileInput = input('file', { accept: '.csv,text/csv' });
    intro.appendChild(h);
    intro.appendChild(steps);
    intro.appendChild(tplBtn);
    intro.appendChild(field('Choose your CSV file', fileInput,
      'Dates can be YYYY-MM-DD or M/D/YYYY. Parents and pairs are entered by band number.'));

    var output = document.createElement('div');

    fileInput.addEventListener('change', function () {
      clearEl(output);
      var file = fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var rows = Csv.parse(String(reader.result));
        if (rows.length < 2) {
          output.appendChild(message('error', 'That file doesn’t have any bird rows in it.'));
          return;
        }
        output.appendChild(message('info', 'Checking your file…'));
        analyze(rows).then(function (analysis) {
          clearEl(output);
          if (analysis.fatal) {
            output.appendChild(message('error', analysis.fatal));
            return;
          }
          renderPreview(output, analysis, navigate);
        }).catch(function () {
          clearEl(output);
          output.appendChild(message('error', 'Couldn’t check the species in your file just now — check your connection and try again.'));
        });
      };
      reader.readAsText(file);
    });

    wrap.appendChild(intro);
    wrap.appendChild(output);
    main.appendChild(wrap);
  }

  function renderPreview(output, analysis, navigate) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = analysis.ready.length + (analysis.ready.length === 1 ? ' bird is' : ' birds are') + ' ready to import';
    section.appendChild(h);

    analysis.ready.slice(0, 8).forEach(function (r) {
      var p = document.createElement('p');
      p.className = 'notes-text';
      p.textContent = (r.bird.band || 'No band') + ' · ' + r.bird.sex + ' · ' + (r.bird.speciesName || r.bird.speciesCode) +
        (r.from ? ' (from “' + r.from + '”)' : '');
      section.appendChild(p);
    });
    if (analysis.ready.length > 8) {
      var more = document.createElement('p');
      more.className = 'form-note';
      more.textContent = '…and ' + (analysis.ready.length - 8) + ' more';
      section.appendChild(more);
    }

    if (analysis.problems.length) {
      var ph = document.createElement('h3');
      ph.textContent = analysis.problems.length + (analysis.problems.length === 1 ? ' row needs' : ' rows need') + ' attention (will be skipped)';
      section.appendChild(ph);
      analysis.problems.forEach(function (p) {
        section.appendChild(message('error', 'Row ' + p.line + ': ' + p.error));
      });
    }

    var resultBox = document.createElement('div');
    if (analysis.ready.length) {
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'save-btn';
      go.textContent = 'Import ' + analysis.ready.length + (analysis.ready.length === 1 ? ' bird' : ' birds');
      go.addEventListener('click', function () {
        go.disabled = true;
        go.textContent = 'Importing…';
        addBirds(analysis.ready.map(function (r) { return r.bird; })).then(function (data) {
          clearEl(section);
          var done = document.createElement('h3');
          done.textContent = data.created.length + (data.created.length === 1 ? ' bird' : ' birds') + ' added';
          section.appendChild(done);
          data.rejected.forEach(function (r) {
            section.appendChild(message('error', 'Row ' + analysis.ready[r.index].line + ': ' + r.error));
          });
          var view = document.createElement('button');
          view.type = 'button';
          view.className = 'save-btn';
          view.textContent = 'View my birds';
          view.addEventListener('click', function () { location.hash = '#/mybirds/birds'; });
          section.appendChild(view);
        }).catch(function (err) {
          go.disabled = false;
          go.textContent = 'Try again';
          resultBox.appendChild(message('error', err.message));
        });
      });
      section.appendChild(go);
    }
    section.appendChild(resultBox);
    output.appendChild(section);
  }

  return { afterAdd: null, clutchPrefill: null, renderForm: renderForm, renderImport: renderImport, renderClutch: renderClutch, renderBanding: renderBanding, analyze: analyze, check: check, isChicken: isChicken, suggestItems: suggestItems };
})();

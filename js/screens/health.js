// Health records (DNA certificates, immunizations, surgical sexing, vet visits) for
// mybirds/health. Shared row/fact/chip helpers come from js/ui-helpers.js.
//
// HealthScreen.pendingBirdId lets another screen (Birds detail) pre-select a bird before
// navigating to the "new record" form — set it, then set location.hash to '#/mybirds/health/new'.
const HealthScreen = (function () {
  var FILTERS = ['All'].concat(RECORD_TYPES);

  function typeClass(type) {
    return 'health-type-' + type.toLowerCase().replace(/\s+/g, '-');
  }

  // 'Pullorum-Typhoid test' for a disease test, else the record type.
  function recordTitle(r) {
    return isTest(r) ? (r.disease || 'Disease') + ' test' : r.type;
  }

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function renderList(main, navigate) {
    var state = { query: '', types: [], diseases: [], results: [], due: [] };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var tools = ListTools.create({
      screen: 'health', noView: true, placeholder: 'Search health records…', ariaLabel: 'Search health records', query: state.query,
      onQuery: function (v) { state.query = v; draw(); }, onRedraw: function () { draw(); },
      filters: function () {
        var f = [{ key: 'types', label: 'Type', options: RECORD_TYPES.map(function (t) { return [t, t]; }) }];
        if (testedDiseases().length) {
          f.push({ key: 'diseases', label: 'Disease tested for', options: testedDiseases().map(function (d) { return [d, d]; }) });
          f.push({ key: 'results', label: 'Test result', options: TEST_RESULTS.map(function (r) { return [r, r]; }) });
          f.push({ key: 'due', label: 'Retest', options: [['overdue', 'Overdue'], ['soon', 'Due soon']] });
        }
        return f;
      },
      get: function (k) { return state[k]; }, set: function (k, v) { state[k] = v; },
    });

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';
    var countRow = document.createElement('div');
    countRow.className = 'count-row';
    countRow.appendChild(countLabel);
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-mini';
    addBtn.textContent = '+ Add Health Record';
    addBtn.addEventListener('click', function () { navigate('new'); });
    countRow.appendChild(addBtn);

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      tools.refresh();

      var q = state.query.trim().toLowerCase();
      var results = HEALTH_RECORDS_SAMPLE.filter(function (r) {
        if (state.types.length && state.types.indexOf(r.type) === -1) return false;
        if (state.diseases.length && state.diseases.indexOf(r.disease) === -1) return false;
        if (state.results.length && state.results.indexOf(r.result) === -1) return false;
        if (state.due.length && !(isLatestTest(r) && state.due.indexOf(testStatus(r).state) !== -1)) return false;
        if (!q) return true;
        var bird = getBird(r.birdId);
        var hay = [bird ? birdShortLabel(bird) : '', bird ? bird.band : '', r.provider, r.notes, r.disease, r.result, r.type]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

      clearEl(countLabel);
      var num = document.createElement('strong');
      num.textContent = String(results.length);
      countLabel.appendChild(num);
      countLabel.appendChild(document.createTextNode(results.length === 1 ? ' record' : ' records'));

      clearEl(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No health records match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (r) { listWrap.appendChild(renderRow(r, navigate)); });
      }
    }

    draw();

    wrap.appendChild(tools.bar);
    wrap.appendChild(tools.chips);
    wrap.appendChild(countRow);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(record, navigate) {
    var bird = getBird(record.birdId);
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    fillThumb(avatar, healthThumbSpec(record));

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = bird ? birdShortLabel(bird) + (bird.band ? ' (' + bird.band + ')' : '') : 'Unknown bird';

    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    var attCount = record.attachments.length;
    sub.textContent = (isTest(record) && record.disease ? record.disease + ' · ' : '') + formatDate(record.date) + (record.provider ? ' · ' + record.provider : '') +
      (attCount ? ' · ' + attCount + ' file' + (attCount === 1 ? '' : 's') : '');
    var st = isLatestTest(record) ? testStatus(record) : null;
    if (st && (st.state === 'overdue' || st.state === 'soon')) {
      var due = document.createElement('span');
      due.className = st.state === 'overdue' ? 'due-overdue-text' : 'due-soon-text';
      due.textContent = ' · ' + st.label;
      sub.appendChild(due);
    }

    info.appendChild(title);
    info.appendChild(sub);

    var type = document.createElement('span');
    if (isTest(record) && record.result) {
      type.className = 'type-badge ' + testResultClass(record.result);
      type.textContent = record.result;
    } else {
      type.className = 'type-badge ' + typeClass(record.type);
      type.textContent = record.type;
    }

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(type);

    row.addEventListener('click', function () { navigate(record.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
    if (id === 'new') {
      renderAddForm(main, navigate, setTitle);
      return;
    }

    if (RecordForm.route(main, id, 'health', navigate, setTitle)) return;

    var record = getHealthRecord(id);
    if (!record) {
      var missing = document.createElement('p');
      missing.textContent = 'Health record not found.';
      main.appendChild(missing);
      return;
    }
    var bird = getBird(record.birdId);

    setTitle(recordTitle(record));

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/mybirds/Health.png';
    img.alt = '';
    avatar.appendChild(img);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = recordTitle(record);
    var typeBadge = document.createElement('span');
    typeBadge.className = 'type-badge ' + typeClass(record.type);
    typeBadge.textContent = bird ? birdShortLabel(bird) : 'Unknown bird';
    titleWrap.appendChild(h2);
    titleWrap.appendChild(typeBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    header.appendChild(makeEditButton(function () { navigate('edit~' + record.id); }));

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    if (isTest(record)) {
      factsGrid.appendChild(factRow('Tested for', record.disease || '—'));
      factsGrid.appendChild(factRow('Result', record.result || '—', record.result ? testResultClass(record.result) + '-text' : ''));
    }
    factsGrid.appendChild(factRow('Date', formatDate(record.date)));
    factsGrid.appendChild(factRow('Lab or provider', record.provider || '—'));

    wrap.appendChild(header);
    wrap.appendChild(factsGrid);

    wrap.appendChild(Relations.one({
      title: 'Bird', value: record.birdId || '', find: getBird,
      render: function (b) { return birdChip(b, function () { goToBird(b.id); }); },
      picker: function (cfg) { return Picker.birds(Object.assign({ placeholder: 'Assign to a bird — search…' }, cfg)); },
      set: function (bid) { return bid ? updateRecord('health', record.id, { birdId: bid }) : Promise.reject(new Error('A health record needs a bird — choose another to move it.')); },
      refresh: function () { clearEl(main); renderDetail(main, id, navigate, setTitle); },
    }));

    if (record.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'detail-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'notes-text';
      notesP.textContent = record.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    wrap.appendChild(FilesUI.render({
      ownerType: 'health', ownerId: record.id, title: 'Attachments',
      refresh: function () { clearEl(main); renderDetail(main, id, navigate, setTitle); },
      items: function () {
        return record.attachments.map(function (a) {
          return { id: a.id, kind: 'document', filename: a.name, url: a.url, size: a.size, contentType: a.kind === 'image' ? 'image/jpeg' : 'application/pdf' };
        });
      },
      kinds: [{ kind: 'document', addLabel: '+ Add File', accept: 'image/*,application/pdf', grid: true, empty: 'No files attached — add the certificate, vaccine record or report.' }],
    }));

    main.appendChild(wrap);
  }


  function renderAddForm(main, navigate, setTitle) {
    setTitle('Add Health Record');

    var presetBirdId = HealthScreen.pendingBirdId;
    HealthScreen.pendingBirdId = null;

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var form = document.createElement('form');
    form.className = 'detail-section record-form';

    var birdField = document.createElement('div');
    birdField.className = 'form-field';
    birdField.innerHTML = '<span class="form-label">Bird</span>';
    var birdPicker = Picker.birds({ value: presetBirdId || '' });
    birdField.appendChild(birdPicker.el);

    var typeField = document.createElement('label');
    typeField.className = 'form-field';
    typeField.innerHTML = '<span class="form-label">Record Type</span>';
    var typeSelect = document.createElement('select');
    typeSelect.setAttribute('aria-label', 'Record Type');
    typeSelect.className = 'form-input';
    RECORD_TYPES.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
    typeField.appendChild(typeSelect);

    // A disease test: what it was for and how it came out (shown only for that record type).
    var testFields = document.createElement('div');
    var diseaseField = document.createElement('div');
    diseaseField.className = 'form-field';
    diseaseField.innerHTML = '<span class="form-label">Disease tested for *</span>';
    var diseaseInput = document.createElement('input');
    diseaseInput.type = 'text';
    diseaseInput.className = 'form-input';
    diseaseInput.placeholder = 'Type, or tap one below';
    diseaseField.appendChild(diseaseInput);
    var chipsRow = document.createElement('div');
    chipsRow.className = 'suggest-chips';
    testedDiseases().concat(DISEASE_SUGGESTIONS.filter(function (d) { return testedDiseases().indexOf(d) === -1; })).forEach(function (d) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'loc-chip suggest-chip';
      chip.textContent = d;
      chip.addEventListener('click', function () { diseaseInput.value = d; });
      chipsRow.appendChild(chip);
    });
    diseaseField.appendChild(chipsRow);
    var resultField = document.createElement('label');
    resultField.className = 'form-field';
    resultField.innerHTML = '<span class="form-label">Result *</span>';
    var resultSelect = document.createElement('select');
    resultSelect.className = 'form-input';
    resultSelect.setAttribute('aria-label', 'Result');
    TEST_RESULTS.forEach(function (r) { var o = document.createElement('option'); o.value = r; o.textContent = r; resultSelect.appendChild(o); });
    resultField.appendChild(resultSelect);
    testFields.appendChild(diseaseField);
    testFields.appendChild(resultField);
    function syncTest() { testFields.style.display = typeSelect.value === 'Disease Test' ? '' : 'none'; }
    typeSelect.addEventListener('change', syncTest);
    if (HealthScreen.pendingType) { typeSelect.value = HealthScreen.pendingType; HealthScreen.pendingType = null; }
    syncTest();

    // A DNA (or surgical) sexing result can set the bird's sex straight away.
    var sexField = document.createElement('label');
    sexField.className = 'form-field';
    sexField.innerHTML = '<span class="form-label">Sex result</span>';
    var sexSelect = document.createElement('select');
    sexSelect.className = 'form-input';
    sexSelect.setAttribute('aria-label', 'Sex result');
    [['', 'Not stated'], ['Male', 'Male'], ['Female', 'Female']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; sexSelect.appendChild(op); });
    sexField.appendChild(sexSelect);
    sexField.appendChild(Object.assign(document.createElement('p'), { className: 'form-note', textContent: 'If you pick one, the bird’s sex is updated to match.' }));
    function syncSex() { sexField.style.display = typeSelect.value === 'DNA Certificate' || typeSelect.value === 'Surgical Sexing' ? '' : 'none'; }
    typeSelect.addEventListener('change', syncSex);

    var dateField = document.createElement('label');
    dateField.className = 'form-field';
    dateField.innerHTML = '<span class="form-label">Date</span>';
    var dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'form-input';
    dateInput.value = new Date().toISOString().slice(0, 10);
    dateField.appendChild(dateInput);

    var providerField = document.createElement('label');
    providerField.className = 'form-field';
    providerField.innerHTML = '<span class="form-label">Lab or provider</span>';
    var providerInput = document.createElement('input');
    providerInput.type = 'text';
    providerInput.className = 'form-input';
    providerInput.placeholder = 'Vet, lab, or clinic name';
    providerField.appendChild(providerInput);

    var notesField = document.createElement('label');
    notesField.className = 'form-field';
    notesField.innerHTML = '<span class="form-label">Notes</span>';
    var notesInput = document.createElement('textarea');
    notesInput.className = 'form-input';
    notesInput.rows = 3;
    notesField.appendChild(notesInput);

    var fileField = document.createElement('label');
    fileField.className = 'form-field';
    fileField.innerHTML = '<span class="form-label">Attach image or PDF</span>';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'form-input';
    fileInput.accept = 'image/*,application/pdf';
    fileInput.multiple = true;
    fileField.appendChild(fileInput);

    var fileNote = document.createElement('p');
    fileNote.className = 'form-note';
    fileNote.textContent = 'Photos, PDFs, and other documents for this record.';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save Record';

    form.appendChild(birdField);
    form.appendChild(typeField);
    form.appendChild(testFields);
    form.appendChild(sexField);
    syncSex();
    form.appendChild(dateField);
    form.appendChild(providerField);
    form.appendChild(notesField);
    form.appendChild(fileField);
    form.appendChild(fileNote);
    form.appendChild(saveBtn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!birdPicker.get()) {
        Modal.alert('Choose a bird first');
        return;
      }
      var isTestRecord = typeSelect.value === 'Disease Test';
      if (isTestRecord && !diseaseInput.value.trim()) { Modal.alert('Say which disease was tested for'); return; }
      var chosenFiles = Array.prototype.slice.call(fileInput.files);
      var record = {
        birdId: birdPicker.get(),
        type: typeSelect.value,
        disease: isTestRecord ? diseaseInput.value.trim() : '',
        result: isTestRecord ? resultSelect.value : '',
        date: dateInput.value || new Date().toISOString().slice(0, 10),
        provider: providerInput.value.trim(),
        notes: notesInput.value.trim(),
        attachments: [],
      };
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addHealthRecord(record).then(function (saved) {
        if (sexSelect.value && ['DNA Certificate', 'Surgical Sexing'].indexOf(record.type) !== -1) return editBird(record.birdId, { sex: sexSelect.value }).then(function () { return saved; }).catch(function () { return saved; });
        return saved;
      }).then(function (saved) {
        // The files are saved to the database once the record exists.
        var failed = 0;
        return chosenFiles.reduce(function (chain, f) {
          return chain.then(function () { return uploadFile('health', saved.id, 'document', f).catch(function () { failed += 1; }); });
        }, Promise.resolve()).then(function () {
          if (failed) Modal.alert(failed + (failed === 1 ? ' file' : ' files') + ' didn’t upload — you can add ' + (failed === 1 ? 'it' : 'them') + ' on the record.');
          navigate(saved.id);
        });
      }).catch(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Record';
        Modal.alert('Could not save this record — please try again.');
      });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail, pendingBirdId: null };
})();

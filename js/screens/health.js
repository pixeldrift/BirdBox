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

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function renderList(main, navigate) {
    var state = { query: '', type: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-record-btn';
    addBtn.textContent = '+ Add Health Record';
    addBtn.addEventListener('click', function () { navigate('new'); });

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search bird, provider, notes…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search health records');

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'filter-chips';

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      clearEl(chipsWrap);
      FILTERS.forEach(function (f) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (state.type === f ? ' active' : '');
        chip.textContent = f;
        chip.addEventListener('click', function () {
          state.type = f;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = HEALTH_RECORDS_SAMPLE.filter(function (r) {
        if (state.type !== 'All' && r.type !== state.type) return false;
        if (!q) return true;
        var bird = getBird(r.birdId);
        var hay = [bird ? birdShortLabel(bird) : '', bird ? bird.band : '', r.provider, r.notes]
          .filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      }).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });

      countLabel.textContent = results.length + (results.length === 1 ? ' record' : ' records');

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

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    wrap.appendChild(addBtn);
    wrap.appendChild(searchInput);
    wrap.appendChild(chipsWrap);
    wrap.appendChild(countLabel);
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
    var img = document.createElement('img');
    img.src = 'icons/tinted/mybirds/Health.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = bird ? birdShortLabel(bird) : 'Unknown bird';

    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    var attCount = record.attachments.length;
    sub.textContent = formatDate(record.date) + (record.provider ? ' · ' + record.provider : '') +
      (attCount ? ' · ' + attCount + ' file' + (attCount === 1 ? '' : 's') : '');

    info.appendChild(title);
    info.appendChild(sub);

    var type = document.createElement('span');
    type.className = 'type-badge ' + typeClass(record.type);
    type.textContent = record.type;

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

    var record = getHealthRecord(id);
    if (!record) {
      var missing = document.createElement('p');
      missing.textContent = 'Health record not found.';
      main.appendChild(missing);
      return;
    }
    var bird = getBird(record.birdId);

    setTitle(record.type);

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
    h2.textContent = record.type;
    var typeBadge = document.createElement('span');
    typeBadge.className = 'type-badge ' + typeClass(record.type);
    typeBadge.textContent = bird ? birdShortLabel(bird) : 'Unknown bird';
    titleWrap.appendChild(h2);
    titleWrap.appendChild(typeBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    factsGrid.appendChild(factRow('Date', formatDate(record.date)));
    factsGrid.appendChild(factRow('Provider', record.provider || '—'));

    wrap.appendChild(header);
    wrap.appendChild(factsGrid);

    var birdSection = document.createElement('div');
    birdSection.className = 'detail-section';
    var birdTitle = document.createElement('h3');
    birdTitle.textContent = 'Bird';
    birdSection.appendChild(birdTitle);
    var birdChips = document.createElement('div');
    birdChips.className = 'chip-row';
    birdChips.appendChild(makeChip(null, bird ? birdShortLabel(bird) : 'Unknown', bird ? function () { goToBird(bird.id); } : null));
    birdSection.appendChild(birdChips);
    wrap.appendChild(birdSection);

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

    var attSection = document.createElement('div');
    attSection.className = 'detail-section';
    var attTitle = document.createElement('h3');
    attTitle.textContent = 'Attachments';
    attSection.appendChild(attTitle);
    if (record.attachments.length === 0) {
      var noAtt = document.createElement('p');
      noAtt.className = 'notes-text';
      noAtt.textContent = 'No files attached.';
      attSection.appendChild(noAtt);
    } else {
      var attGrid = document.createElement('div');
      attGrid.className = 'attachment-grid';
      record.attachments.forEach(function (att) { attGrid.appendChild(renderAttachment(att)); });
      attSection.appendChild(attGrid);
    }
    wrap.appendChild(attSection);

    main.appendChild(wrap);
  }

  function renderAttachment(att) {
    var link = document.createElement('a');
    link.className = 'attachment-tile';
    link.href = att.url;
    link.target = '_blank';
    link.rel = 'noopener';

    if (att.kind === 'image') {
      var img = document.createElement('img');
      img.src = att.url;
      img.alt = att.name;
      link.appendChild(img);
    } else {
      var icon = document.createElement('span');
      icon.className = 'attachment-file-icon';
      icon.textContent = 'PDF';
      link.appendChild(icon);
    }

    var name = document.createElement('span');
    name.className = 'attachment-name';
    name.textContent = att.name;
    link.appendChild(name);

    return link;
  }

  function renderAddForm(main, navigate, setTitle) {
    setTitle('Add Health Record');

    var presetBirdId = HealthScreen.pendingBirdId;
    HealthScreen.pendingBirdId = null;

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var form = document.createElement('form');
    form.className = 'detail-section record-form';

    var birdField = document.createElement('label');
    birdField.className = 'form-field';
    birdField.innerHTML = '<span class="form-label">Bird</span>';
    var birdSelect = document.createElement('select');
    birdSelect.className = 'form-input';
    birdSelect.required = true;
    var blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = 'Select a bird…';
    birdSelect.appendChild(blankOpt);
    BIRDS_SAMPLE.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = birdShortLabel(b) + ' (' + b.band + ')';
      if (b.id === presetBirdId) opt.selected = true;
      birdSelect.appendChild(opt);
    });
    birdField.appendChild(birdSelect);

    var typeField = document.createElement('label');
    typeField.className = 'form-field';
    typeField.innerHTML = '<span class="form-label">Record Type</span>';
    var typeSelect = document.createElement('select');
    typeSelect.className = 'form-input';
    RECORD_TYPES.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      typeSelect.appendChild(opt);
    });
    typeField.appendChild(typeSelect);

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
    providerField.innerHTML = '<span class="form-label">Provider</span>';
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
    form.appendChild(dateField);
    form.appendChild(providerField);
    form.appendChild(notesField);
    form.appendChild(fileField);
    form.appendChild(fileNote);
    form.appendChild(saveBtn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!birdSelect.value) {
        birdSelect.focus();
        return;
      }
      var attachments = Array.prototype.map.call(fileInput.files, function (file) {
        return {
          name: file.name,
          kind: file.type.indexOf('image/') === 0 ? 'image' : 'pdf',
          url: URL.createObjectURL(file),
        };
      });
      var record = {
        id: nextHealthRecordId(),
        birdId: birdSelect.value,
        type: typeSelect.value,
        date: dateInput.value || new Date().toISOString().slice(0, 10),
        provider: providerInput.value.trim(),
        notes: notesInput.value.trim(),
        attachments: attachments,
      };
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      addHealthRecord(record).then(function () {
        navigate(record.id);
      }).catch(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Record';
        alert('Could not save this record — please try again.');
      });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail, pendingBirdId: null };
})();

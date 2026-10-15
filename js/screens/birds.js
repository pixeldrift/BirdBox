// Real Birds list/detail screen, replacing the generic placeholder for the
// mybirds/birds route. Data comes from js/data/birds-sample.js.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const BirdsScreen = (function () {
  var STATUSES = ['All', 'Available', 'Reserved', 'Sold', 'Deceased'];

  function statusClass(status) {
    return 'status-' + status.toLowerCase();
  }

  function renderList(main, navigate) {
    BirdsAddScreen.afterAdd = null;
    var state = { query: '', status: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var actions = document.createElement('div');
    actions.className = 'list-actions';
    [['+ Add Bird', 'new'], ['Import CSV', 'import']].forEach(function (a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'add-record-btn';
      btn.textContent = a[0];
      btn.addEventListener('click', function () { navigate(a[1]); });
      actions.appendChild(btn);
    });

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search band #, name, species…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search birds');

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'filter-chips';

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      clearEl(chipsWrap);
      STATUSES.forEach(function (s) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (state.status === s ? ' active' : '');
        chip.textContent = s;
        chip.addEventListener('click', function () {
          state.status = s;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = BIRDS_SAMPLE.filter(function (b) {
        if (state.status !== 'All' && b.status !== state.status) return false;
        if (!q) return true;
        var hay = [b.band, b.name, b.speciesName, b.scientificName, b.species, b.subspecies, b.mutation].filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      countLabel.textContent = results.length + (results.length === 1 ? ' bird' : ' birds');

      clearEl(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No birds match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (b) {
          listWrap.appendChild(renderRow(b, navigate));
        });
      }
    }

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    wrap.appendChild(actions);
    wrap.appendChild(searchInput);
    wrap.appendChild(chipsWrap);
    wrap.appendChild(countLabel);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(bird, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    fillBirdAvatar(avatar, bird);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = birdShortLabel(bird);

    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    var sexWord = document.createElement('span');
    sexWord.className = sexTextClass(bird.sex);
    sexWord.textContent = bird.sex;
    sub.appendChild(document.createTextNode(bird.band + ' · '));
    sub.appendChild(sexWord);
    if (bird.mutation) sub.appendChild(document.createTextNode(' · ' + bird.mutation));

    info.appendChild(title);
    info.appendChild(sub);

    var status = document.createElement('span');
    status.className = 'status-badge ' + statusClass(bird.status);
    status.textContent = bird.status;

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(status);

    row.addEventListener('click', function () { navigate(bird.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
    // Cleared here (not just by the router) because this also gets called directly as a
    // "refresh myself" callback (Registry toggle, photo upload/primary switch) — without
    // this, a second call appends another copy instead of replacing the first.
    clearEl(main);

    if (id === 'new') return BirdsAddScreen.renderForm(main, navigate, setTitle);
    if (id === 'import') return BirdsAddScreen.renderImport(main, navigate, setTitle);
    if (id === 'transfer') return TransferScreen.renderForm(main, navigate, setTitle);

    var bird = getBird(id);
    if (!bird) {
      var missing = document.createElement('p');
      missing.textContent = 'Bird not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(bird.name || bird.band);

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    fillBirdAvatar(avatar, bird);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = birdIdentifier(bird);
    var statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge ' + statusClass(bird.status);
    statusBadge.textContent = bird.status;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(statusBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    [
      ['Band #', bird.band],
      ['Sex', bird.sex, sexTextClass(bird.sex)],
    ].concat(speciesFacts(bird)).concat([
      ['Mutation', bird.mutation || '—'],
      ['Hatch Date', formatDate(bird.hatchDate)],
      ['Location', bird.cage || '—'],
      ['Owner', (birdOwner(bird.id) || { name: 'You' }).name],
    ]).forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1], f[2])); });
    appendSpeciesLink(factsGrid, bird);

    var familySection = document.createElement('div');
    familySection.className = 'detail-section';
    var familyTitle = document.createElement('h3');
    familyTitle.textContent = 'Family';
    familySection.appendChild(familyTitle);

    var familyChips = document.createElement('div');
    familyChips.className = 'chip-row';
    familyChips.appendChild(makeRelChip('Mother', bird.motherId ? getBird(bird.motherId) : null, navigate));
    familyChips.appendChild(makeRelChip('Father', bird.fatherId ? getBird(bird.fatherId) : null, navigate));
    if (bird.pairedId) familyChips.appendChild(makeRelChip('Paired With', getBird(bird.pairedId), navigate));
    familySection.appendChild(familyChips);

    var kids = birdChildren(bird.id);
    if (kids.length) {
      var kidsLabel = document.createElement('p');
      kidsLabel.className = 'subsection-label';
      kidsLabel.textContent = 'Offspring (' + kids.length + ')';
      familySection.appendChild(kidsLabel);

      var kidsRow = document.createElement('div');
      kidsRow.className = 'chip-row';
      kids.forEach(function (k) {
        kidsRow.appendChild(makeChip(null, birdShortLabel(k), function () { navigate(k.id); }));
      });
      familySection.appendChild(kidsRow);
    }

    var registrySection = document.createElement('div');
    registrySection.className = 'detail-section';
    var registryTitle = document.createElement('h3');
    registryTitle.textContent = 'Registry';
    registrySection.appendChild(registryTitle);
    registrySection.appendChild(makeRegistryToggle(bird, function () {
      renderDetail(main, id, navigate, setTitle);
    }));
    var registryNote = document.createElement('p');
    registryNote.className = 'form-note';
    registryNote.textContent = bird.registryPublic
      ? 'Band #, species, sex, hatch date, and public parents/offspring are searchable in Registry → Search. Owner, notes, and money fields stay private.'
      : 'Off by default — turn on to make this bird searchable in the public Registry.';
    registrySection.appendChild(registryNote);

    var statusSection = document.createElement('div');
    statusSection.className = 'detail-section';
    var statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Status';
    statusSection.appendChild(statusTitle);
    var statusChips = document.createElement('div');
    statusChips.className = 'filter-chips';
    var followUp = document.createElement('div');
    function drawStatus() {
      clearEl(statusChips);
      STATUSES.filter(function (st) { return st !== 'All'; }).forEach(function (st) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (bird.status === st ? ' active' : '');
        chip.textContent = st;
        chip.addEventListener('click', function () {
          if (bird.status === st) return;
          updateBird(bird.id, { status: st }).then(function () {
            statusBadge.className = 'status-badge ' + statusClass(bird.status);
            statusBadge.textContent = bird.status;
            drawStatus();
            clearEl(followUp);
            // Sold means it's leaving: ask about shipping / a hand-over / ownership.
            if (st === 'Sold') SoldFollowUp.render(followUp, bird, function () { clearEl(followUp); });
          }).catch(function () {
            clearEl(followUp);
            var p = document.createElement('p');
            p.className = 'form-message error';
            p.textContent = 'Could not change the status — try again.';
            followUp.appendChild(p);
          });
        });
        statusChips.appendChild(chip);
      });
    }
    drawStatus();
    statusSection.appendChild(statusChips);
    var statusNote = document.createElement('p');
    statusNote.className = 'form-note';
    statusNote.textContent = 'Only Available birds appear in the Available list. Marking a bird Sold will ask about shipping or handing it over.';
    statusSection.appendChild(statusNote);
    statusSection.appendChild(followUp);

    var healthSection = document.createElement('div');
    healthSection.className = 'detail-section';
    var healthTitle = document.createElement('h3');
    healthTitle.textContent = 'Health Records';
    healthSection.appendChild(healthTitle);

    var healthRecords = healthRecordsForBird(bird.id);
    if (healthRecords.length) {
      var healthRow = document.createElement('div');
      healthRow.className = 'chip-row';
      healthRecords
        .slice()
        .sort(function (a, b) { return b.date.localeCompare(a.date); })
        .forEach(function (r) {
          healthRow.appendChild(makeChip(r.type, formatDate(r.date), function () {
            location.hash = '#/mybirds/health/' + r.id;
          }));
        });
      healthSection.appendChild(healthRow);
    } else {
      var noHealth = document.createElement('p');
      noHealth.className = 'notes-text';
      noHealth.textContent = 'No health records yet.';
      healthSection.appendChild(noHealth);
    }

    var addHealthBtn = document.createElement('button');
    addHealthBtn.type = 'button';
    addHealthBtn.className = 'add-record-btn';
    addHealthBtn.textContent = '+ Add Health Record';
    addHealthBtn.addEventListener('click', function () {
      HealthScreen.pendingBirdId = bird.id;
      location.hash = '#/mybirds/health/new';
    });
    healthSection.appendChild(addHealthBtn);

    var transferSection = document.createElement('div');
    transferSection.className = 'detail-section';
    var transferTitle = document.createElement('h3');
    transferTitle.textContent = 'Transfers & Shipments';
    transferSection.appendChild(transferTitle);
    var history = transfersForBird(bird.id).map(function (t) {
      var who = getContact(t.contactId);
      return { date: t.date || '', label: (t.direction === 'Out' ? 'Went to ' : 'Came from ') + (who ? who.name : 'someone'),
        sub: [t.method, t.date ? formatDate(t.date) : ''].filter(Boolean).join(' · '), go: who ? function () { location.hash = '#/business/contacts/' + who.id; } : null };
    }).concat(WAYBILLS_SAMPLE.filter(function (w) { return w.birdIds.indexOf(bird.id) !== -1; }).map(function (w) {
      var who = waybillClient(w);
      var verb = w.status === 'Pending' ? 'Pending shipment' : (w.direction === 'Incoming' ? 'Received' : 'Shipped');
      return { date: w.date || '', label: verb + (who ? (w.direction === 'Incoming' ? ' from ' : ' to ') + who.name : ''),
        sub: [w.method || 'Shipment', w.date ? formatDate(w.date) : ''].filter(Boolean).join(' · '), go: function () { location.hash = '#/business/shipping/' + w.id; } };
    })).sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (history.length) {
      history.forEach(function (h) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'list-row';
        var info = document.createElement('span');
        info.className = 'list-row-info';
        var t = document.createElement('span');
        t.className = 'list-row-title';
        t.textContent = h.label;
        var sub = document.createElement('span');
        sub.className = 'list-row-sub';
        sub.textContent = h.sub;
        info.appendChild(t);
        info.appendChild(sub);
        row.appendChild(info);
        if (h.go) row.addEventListener('click', h.go);
        transferSection.appendChild(row);
      });
    } else {
      var noTransfers = document.createElement('p');
      noTransfers.className = 'form-note';
      noTransfers.textContent = 'No hand-overs recorded for this bird yet.';
      transferSection.appendChild(noTransfers);
    }
    var transferBtn = document.createElement('button');
    transferBtn.type = 'button';
    transferBtn.className = 'add-record-btn';
    transferBtn.textContent = '+ Record Transfer';
    transferBtn.addEventListener('click', function () { TransferScreen.start(bird.id); });
    transferSection.appendChild(transferBtn);
    var transferNote = document.createElement('p');
    transferNote.className = 'form-note';
    transferNote.textContent = 'For a local pick up, a local meet or a delivery. Shipped birds get a Shipment record under Business → Shipping.';
    transferSection.appendChild(transferNote);

    var moneySection = document.createElement('div');
    moneySection.className = 'detail-section';
    var moneyTitle = document.createElement('h3');
    moneyTitle.textContent = 'Sale';
    moneySection.appendChild(moneyTitle);
    var moneyGrid = document.createElement('div');
    moneyGrid.className = 'fact-grid';
    moneyGrid.appendChild(factRow('Cost', formatMoney(bird.cost)));
    moneyGrid.appendChild(factRow('Price', formatMoney(bird.price)));
    moneySection.appendChild(moneyGrid);

    wrap.appendChild(header);
    wrap.appendChild(buildPhotosSection(bird, function () { renderDetail(main, id, navigate, setTitle); }));
    wrap.appendChild(factsGrid);
    wrap.appendChild(statusSection);
    wrap.appendChild(familySection);
    wrap.appendChild(registrySection);
    wrap.appendChild(healthSection);
    wrap.appendChild(transferSection);
    wrap.appendChild(moneySection);

    if (bird.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'detail-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'notes-text';
      notesP.textContent = bird.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    main.appendChild(wrap);
  }

  function makeRelChip(label, relBird, navigate) {
    return makeChip(label, relBird ? birdShortLabel(relBird) : 'Unknown', relBird ? function () { navigate(relBird.id); } : null);
  }

  function makeRegistryToggle(bird, onToggle) {
    return makeToggle(bird.registryPublic, 'Public in Registry', function (checked) {
      updateBird(bird.id, { registryPublic: checked }).catch(function () {});
      onToggle();
    });
  }

  function buildPhotosSection(bird, refresh) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var title = document.createElement('h3');
    title.textContent = 'Photos';
    section.appendChild(title);

    if (bird.photos.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'notes-text';
      empty.textContent = 'No photos yet — falling back to a generic icon for this species.';
      section.appendChild(empty);
    } else {
      var grid = document.createElement('div');
      grid.className = 'photo-grid';
      bird.photos.forEach(function (photo) {
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'photo-tile' + (photo.isPrimary ? ' primary' : '');
        var img = document.createElement('img');
        img.src = photo.url;
        img.alt = '';
        tile.appendChild(img);
        if (photo.isPrimary) {
          var badge = document.createElement('span');
          badge.className = 'photo-primary-badge';
          badge.textContent = 'Primary';
          tile.appendChild(badge);
        }
        tile.addEventListener('click', function () {
          if (photo.isPrimary) return;
          bird.photos.forEach(function (p) { p.isPrimary = (p === photo); });
          refresh();
        });
        grid.appendChild(tile);
      });
      section.appendChild(grid);
    }

    var fileLabel = document.createElement('label');
    fileLabel.className = 'add-record-btn photo-upload-btn';
    fileLabel.textContent = '+ Add Photos';
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.hidden = true;
    fileInput.addEventListener('change', function () {
      var hadPhotos = bird.photos.length > 0;
      Array.prototype.forEach.call(fileInput.files, function (file, i) {
        bird.photos.push({
          id: nextPhotoId(),
          url: URL.createObjectURL(file),
          isPrimary: !hadPhotos && i === 0,
        });
      });
      refresh();
    });
    fileLabel.appendChild(fileInput);
    section.appendChild(fileLabel);

    var note = document.createElement('p');
    note.className = 'form-note';
    note.textContent = 'Tap a photo to make it the main picture on this bird’s profile.';
    section.appendChild(note);

    return section;
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

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
      STATUSES.concat(['Archived']).forEach(function (s) {
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
        if (state.status === 'Archived') { if (!birdIsArchived(b)) return false; }
        else {
          if (state.status !== 'All' && b.status !== state.status) return false;
          if (state.status !== 'Sold' && state.status !== 'Deceased' && birdIsArchived(b)) return false; // archived birds only show under Archived, Sold or Deceased
        }
        if (!q) return true;
        var hay = [b.band, b.name, b.speciesName, b.scientificName, b.species, b.subspecies, b.mutation].filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      var goneHidden = state.status === 'Sold' || state.status === 'Deceased' || state.status === 'Archived' ? 0 : BIRDS_SAMPLE.filter(birdIsArchived).length;
      countLabel.textContent = results.length + (results.length === 1 ? ' bird' : ' birds') + (goneHidden ? ' · ' + goneHidden + ' archived' : '');

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
    sub.appendChild(document.createTextNode(birdBandLabel(bird) + ' · '));
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
    if (id.indexOf('edit~') === 0) {
      var editTarget = getBird(id.slice(5));
      if (editTarget) return BirdsAddScreen.renderForm(main, navigate, setTitle, editTarget);
    }

    var bird = getBird(id);
    if (!bird) {
      var missing = document.createElement('p');
      missing.textContent = 'Bird not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(bird.name || bird.band || birdTypeLabel(bird));

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
    titleWrap.appendChild(h2);
    if (birdIsArchived(bird)) titleWrap.appendChild(Object.assign(document.createElement('span'), { className: 'type-badge status-inactive-user', textContent: 'Archived' }));

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    header.appendChild(makeEditButton(function () { navigate('edit~' + bird.id); }));

    var again = function () { renderDetail(main, id, navigate, setTitle); };

    // Band, sex and hatch date belong together.
    var vitalsGrid = document.createElement('div');
    vitalsGrid.className = 'fact-grid fact-grid-3';
    [
      ['Band #', birdBandLabel(bird)],
      ['Sex', bird.sex, sexTextClass(bird.sex)],
      ['Hatch date', birdHatchLabel(bird)],
    ].forEach(function (f) { vitalsGrid.appendChild(factRow(f[0], f[1], f[2])); });
    var ageText = birdAge(bird);
    if (ageText) {
      var ageEl = document.createElement('span');
      ageEl.className = 'fact-sub';
      ageEl.textContent = 'Age ' + ageText;
      vitalsGrid.lastChild.appendChild(ageEl);
    }

    // Owner, location and status belong together too. Owner and location open a chooser; status is a dropdown.
    var placeGrid = document.createElement('div');
    placeGrid.className = 'fact-grid fact-grid-3';
    var ownerNow = birdOwner(bird.id);
    placeGrid.appendChild(tappableFact('Owner', ownerNow ? ownerNow.name : 'You', function () { BirdPopups.openOwner(bird, again); }));
    placeGrid.appendChild(tappableFact('Location', BirdPopups.locationLabel(bird) || 'Not set', function () { BirdPopups.openLocation(bird, again); }));
    var followUp = document.createElement('div');
    var statusFact = document.createElement('div');
    statusFact.className = 'fact';
    var statusLabel = document.createElement('span');
    statusLabel.className = 'fact-label';
    statusLabel.textContent = 'Status';
    var statusSelect = document.createElement('select');
    statusSelect.className = 'fact-select ' + statusClass(bird.status);
    STATUSES.filter(function (st) { return st !== 'All'; }).forEach(function (st) {
      var o = document.createElement('option');
      o.value = st;
      o.textContent = st;
      statusSelect.appendChild(o);
    });
    statusSelect.value = bird.status;
    statusSelect.addEventListener('change', function () {
      var st = statusSelect.value;
      updateBird(bird.id, { status: st }).then(function () {
        statusSelect.className = 'fact-select ' + statusClass(bird.status);
        clearEl(followUp);
        // Sold means it's leaving: ask about shipping / a hand-over / ownership.
        if (st === 'Sold') SoldFollowUp.render(followUp, bird, function () { clearEl(followUp); });
      }).catch(function () {
        statusSelect.value = bird.status;
        clearEl(followUp);
        var p = document.createElement('p');
        p.className = 'form-message error';
        p.textContent = 'Could not change the status — try again.';
        followUp.appendChild(p);
      });
    });
    statusFact.appendChild(statusLabel);
    statusFact.appendChild(statusSelect);
    placeGrid.appendChild(statusFact);

    var familySection = document.createElement('div');
    familySection.className = 'detail-section';
    var familyTitle = document.createElement('h3');
    familyTitle.textContent = 'Family';
    familySection.appendChild(familyTitle);

    var familyChips = document.createElement('div');
    familyChips.className = 'chip-row chip-col';
    familyChips.appendChild(makeRelChip('Mother', bird.motherId ? getBird(bird.motherId) : null, navigate));
    familyChips.appendChild(makeRelChip('Father', bird.fatherId ? getBird(bird.fatherId) : null, navigate));
    if (bird.pairedId) familyChips.appendChild(makeRelChip('Paired With', getBird(bird.pairedId), navigate));
    familySection.appendChild(familyChips);
    var treeLink = document.createElement('button');
    treeLink.type = 'button';
    treeLink.className = 'pick-link';
    treeLink.textContent = 'View family tree ›';
    treeLink.addEventListener('click', function () { location.hash = '#/mybirds/genealogy/' + bird.id; });
    familySection.appendChild(treeLink);

    var kids = birdChildren(bird.id);
    if (kids.length) {
      var kidsLabel = document.createElement('p');
      kidsLabel.className = 'subsection-label';
      kidsLabel.textContent = 'Offspring (' + kids.length + ')';
      familySection.appendChild(kidsLabel);

      var kidsRow = document.createElement('div');
      kidsRow.className = 'chip-row chip-col';
      kids.forEach(function (k) {
        kidsRow.appendChild(birdChip(k, function () { navigate(k.id); }));
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
          healthRow.appendChild(healthChip(r, function () {
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
    healthSection.appendChild(Relations.addPicker({
      placeholder: '+ Assign an existing health record — search…',
      candidates: function () { return Picker.listItems('health', function (r) { return r.birdId !== bird.id; }); },
      link: function (recId) { return updateRecord('health', recId, { birdId: bird.id }); },
      refresh: function () { renderDetail(main, id, navigate, setTitle); },
    }));

    var transferSection = document.createElement('div');
    transferSection.className = 'detail-section';
    var transferTitle = document.createElement('h3');
    transferTitle.textContent = 'Transfers & Shipments';
    transferSection.appendChild(transferTitle);
    var history = transfersForBird(bird.id).map(function (t) {
      var who = getContact(t.contactId);
      return { date: t.date || '', label: (t.direction === 'Out' ? 'Went to ' : 'Came from ') + (who ? who.name : 'someone'),
        thumb: who && who.photoUrl ? { src: who.photoUrl } : { icon: 'icons/tinted/business/Contacts.png' }, sub: [t.method, t.date ? formatDate(t.date) : ''].filter(Boolean).join(' · '), go: who ? function () { location.hash = '#/business/contacts/' + who.id; } : null };
    }).concat(WAYBILLS_SAMPLE.filter(function (w) { return w.birdIds.indexOf(bird.id) !== -1; }).map(function (w) {
      var who = waybillClient(w);
      var verb = w.status === 'Pending' ? 'Pending shipment' : (w.direction === 'Incoming' ? 'Received' : 'Shipped');
      return { date: w.date || '', label: verb + (who ? (w.direction === 'Incoming' ? ' from ' : ' to ') + who.name : ''),
        thumb: waybillThumbSpec(w), sub: [w.method || 'Shipment', w.date ? formatDate(w.date) : ''].filter(Boolean).join(' · '), go: function () { location.hash = '#/business/shipping/' + w.id; } };
    })).sort(function (a, b) { return b.date.localeCompare(a.date); });
    if (history.length) {
      history.forEach(function (h) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'list-row';
        var rowThumb = document.createElement('span');
        rowThumb.className = 'list-row-avatar';
        fillThumb(rowThumb, h.thumb);
        row.appendChild(rowThumb);
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
    transferSection.appendChild(Relations.addPicker({
      placeholder: '+ Add this bird to an existing shipment — search…',
      candidates: function () { return Picker.listItems('waybills', function (w) { return w.birdIds.indexOf(bird.id) === -1; }); },
      link: function (wbId) {
        var wb = WAYBILLS_SAMPLE.filter(function (w) { return w.id === wbId; })[0];
        return editWaybill(wb, waybillPayload(wb, { birdIds: wb.birdIds.concat([bird.id]) }));
      },
      refresh: function () { renderDetail(main, id, navigate, setTitle); },
    }));

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
    wrap.appendChild(BirdActions.row(bird, again));
    wrap.appendChild(buildPhotosSection(bird, function () { renderDetail(main, id, navigate, setTitle); }));
    wrap.appendChild(vitalsGrid);
    wrap.appendChild(placeGrid);
    wrap.appendChild(followUp);
    wrap.appendChild(buildSpeciesCard(bird));
    wrap.appendChild(familySection);
    wrap.appendChild(CareSection.render({ targetType: 'bird', targetId: bird.id, name: bird.name || 'this bird', refresh: again }));
    wrap.appendChild(registrySection);
    wrap.appendChild(healthSection);
    wrap.appendChild(transferSection);
    wrap.appendChild(moneySection);
    appendBirdAccounting(wrap, bird, again);

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

  // Links you can set from the bird's side: its accounting entries (the same links can be set from the entry).
  function appendBirdAccounting(wrap, bird, again) {
    wrap.appendChild(Relations.many({
      title: 'Accounting', related: TRANSACTIONS_SAMPLE.filter(function (t) { return t.birdId === bird.id; }), render: transactionRow,
      parentName: 'bird', empty: 'No accounting entries linked to this bird.', refresh: again,
      unlink: function (t) { return updateRecord('transactions', t.id, { birdId: '' }); },
      candidates: function () { return Picker.listItems('transactions', function (t) { return t.birdId !== bird.id; }); },
      link: function (txId) { return updateRecord('transactions', txId, { birdId: bird.id }); },
      addPlaceholder: '+ Link an accounting entry — search…',
    }));
  }

  function makeRelChip(label, relBird, navigate) {
    return relBird ? birdChip(relBird, function () { navigate(relBird.id); }, label) : makeChip(label, 'Unknown', null);
  }

  function makeRegistryToggle(bird, onToggle) {
    return makeToggle(bird.registryPublic, 'Public in Registry', function (checked) {
      updateBird(bird.id, { registryPublic: checked }).catch(function () {});
      onToggle();
    });
  }

  // A fact cell that opens a chooser when tapped.
  function tappableFact(labelText, valueText, onClick) {
    var cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'fact fact-tap';
    var l = document.createElement('span');
    l.className = 'fact-label';
    l.textContent = labelText;
    var v = document.createElement('span');
    v.className = 'fact-value';
    v.textContent = valueText;
    cell.appendChild(l);
    cell.appendChild(v);
    cell.addEventListener('click', onClick);
    return cell;
  }

  // The species box: the taxonomy funnel — the common name (with the mutation in front when there is
  // one, e.g. "Red Factor Sun Conure"), the scientific name with ◀ ▶ to step to neighbouring groups,
  // the Ord · Fam · Gen · Spe · Sub · Mut circles, and a Birds of the World link (js/taxonomy-funnel.js).
  function buildSpeciesCard(bird) {
    var card = document.createElement('div');
    card.className = 'detail-section species-card';
    if (bird.speciesCode) {
      card.appendChild(TaxonomyFunnel.create(bird));
    } else {
      var heading = document.createElement('h3');
      heading.textContent = 'Taxonomy';
      card.appendChild(heading);
      var name = document.createElement('div');
      name.className = 'funnel-common';
      name.textContent = (bird.mutation ? bird.mutation + ' ' : '') + (bird.species || 'Unknown species');
      card.appendChild(name);
    }
    return card;
  }

  // Photos: the bird's pictures, and a dashed box with a + that opens the photo chooser (camera,
  // album, or the BirdBox library).
  function buildPhotosSection(bird, refresh) {
    return PhotosSection.render({ ownerType: 'bird', ownerId: bird.id, name: bird.name || bird.band || 'this bird', photos: bird.photos, refresh: refresh });
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

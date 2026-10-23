// Contacts (client list / address book) list+detail screen for business/contacts.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const ContactsScreen = (function () {
  var TYPES = ['All', 'Breeder', 'Pet Owner', 'Vendor', 'Store', 'My Team'];

  function typeClass(type) {
    return 'type-' + type.toLowerCase().replace(/\s+/g, '-');
  }

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  function renderList(main, navigate) {
    var state = { query: '', type: 'All' };

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search name or company…';
    searchInput.className = 'search-input';
    searchInput.setAttribute('aria-label', 'Search contacts');

    var chipsWrap = document.createElement('div');
    chipsWrap.className = 'filter-chips';

    var countLabel = document.createElement('p');
    countLabel.className = 'list-count';

    var listWrap = document.createElement('div');
    listWrap.className = 'list-rows';

    function draw() {
      clearEl(chipsWrap);
      TYPES.forEach(function (t) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip' + (state.type === t ? ' active' : '');
        chip.textContent = t;
        chip.addEventListener('click', function () {
          state.type = t;
          draw();
        });
        chipsWrap.appendChild(chip);
      });

      var q = state.query.trim().toLowerCase();
      var results = CONTACTS_SAMPLE.filter(function (c) {
        if (state.type !== 'All' && c.type !== (state.type === 'My Team' ? 'Team' : state.type)) return false;
        if (!q) return true;
        var hay = [c.name, c.company, c.city, c.state].filter(Boolean).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      countLabel.textContent = results.length + (results.length === 1 ? ' contact' : ' contacts');

      clearEl(listWrap);
      if (results.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'list-empty';
        empty.textContent = 'No contacts match that search.';
        listWrap.appendChild(empty);
      } else {
        results.forEach(function (c) { listWrap.appendChild(renderRow(c, navigate)); });
      }
    }

    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      draw();
    });

    draw();

    var contactActions = document.createElement('div');
    contactActions.className = 'list-actions';
    var addContact = document.createElement('button');
    addContact.type = 'button';
    addContact.className = 'add-record-btn';
    addContact.textContent = '+ Add Contact';
    addContact.addEventListener('click', function () { navigate('new'); });
    contactActions.appendChild(addContact);
    wrap.appendChild(contactActions);
    wrap.appendChild(searchInput);
    wrap.appendChild(chipsWrap);
    wrap.appendChild(countLabel);
    wrap.appendChild(listWrap);
    main.appendChild(wrap);
  }

  function renderRow(contact, navigate) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-row';

    var avatar = document.createElement('span');
    avatar.className = 'list-row-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Contacts.png';
    img.alt = '';
    avatar.appendChild(img);

    var info = document.createElement('span');
    info.className = 'list-row-info';

    var title = document.createElement('span');
    title.className = 'list-row-title';
    title.textContent = contact.name;

    var sub = document.createElement('span');
    sub.className = 'list-row-sub';
    var subParts = [contact.company, [contact.city, contact.state].filter(Boolean).join(', ')].filter(Boolean);
    var teamUser = contact.userId ? getUser(contact.userId) : null;
    sub.textContent = teamUser ? teamUser.role : subParts.join(' · ') || contact.type;

    info.appendChild(title);
    info.appendChild(sub);

    var type = document.createElement('span');
    type.className = 'type-badge ' + typeClass(contact.type);
    type.textContent = contact.type === 'Team' ? 'My Team' : contact.type;

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(type);

    row.addEventListener('click', function () { navigate(contact.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    // A team member's details are edited under My Team, not here.
    if (id.indexOf('edit~') === 0) {
      var editing = getContact(id.slice(5));
      if (editing && editing.userId) { location.hash = '#/account/myteam/edit~' + editing.userId; return; }
    }
    if (RecordForm.route(main, id, 'contacts', navigate, setTitle)) return;
    var contact = getContact(id);
    if (!contact) {
      var missing = document.createElement('p');
      missing.textContent = 'Contact not found.';
      main.appendChild(missing);
      return;
    }

    setTitle(contact.name);

    var wrap = document.createElement('div');
    wrap.className = 'detail-screen';

    var header = document.createElement('div');
    header.className = 'detail-header';

    var avatar = document.createElement('div');
    avatar.className = 'detail-avatar';
    var img = document.createElement('img');
    img.src = 'icons/tinted/business/Contacts.png';
    img.alt = '';
    avatar.appendChild(img);

    var titleWrap = document.createElement('div');
    titleWrap.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = contact.name;
    var typeBadge = document.createElement('span');
    typeBadge.className = 'type-badge ' + typeClass(contact.type);
    typeBadge.textContent = contact.type === 'Team' ? 'My Team' : contact.type;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(typeBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);
    header.appendChild(makeEditButton(function () { navigate('edit~' + contact.id); }));

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    [
      ['Company', contact.company || '—'],
      ['Location', [contact.city, contact.state].filter(Boolean).join(', ') || '—'],
      ['Email', contact.email || '—'],
      ['Phone', contact.phone || '—'],
    ].forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1])); });

    wrap.appendChild(header);
    if (!contact.userId) wrap.appendChild(BirdActions.contactRow(contact, function () { clearEl(main); renderDetail(main, id, navigate, setTitle); }));
    wrap.appendChild(factsGrid);

    var owned = contact.birdsOwned.map(getBird).filter(Boolean);
    var purchasing = contact.birdsPurchasing.map(getBird).filter(Boolean);

    var again = function () { clearEl(main); renderDetail(main, id, navigate, setTitle); };
    // Birds they own — add one here (or set the owner from the bird's page); remove to take it back.
    wrap.appendChild(Relations.many({
      title: 'Owns', related: owned, render: function (b) { return birdChip(b, function () { goToBird(b.id); }); },
      parentName: 'contact', empty: 'No birds owned.', refresh: again,
      unlink: function (b) { return setBirdsOwner([b.id], null); },
      candidates: function () { return Picker.listItems('birds', function (b) { return (contact.birdsOwned || []).indexOf(b.id) === -1; }); },
      link: function (birdId) { return setBirdsOwner([birdId], contact.id); },
      addPlaceholder: '+ This contact owns a bird — search…',
    }));
    if (purchasing.length) {
      var purchasingSection = document.createElement('div');
      purchasingSection.className = 'detail-section';
      var purchasingTitle = document.createElement('h3');
      purchasingTitle.textContent = 'Purchasing (' + purchasing.length + ')';
      purchasingSection.appendChild(purchasingTitle);
      var purchasingRow = document.createElement('div');
      purchasingRow.className = 'chip-row';
      purchasing.forEach(function (b) { purchasingRow.appendChild(birdChip(b, function () { goToBird(b.id); })); });
      purchasingSection.appendChild(purchasingRow);
      wrap.appendChild(purchasingSection);
    }
    wrap.appendChild(Relations.many({
      title: 'Accounting', related: TRANSACTIONS_SAMPLE.filter(function (t) { return t.clientId === contact.id; }), render: transactionRow,
      parentName: 'contact', empty: 'No accounting entries linked to this contact.', refresh: again,
      unlink: function (t) { return updateRecord('transactions', t.id, { clientId: '' }); },
      candidates: function () { return Picker.listItems('transactions', function (t) { return t.clientId !== contact.id; }); },
      link: function (txId) { return updateRecord('transactions', txId, { clientId: contact.id }); },
      addPlaceholder: '+ Link an accounting entry — search…',
    }));
    wrap.appendChild(Relations.many({
      title: 'Shipments', related: WAYBILLS_SAMPLE.filter(function (w) { return w.clientId === contact.id; }), render: waybillRow,
      parentName: 'contact', empty: 'No shipments linked to this contact.', refresh: again,
      unlink: function (w) { return editWaybill(w, waybillPayload(w, { clientId: null })); },
      candidates: function () { return Picker.listItems('waybills', function (w) { return w.clientId !== contact.id; }); },
      link: function (wbId) { var w = WAYBILLS_SAMPLE.filter(function (x) { return x.id === wbId; })[0]; return editWaybill(w, waybillPayload(w, { clientId: contact.id })); },
      addPlaceholder: '+ Link a shipment — search…',
    }));

    if (contact.notes) {
      var notesSection = document.createElement('div');
      notesSection.className = 'detail-section';
      var notesTitle = document.createElement('h3');
      notesTitle.textContent = 'Notes';
      var notesP = document.createElement('p');
      notesP.className = 'notes-text';
      notesP.textContent = contact.notes;
      notesSection.appendChild(notesTitle);
      notesSection.appendChild(notesP);
      wrap.appendChild(notesSection);
    }

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

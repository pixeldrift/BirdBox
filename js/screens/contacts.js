// Contacts (client list / address book) list+detail screen for business/contacts.
// Shared row/fact/chip helpers come from js/ui-helpers.js.
const ContactsScreen = (function () {
  var TYPES = ['All', 'Breeder', 'Pet Owner', 'Vendor', 'Store'];

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
        if (state.type !== 'All' && c.type !== state.type) return false;
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
    sub.textContent = subParts.join(' · ') || contact.type;

    info.appendChild(title);
    info.appendChild(sub);

    var type = document.createElement('span');
    type.className = 'type-badge ' + typeClass(contact.type);
    type.textContent = contact.type;

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(type);

    row.addEventListener('click', function () { navigate(contact.id); });
    return row;
  }

  function renderDetail(main, id, navigate, setTitle) {
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
    typeBadge.textContent = contact.type;
    titleWrap.appendChild(h2);
    titleWrap.appendChild(typeBadge);

    header.appendChild(avatar);
    header.appendChild(titleWrap);

    var factsGrid = document.createElement('div');
    factsGrid.className = 'fact-grid';
    [
      ['Company', contact.company || '—'],
      ['Location', [contact.city, contact.state].filter(Boolean).join(', ') || '—'],
      ['Email', contact.email || '—'],
      ['Phone', contact.phone || '—'],
    ].forEach(function (f) { factsGrid.appendChild(factRow(f[0], f[1])); });

    wrap.appendChild(header);
    wrap.appendChild(factsGrid);

    var owned = contact.birdsOwned.map(getBird).filter(Boolean);
    var purchasing = contact.birdsPurchasing.map(getBird).filter(Boolean);

    if (owned.length || purchasing.length) {
      var birdsSection = document.createElement('div');
      birdsSection.className = 'detail-section';
      var birdsTitle = document.createElement('h3');
      birdsTitle.textContent = 'Birds';
      birdsSection.appendChild(birdsTitle);

      if (owned.length) {
        var ownedLabel = document.createElement('p');
        ownedLabel.className = 'subsection-label';
        ownedLabel.textContent = 'Owns (' + owned.length + ')';
        birdsSection.appendChild(ownedLabel);
        var ownedRow = document.createElement('div');
        ownedRow.className = 'chip-row';
        owned.forEach(function (b) {
          ownedRow.appendChild(makeChip(null, birdShortLabel(b), function () { goToBird(b.id); }));
        });
        birdsSection.appendChild(ownedRow);
      }

      if (purchasing.length) {
        var purchasingLabel = document.createElement('p');
        purchasingLabel.className = 'subsection-label';
        purchasingLabel.textContent = 'Purchasing (' + purchasing.length + ')';
        birdsSection.appendChild(purchasingLabel);
        var purchasingRow = document.createElement('div');
        purchasingRow.className = 'chip-row';
        purchasing.forEach(function (b) {
          purchasingRow.appendChild(makeChip(null, birdShortLabel(b), function () { goToBird(b.id); }));
        });
        birdsSection.appendChild(purchasingRow);
      }

      wrap.appendChild(birdsSection);
    }

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

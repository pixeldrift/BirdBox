// Account -> Settings. Currently just Icon Style (choosing which icon pack resolveBirdIcon()
// draws from, see js/data/icon-taxonomy.js) — more preferences land here over time.
const SettingsScreen = (function () {
  function renderIconPackCard(pack, isActive, onSelect) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'pack-card' + (isActive ? ' active' : '');

    var preview = document.createElement('div');
    preview.className = 'pack-preview';
    ['bird', 'conure', 'macaw', 'cockatoo'].forEach(function (key) {
      var src = pack.icons[key];
      if (!src) return;
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      preview.appendChild(img);
    });

    var info = document.createElement('div');
    info.className = 'pack-info';
    var title = document.createElement('span');
    title.className = 'pack-label';
    title.textContent = pack.label;
    var desc = document.createElement('span');
    desc.className = 'pack-description';
    desc.textContent = pack.description;
    info.appendChild(title);
    info.appendChild(desc);

    card.appendChild(preview);
    card.appendChild(info);
    if (isActive) {
      var check = document.createElement('span');
      check.className = 'pack-check';
      check.textContent = '✓';
      card.appendChild(check);
    }

    if (!isActive) card.addEventListener('click', onSelect);
    return card;
  }

  function sectionEl(title) {
    var section = document.createElement('div');
    section.className = 'detail-section';
    var h = document.createElement('h3');
    h.textContent = title;
    section.appendChild(h);
    return section;
  }

  function noteEl(text) {
    var p = document.createElement('p');
    p.className = 'form-note';
    p.textContent = text;
    return p;
  }

  function button(cls, text, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  // My Aviary: the name, optional public details, and logo and photos, all in one place.
  function aviaryCard(main) {
    var section = sectionEl('My Aviary');
    var facts = document.createElement('div');
    facts.className = 'fact-grid';
    [['Name', AVIARY.name], ['About', AVIARY.description], ['Address', AVIARY.address], ['Phone', AVIARY.phone], ['Email', AVIARY.email], ['Website', AVIARY.website], ['Social', AVIARY.socials]].forEach(function (f) { if (f[1]) facts.appendChild(factRow(f[0], f[1])); });
    section.appendChild(facts);
    section.appendChild(noteEl('Everything is optional apart from the name. These details can be used later in the public directory.'));
    section.appendChild(button('add-record-btn', 'Edit my aviary', function () { location.hash = '#/account/settings/edit~main'; }));
    var photos = PhotosSection.render({
      title: 'Logo & photos', ownerType: 'aviary', ownerId: 'main', name: AVIARY.name, photos: mediaPhotos('aviary', 'main'),
      refresh: function () { renderList(main); },
    });
    photos.className = 'photo-sub'; // part of this card, not a card of its own
    section.appendChild(photos);
    return section;
  }

  function renderDetail(main, id, navigate, setTitle) {
    if (id === 'edit~main') {
      RecordForm.render(main, {
        type: 'aviary', id: 'main', navigate: navigate, setTitle: setTitle,
        after: function () { location.hash = '#/account/settings'; },
        onCancel: function () { location.hash = '#/account/settings'; },
      });
      return;
    }
    if (id === 'edit~me') return ProfileUI.editForm(main, navigate, setTitle, '#/account/settings');
    renderList(main);
  }

  function renderList(main) {
    clearEl(main);

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';
    wrap.appendChild(aviaryCard(main));
    wrap.appendChild(ProfileUI.card(function () { renderList(main); }, '#/account/settings/edit~me'));

    var section = document.createElement('div');
    section.className = 'detail-section';
    var title = document.createElement('h3');
    title.textContent = 'App — Icon Style';
    section.appendChild(title);

    var note = document.createElement('p');
    note.className = 'form-note';
    note.textContent = 'Choose how bird thumbnails look when there’s no photo set. Applies everywhere immediately — like switching a color scheme, not a per-bird setting.';
    section.appendChild(note);

    var activeId = getActiveIconPackId();
    var list = document.createElement('div');
    list.className = 'pack-list';
    getIconPacks().forEach(function (pack) {
      list.appendChild(renderIconPackCard(pack, pack.id === activeId, function () {
        setActiveIconPackId(pack.id);
        renderList(main);
      }));
    });
    section.appendChild(list);

    var credit = document.createElement('p');
    credit.className = 'form-note';
    credit.appendChild(document.createTextNode('The artwork in these styles belongs to its artists. '));
    var creditLink = document.createElement('a');
    creditLink.className = 'ext-link';
    creditLink.href = '#/account/credits';
    creditLink.textContent = 'See Credits';
    credit.appendChild(creditLink);
    section.appendChild(credit);

    if (getIconPacks().length === 1) {
      var moreNote = document.createElement('p');
      moreNote.className = 'form-note';
      moreNote.textContent = 'Only one style today — more (simplified, cartoon, realistic) can be added here once illustrated.';
      section.appendChild(moreNote);
    }

    wrap.appendChild(section);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

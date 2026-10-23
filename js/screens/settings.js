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

  // My Profile: the signed-in person's own details — the same fields as a team member (My Team), and the very same record, so
  // changing them here changes the team list and the address book too. Until there are logins, this browser remembers who you are.
  function profileCard(main) {
    var section = sectionEl('My Profile');
    var me = currentUser();
    var again = function () { renderList(main); };
    if (!me) {
      section.appendChild(noteEl(USERS_SAMPLE.length ? 'Which team member are you? Your details then live here, and match your entry in the address book.' : 'Add yourself so BirdBox knows who you are. You’ll be listed in My Team and the address book.'));
      if (USERS_SAMPLE.length) {
        section.appendChild(Picker.users({ placeholder: 'I’m… search the team', onChange: function (id) { if (id) { setCurrentUser(id); again(); } } }).el);
      }
      section.appendChild(button('add-record-btn', '+ Create my profile', function () { createProfile(again); }));
      return section;
    }
    var head = document.createElement('div');
    head.className = 'detail-header';
    var av = document.createElement('span');
    av.className = 'detail-avatar';
    var contact = getContact('c-' + me.id);
    if (contact && contact.photoUrl) fillThumb(av, { src: contact.photoUrl });
    else { var ini = document.createElement('span'); ini.className = 'initials-avatar'; ini.textContent = ((me.firstName || '').charAt(0) + (me.lastName || '').charAt(0)).toUpperCase() || '?'; av.appendChild(ini); }
    head.appendChild(av);
    var t = document.createElement('div');
    t.className = 'detail-title';
    var h2 = document.createElement('h2');
    h2.textContent = userFullName(me);
    t.appendChild(h2);
    var badge = document.createElement('span');
    badge.className = 'type-badge role-' + String(me.role).toLowerCase();
    badge.textContent = me.role;
    t.appendChild(badge);
    head.appendChild(t);
    section.appendChild(head);
    var facts = document.createElement('div');
    facts.className = 'fact-grid';
    facts.appendChild(factRow('Email', me.email || '—'));
    facts.appendChild(factRow('Phone', me.phone || '—'));
    section.appendChild(facts);
    section.appendChild(noteEl('This is your team entry too, so editing it here updates My Team and the address book.'));
    section.appendChild(button('add-record-btn', 'Edit my profile', function () { location.hash = '#/account/settings/edit~me'; }));
    var photo = PhotosSection.render({
      title: 'My photo', ownerType: 'contact', ownerId: 'c-' + me.id, name: userFullName(me), photos: mediaPhotos('contact', 'c-' + me.id), refresh: again,
    });
    photo.className = 'photo-sub';
    section.appendChild(photo);
    section.appendChild(button('pick-link', 'That’s not me', function () { setCurrentUser(''); again(); }));
    return section;
  }

  // A small sheet to add yourself as a team member (an Owner) and remember it's you.
  function createProfile(done) {
    Modal.open({
      title: 'Create my profile',
      build: function (body, close) {
        function field(label, ph) {
          var f = document.createElement('div');
          f.className = 'form-field';
          var l = document.createElement('span');
          l.className = 'form-label';
          l.textContent = label;
          var i = document.createElement('input');
          i.className = 'form-input';
          i.placeholder = ph || '';
          f.appendChild(l);
          f.appendChild(i);
          body.appendChild(f);
          return i;
        }
        var first = field('First name');
        var last = field('Last name');
        var email = field('Email');
        var phone = field('Phone');
        var msg = document.createElement('div');
        body.appendChild(msg);
        body.appendChild(button('save-btn', 'Create profile', function () {
          if (!first.value.trim()) { msg.textContent = 'Enter your first name.'; msg.className = 'form-message error'; return; }
          createRecord('users', { firstName: first.value.trim(), lastName: last.value.trim(), role: 'Owner', status: 'Active', email: email.value.trim(), phone: phone.value.trim() })
            .then(function (u) { setCurrentUser(u.id); close(); done(); })
            .catch(function (err) { msg.textContent = err.message; msg.className = 'form-message error'; });
        }));
      },
    });
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
    if (id === 'edit~me' && currentUser()) {
      // The same team-member form and record as My Team, minus the things you don't change about yourself.
      RecordForm.render(main, {
        type: 'users', id: currentUser().id, navigate: navigate, setTitle: function () { setTitle('My profile'); }, hide: ['role', 'status'], noDelete: true,
        after: function () { location.hash = '#/account/settings'; },
        onCancel: function () { location.hash = '#/account/settings'; },
      });
      return;
    }
    renderList(main);
  }

  function renderList(main) {
    clearEl(main);

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';
    wrap.appendChild(aviaryCard(main));
    wrap.appendChild(profileCard(main));

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

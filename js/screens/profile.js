// My Profile: the signed-in person's own details — the same fields as a team member (My Team), and the very same record, so
// changing them here changes the team list and the address book too. Until there are logins, this browser remembers who you are.
// Shown on its own tab (Account → My Profile) and as a card in Account → Settings.
const ProfileUI = (function () {
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

  // My Profile: the signed-in person's own details — the same fields as a team member (My Team), and the very same record, so
  // changing them here changes the team list and the address book too. Until there are logins, this browser remembers who you are.
  function card(again, editHash) {
    var section = sectionEl('My Profile');
    var me = currentUser();
    if (!me) {
      section.appendChild(noteEl(USERS_SAMPLE.length ? 'Which team member are you? Your details then live here, and match your entry in the address book.' : 'Add yourself so BirdBox knows who you are. You’ll be listed in My Team and the address book.'));
      if (USERS_SAMPLE.length) {
        section.appendChild(Picker.users({ placeholder: 'I’m… search the team', onChange: function (id) { if (id) { setCurrentUser(id); again(); } } }).el);
      }
      section.appendChild(button('btn-positive', '+ Create My Profile', function () { createProfile(again); }));
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
    section.appendChild(button('btn-positive', 'Edit my profile', function () { location.hash = editHash; }));
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


  // The edit form: the team-member form minus the things you don't change about yourself.
  function editForm(main, navigate, setTitle, backHash) {
    var me = currentUser();
    if (!me) { location.hash = backHash; return; }
    RecordForm.render(main, {
      type: 'users', id: me.id, navigate: navigate, setTitle: function () { setTitle('My profile'); }, hide: ['role', 'status'], noDelete: true,
      after: function () { location.hash = backHash; },
      onCancel: function () { location.hash = backHash; },
    });
  }

  return { card: card, editForm: editForm };
})();

// Account → My Profile
const MyProfileScreen = (function () {
  function renderList(main) {
    clearEl(main);
    var wrap = document.createElement('div');
    wrap.className = 'list-screen';
    wrap.appendChild(ProfileUI.card(function () { renderList(main); }, '#/account/myprofile/edit~me'));
    main.appendChild(wrap);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'edit~me') return ProfileUI.editForm(main, navigate, setTitle, '#/account/myprofile');
    renderList(main);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

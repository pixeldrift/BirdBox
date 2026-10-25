// Account → My Team: the people who help run the aviary — employees, volunteers, family. There are
// no logins yet; a team member is a record with a name, contact details and a role, ready to be
// assigned to tasks later. Each one is also kept in the address book (Contacts → My Team).
// Routes: <id> · new · edit~<id>
const TeamScreen = (function () {
  var state = { query: '', role: 'All' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function roleClass(role) { return 'role-' + String(role).toLowerCase(); }

  function initials(u) {
    return ((u.firstName || '').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase() || '?';
  }

  function avatar(u, cls) {
    var a = el('span', cls || 'list-row-avatar');
    var contact = getContact('c-' + u.id); // a photo on their address-book entry is their picture
    if (contact && contact.photoUrl) fillThumb(a, { src: contact.photoUrl });
    else a.appendChild(el('span', 'initials-avatar', initials(u)));
    return a;
  }

  function row(u, navigate) {
    var btn = el('button', 'list-row');
    btn.type = 'button';
    btn.appendChild(avatar(u));
    var info = el('span', 'list-row-info');
    info.appendChild(el('span', 'list-row-title', userFullName(u) + (currentUserId() === u.id ? ' (you)' : '')));
    info.appendChild(el('span', 'list-row-sub', [u.email, u.phone].filter(Boolean).join(' · ') || 'No contact details yet'));
    btn.appendChild(info);
    btn.appendChild(el('span', 'type-badge ' + (u.status === 'Inactive' ? 'status-inactive-user' : roleClass(u.role)), u.status === 'Inactive' ? 'Inactive' : u.role));
    btn.addEventListener('click', function () { navigate(u.id); });
    return btn;
  }

  function renderList(main, navigate) {
    var wrap = el('div', 'list-screen');
    var actions = el('div', 'list-actions');
    var add = el('button', 'btn-positive', '+ Add Team Member');
    add.type = 'button';
    add.addEventListener('click', function () { navigate('new'); });
    actions.appendChild(add);
    var search = el('input', 'search-input');
    search.type = 'search';
    search.placeholder = 'Search your team…';
    search.value = state.query;
    var chips = el('div', 'filter-chips');
    var count = el('p', 'list-count');
    var list = el('div', 'list-rows');

    function draw() {
      clearEl(chips);
      ['All'].concat(USER_ROLES.map(function (r) { return r.id; })).forEach(function (r) {
        var c = el('button', 'filter-chip' + (state.role === r ? ' active' : ''), r);
        c.type = 'button';
        c.addEventListener('click', function () { state.role = r; draw(); });
        chips.appendChild(c);
      });
      var q = state.query.trim().toLowerCase();
      var results = USERS_SAMPLE.filter(function (u) {
        if (state.role !== 'All' && u.role !== state.role) return false;
        return !q || [userFullName(u), u.role, u.email, u.phone].join(' ').toLowerCase().indexOf(q) !== -1;
      });
      count.textContent = results.length + (results.length === 1 ? ' team member' : ' team members');
      clearEl(list);
      results.forEach(function (u) { list.appendChild(row(u, navigate)); });
      if (!results.length) {
        list.appendChild(el('p', 'list-empty', USERS_SAMPLE.length ? 'No one matches.' : 'No team members yet — add yourself and anyone who helps, like employees and volunteers.'));
      }
    }
    search.addEventListener('input', function (e) { state.query = e.target.value; draw(); });
    draw();
    var note = el('p', 'form-note', 'Team members are also listed in your address book under Contacts → My Team. Logins and permissions come later.');
    [actions, search, chips, count, list, note].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new' || id.indexOf('edit~') === 0) {
      var editId = id === 'new' ? null : id.slice(5);
      RecordForm.render(main, {
        type: 'users', id: editId, navigate: navigate, setTitle: setTitle,
        after: function (savedId) { navigate(savedId); },
        onCancel: function () { if (editId) navigate(editId); else location.hash = '#/account/myteam'; },
        afterDelete: function () { location.hash = '#/account/myteam'; },
      });
      return;
    }
    var u = getUser(id);
    if (!u) { main.appendChild(el('p', '', 'Team member not found.')); return; }
    setTitle(userFullName(u));
    var wrap = el('div', 'detail-screen');
    var header = el('div', 'detail-header');
    header.appendChild(avatar(u, 'detail-avatar'));
    var t = el('div', 'detail-title');
    t.appendChild(el('h2', '', userFullName(u)));
    t.appendChild(el('span', 'type-badge ' + roleClass(u.role), u.role + (u.status === 'Inactive' ? ' · Inactive' : '')));
    header.appendChild(t);
    header.appendChild(makeEditButton(function () { navigate('edit~' + u.id); }));
    wrap.appendChild(header);

    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Email', u.email || '—'));
    facts.appendChild(factRow('Phone', u.phone || '—'));
    var roleInfo = USER_ROLES.filter(function (r) { return r.id === u.role; })[0];
    if (roleInfo) facts.appendChild(factRow('Role', roleInfo.id + ' — ' + roleInfo.blurb));
    wrap.appendChild(facts);

    var book = getContact('c-' + u.id);
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', 'Address book'));
    section.appendChild(el('p', 'form-note', 'Listed in your address book automatically.'));
    if (book) {
      var open = el('button', 'pick-link', 'Open in Contacts');
      open.type = 'button';
      open.addEventListener('click', function () { location.hash = '#/business/contacts/' + book.id; });
      section.appendChild(open);
    }
    wrap.appendChild(section);
    if (u.notes) {
      var n = el('div', 'detail-section');
      n.appendChild(el('h3', '', 'Notes'));
      n.appendChild(el('p', 'notes-text', u.notes));
      wrap.appendChild(n);
    }
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

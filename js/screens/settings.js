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

  // Your account: who's signed in, and the sample data (a copy of the demo aviary you can look around in, and clear out
  // again without touching anything you've added).
  function accountCard(main) {
    var section = sectionEl('Your account');
    var body = document.createElement('div');
    section.appendChild(body);
    function post(action) {
      return fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action }) })
        .then(function (res) { return res.json().then(function (d) { if (!res.ok) throw new Error(d.error || 'That didn’t work'); return d; }); });
    }
    function reloadApp() { location.reload(); }
    function draw(p) {
      clearEl(body);
      if (!p) { body.appendChild(noteEl('Account details aren’t available right now.')); return; }
      var facts = document.createElement('div');
      facts.className = 'fact-grid';
      if (Auth.enabled) {
        if (p.me && p.me.name) facts.appendChild(factRow('Signed in as', p.me.name + (p.me.role ? ' · ' + p.me.role : '')));
        if (Auth.email()) facts.appendChild(factRow('Email', Auth.email()));
      }
      facts.appendChild(factRow('Aviary', p.account.name));
      section.insertBefore(facts, body);
      body.appendChild(noteEl(p.demo.loaded
        ? 'The sample aviary is loaded — a made-up flock, places, supplies and records to explore. Remove it when you’re ready to start with your own; anything you’ve added yourself stays.'
        : 'Want something to look around in? Load a made-up sample aviary — you can remove it again any time.'));
      var btn = button(p.demo.loaded ? 'add-record-btn danger-btn' : 'btn-positive', p.demo.loaded ? 'Remove sample data' : 'Load sample data', function () {
        function go() { btn.disabled = true; post(p.demo.loaded ? 'remove-demo' : 'load-demo').then(reloadApp).catch(function (err) { btn.disabled = false; Modal.alert(err.message, 'Couldn’t do that'); }); }
        if (p.demo.loaded) Modal.confirm({ title: 'Remove the sample data?', message: 'This deletes only the made-up sample records. Anything you added yourself stays.', confirmLabel: 'Remove', danger: true, onConfirm: go });
        else go();
      });
      body.appendChild(btn);
      if (Auth.enabled) body.appendChild(button('add-record-btn', 'Sign out', function () { Auth.signOut(); }));
    }
    Auth.refresh().then(draw).catch(function () { draw(null); });
    return section;
  }

  // My Aviary: the name, optional public details, and logo and photos, all in one place.
  function aviaryCard(main) {
    var section = sectionEl('My Aviary');
    var facts = document.createElement('div');
    facts.className = 'fact-grid';
    [['Name', AVIARY.name], ['About', AVIARY.description], ['Address', AVIARY.address], ['Phone', AVIARY.phone], ['Email', AVIARY.email], ['Website', AVIARY.website], ['Social', AVIARY.socials], ['What I keep', AVIARY.keeps]].forEach(function (f) { if (f[1]) facts.appendChild(factRow(f[0], f[1])); });
    section.appendChild(facts);
    section.appendChild(noteEl('Everything is optional apart from the name. These details can be used later in the public directory.'));
    section.appendChild(button('btn-positive', 'Edit my aviary', function () { location.hash = '#/account/settings/edit~main'; }));
    var photos = PhotosSection.render({
      title: 'Logo & photos', ownerType: 'aviary', ownerId: 'main', name: AVIARY.name, photos: mediaPhotos('aviary', 'main'),
      refresh: function () { renderList(main); },
    });
    photos.className = 'photo-sub'; // part of this card, not a card of its own
    section.appendChild(photos);
    return section;
  }

  // How often each disease should be re-tested. The starting values are common practice, not rules — change any of them.
  function testRemindersCard(main) {
    var section = sectionEl('Test reminders');
    section.appendChild(noteEl('How often each disease should be tested again. BirdBox flags a test as due soon (within ' + DUE_SOON_DAYS + ' days) or overdue. The starting values are common practice — they vary by disease, program and state, so check with your vet and change them to suit you.'));
    var OPTIONS = [[0, 'No reminder'], [3, 'Every 3 months'], [6, 'Every 6 months'], [12, 'Every year'], [24, 'Every 2 years'], [36, 'Every 3 years']];
    knownDiseases().forEach(function (disease) {
      var current = testIntervalMonths(disease);
      var row = document.createElement('div');
      row.className = 'reminder-row';
      var label = document.createElement('span');
      label.className = 'reminder-label';
      label.textContent = disease;
      row.appendChild(label);
      var sel = document.createElement('select');
      sel.className = 'form-input reminder-select';
      sel.setAttribute('aria-label', disease + ' retest interval');
      var opts = OPTIONS.slice();
      if (!opts.some(function (o) { return o[0] === current; })) opts.push([current, 'Every ' + current + ' months']);
      opts.forEach(function (o) { var op = document.createElement('option'); op.value = String(o[0]); op.textContent = o[1]; sel.appendChild(op); });
      sel.value = String(current);
      sel.addEventListener('change', function () {
        setTestInterval(disease, Number(sel.value)).then(function () { renderList(main); }).catch(function (err) { Modal.alert(err.message || 'That didn’t save — try again.', 'Couldn’t save that'); });
      });
      row.appendChild(sel);
      section.appendChild(row);
    });
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
    wrap.appendChild(accountCard(main));
    wrap.appendChild(aviaryCard(main));
    wrap.appendChild(ProfileUI.card(function () { renderList(main); }, '#/account/settings/edit~me'));
    wrap.appendChild(testRemindersCard(main));

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
    creditLink.href = '#/account/about';
    creditLink.textContent = 'See About';
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

// Account -> Settings: My Aviary (with the sample data), your profile, Icon Style (which icon pack resolveBirdIcon() draws from, see js/data/icon-taxonomy.js), then
// Customize menus (reorder / hide / move the home tiles and tabs). Your profile is its own tab.
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

  // Under "Edit my aviary": the sample data (a made-up aviary to look around in, removable without touching anything you've added), and — for
  // the owner of the original data — the way to bring it into this login. Small, so they don't compete with the main button.
  function accountActions(box) {
    function post(action) {
      return fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: action }) })
        .then(function (res) { return res.json().then(function (d) { if (!res.ok) throw new Error(d.error || 'That didn’t work'); return d; }); });
    }
    function reloadApp() { location.reload(); }
    function draw(p) {
      clearEl(box);
      if (!p) return;
      if (p.claim && p.claim.available) {
        box.appendChild(noteEl('You look like the owner of the original BirdBox data — the aviary you had before accounts. This login is on a new, separate account.'));
        box.appendChild(button('add-record-btn small-btn', 'Use my original data', function () {
          Modal.confirm({ title: 'Switch to your original data?', message: 'This login will open your original aviary — all the birds and records you had before accounts. The new, empty account it started with is left unused.', confirmLabel: 'Switch', onConfirm: function () { post('claim-legacy').then(reloadApp).catch(function (err) { Modal.alert(err.message, 'Couldn’t do that'); }); } });
        }));
      }
      var btn = button(p.demo.loaded ? 'add-record-btn small-btn danger-btn' : 'add-record-btn small-btn', p.demo.loaded ? 'Remove sample data' : 'Load sample data', function () {
        function go() { btn.disabled = true; post(p.demo.loaded ? 'remove-demo' : 'load-demo').then(reloadApp).catch(function (err) { btn.disabled = false; Modal.alert(err.message, 'Couldn’t do that'); }); }
        if (p.demo.loaded) Modal.confirm({ title: 'Remove the sample data?', message: 'This deletes only the made-up sample records. Anything you added yourself stays.', confirmLabel: 'Remove', danger: true, onConfirm: go });
        else go();
      });
      box.appendChild(btn);
    }
    Auth.refresh().then(draw).catch(function () { draw(null); });
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
    var more = document.createElement('div');
    more.className = 'account-actions';
    section.appendChild(more);
    accountActions(more);
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

    // The menu editor (it used to be its own Customize tab): reorder, hide or move the home tiles and tabs.
    var menus = sectionEl('Customize menus');
    var menuBody = document.createElement('div');
    menus.appendChild(menuBody);
    wrap.appendChild(menus);
    NavEditor.build(menuBody);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

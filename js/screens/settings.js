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

  function renderList(main) {
    clearEl(main);

    var wrap = document.createElement('div');
    wrap.className = 'list-screen';

    var section = document.createElement('div');
    section.className = 'detail-section';
    var title = document.createElement('h3');
    title.textContent = 'Icon Style';
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

    if (getIconPacks().length === 1) {
      var moreNote = document.createElement('p');
      moreNote.className = 'form-note';
      moreNote.textContent = 'Only one style today — more (simplified, cartoon, realistic) can be added here once illustrated.';
      section.appendChild(moreNote);
    }

    wrap.appendChild(section);
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderList };
})();

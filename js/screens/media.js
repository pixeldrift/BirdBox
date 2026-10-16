// The media library (#/business/media): every photo, receipt, waybill, invoice and document in
// one searchable list, independent of the records they're linked to. Search finds a file by its
// name or by anything it's linked to (a bird's band or name, a client, a shipment…). A file can
// be linked to many records and re-used; deleting it here removes it everywhere.
const MediaScreen = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function dateOf(m) {
    return m.createdAt ? formatDate(m.createdAt) : '';
  }

  function titleOf(m) {
    return m.title || m.filename || mediaTypeInfo(m.type).one;
  }

  function linkedNames(m, limit) {
    var names = m.links.map(mediaTargetInfo).filter(Boolean).map(function (i) { return i.text; });
    if (!names.length) return 'Not linked to anything yet';
    return names.slice(0, limit).join(' · ') + (names.length > limit ? ' +' + (names.length - limit) : '');
  }

  function renderList(main, navigate) {
    var state = { query: '', type: 'All' };
    var wrap = el('div', 'list-screen');

    var actions = el('div', 'list-actions');
    var up = el('button', 'add-record-btn', '+ Upload');
    up.type = 'button';
    up.addEventListener('click', function () { navigate('new'); });
    actions.appendChild(up);

    var search = el('input', 'search-input');
    search.type = 'search';
    search.placeholder = 'Search name, bird, client, shipment…';
    search.setAttribute('aria-label', 'Search media');
    var chips = el('div', 'filter-chips');
    var count = el('p', 'list-count');
    var rows = el('div', 'list-rows');

    function draw() {
      clearEl(chips);
      [{ type: 'All', label: 'All' }].concat(MEDIA_TYPES).forEach(function (t) {
        var chip = el('button', 'filter-chip' + (state.type === t.type ? ' active' : ''), t.label);
        chip.type = 'button';
        chip.addEventListener('click', function () { state.type = t.type; draw(); });
        chips.appendChild(chip);
      });
      var words = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var results = MEDIA.filter(function (m) {
        if (state.type !== 'All' && m.type !== state.type) return false;
        if (!words.length) return true;
        var hay = mediaSearchText(m);
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      clearEl(count);
      count.appendChild(el('strong', '', String(results.length)));
      count.appendChild(document.createTextNode(results.length === 1 ? ' file' : ' files'));
      clearEl(rows);
      if (!results.length) rows.appendChild(el('p', 'list-empty', MEDIA.length ? 'No files match that.' : 'Nothing here yet — upload a receipt, waybill or photo to start your library.'));
      results.forEach(function (m) {
        var row = el('button', 'list-row');
        row.type = 'button';
        var avatar = el('span', 'list-row-avatar');
        fillThumb(avatar, mediaThumbSpec(m));
        var info = el('span', 'list-row-info');
        info.appendChild(el('span', 'list-row-title', titleOf(m)));
        info.appendChild(el('span', 'list-row-sub', [mediaTypeInfo(m.type).one, linkedNames(m, 2)].join(' · ')));
        var side = el('span', 'list-row-amount');
        side.appendChild(el('span', 'form-note', dateOf(m)));
        row.appendChild(avatar);
        row.appendChild(info);
        row.appendChild(side);
        row.addEventListener('click', function () { navigate(m.id); });
        rows.appendChild(row);
      });
    }

    search.addEventListener('input', function (e) { state.query = e.target.value; draw(); });
    draw();
    [actions, search, chips, count, rows].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);
  }

  function renderUpload(main, navigate, setTitle) {
    setTitle('Upload to Library');
    var wrap = el('div', 'detail-screen');
    var form = el('form', 'detail-section record-form');

    function field(labelText, control, hint) {
      var l = el('label', 'form-field');
      l.appendChild(el('span', 'form-label', labelText));
      l.appendChild(control);
      if (hint) l.appendChild(el('p', 'form-note', hint));
      return l;
    }

    var type = el('select', 'form-input');
    MEDIA_TYPES.forEach(function (t) {
      var o = el('option', '', t.one);
      o.value = t.type;
      type.appendChild(o);
    });
    var file = el('input', 'form-input');
    file.type = 'file';
    file.accept = 'image/*,application/pdf';
    file.multiple = true;
    var title = el('input', 'form-input');
    title.type = 'text';
    title.placeholder = 'Optional — otherwise the file name is used';
    var errorBox = el('div');
    var save = el('button', 'save-btn', 'Upload');
    save.type = 'submit';

    [field('What is it?', type), field('File', file, 'A photo or a PDF, up to 3 MB each. You can choose several.'),
      field('Title', title), errorBox, save].forEach(function (e) { form.appendChild(e); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearEl(errorBox);
      var files = Array.prototype.slice.call(file.files);
      if (!files.length) { errorBox.appendChild(el('p', 'form-message error', 'Choose a file')); return; }
      save.disabled = true;
      save.textContent = 'Uploading…';
      var made = [];
      files.reduce(function (chain, f) {
        return chain.then(function () { return uploadMedia(f, type.value, [], files.length === 1 ? title.value : '').then(function (m) { made.push(m); }); });
      }, Promise.resolve()).then(function () {
        navigate(made.length === 1 ? made[0].id : '');
        if (made.length !== 1) location.hash = '#/business/media';
      }).catch(function (err) {
        save.disabled = false;
        save.textContent = 'Upload';
        errorBox.appendChild(el('p', 'form-message error', err.message));
      });
    });

    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new') return renderUpload(main, navigate, setTitle);
    var m = getMedia(id);
    if (!m) { main.appendChild(el('p', '', 'File not found.')); return; }
    setTitle(titleOf(m));
    var again = function () { renderDetail(main, id, navigate, setTitle); };

    var wrap = el('div', 'detail-screen');

    // The file itself.
    var view = el('div', 'detail-section');
    var open = el('a', 'media-preview');
    open.href = m.url;
    open.target = '_blank';
    open.rel = 'noopener';
    if (mediaIsImage(m)) {
      var img = document.createElement('img');
      img.src = m.url;
      img.alt = titleOf(m);
      open.appendChild(img);
    } else {
      open.appendChild(el('span', 'media-pdf', 'PDF · tap to open'));
    }
    view.appendChild(open);
    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Type', mediaTypeInfo(m.type).one));
    facts.appendChild(factRow('Added', dateOf(m)));
    facts.appendChild(factRow('File', m.filename || '—'));
    view.appendChild(facts);

    var nameField = el('label', 'form-field');
    nameField.appendChild(el('span', 'form-label', 'Title'));
    var name = el('input', 'form-input');
    name.type = 'text';
    name.value = m.title;
    name.placeholder = m.filename || 'Add a title';
    nameField.appendChild(name);
    var rename = el('button', 'add-record-btn', 'Save title');
    rename.type = 'button';
    var msg = el('div');
    rename.addEventListener('click', function () {
      renameMedia(m.id, name.value).then(again).catch(function (err) {
        clearEl(msg);
        msg.appendChild(el('p', 'form-message error', err.message));
      });
    });
    view.appendChild(nameField);
    view.appendChild(rename);
    view.appendChild(msg);
    wrap.appendChild(view);

    // What it's linked to.
    var links = el('div', 'detail-section');
    links.appendChild(el('h3', '', 'Linked to'));
    if (!m.links.length) links.appendChild(el('p', 'form-note', 'Not linked to anything yet. Link it to the birds, shipment or accounting entry it belongs to — as many as you like.'));
    m.links.forEach(function (l) {
      var info = mediaTargetInfo(l);
      if (!info) return;
      var row = el('div', 'file-row');
      var a = el('a', '', info.kind + ': ' + info.text);
      a.href = info.hash;
      row.appendChild(a);
      var x = el('button', 'file-remove', '✕');
      x.type = 'button';
      x.setAttribute('aria-label', 'Unlink from ' + info.text);
      x.addEventListener('click', function () {
        unlinkMedia(m.id, l.targetType, l.targetId).then(again).catch(function (err) {
          clearEl(msg);
          msg.appendChild(el('p', 'form-message error', err.message));
        });
      });
      row.appendChild(x);
      links.appendChild(row);
    });

    var linkSearch = el('input', 'form-input');
    linkSearch.type = 'search';
    linkSearch.placeholder = 'Link to a bird, client, shipment, accounting entry…';
    var linkOut = el('div', 'pick-results');
    var candidates = null;
    linkSearch.addEventListener('input', function () {
      clearEl(linkOut);
      var words = linkSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return;
      candidates = candidates || mediaLinkCandidates();
      var found = candidates.filter(function (c) {
        return !mediaLinkedTo(m, c.targetType, c.targetId) && words.every(function (w) { return c.hay.indexOf(w) !== -1; });
      }).slice(0, 8);
      if (!found.length) linkOut.appendChild(el('p', 'pick-empty', 'Nothing matches that.'));
      found.forEach(function (c) {
        var o = el('button', 'pick-option');
        o.type = 'button';
        o.appendChild(el('span', '', c.text));
        o.appendChild(el('small', '', c.kind));
        o.addEventListener('click', function () {
          o.disabled = true;
          linkMedia(m.id, c.targetType, c.targetId).then(again).catch(function (err) {
            o.disabled = false;
            clearEl(msg);
            msg.appendChild(el('p', 'form-message error', err.message));
          });
        });
        linkOut.appendChild(o);
      });
    });
    links.appendChild(linkSearch);
    links.appendChild(linkOut);
    wrap.appendChild(links);

    // Deleting removes it everywhere it's linked.
    var danger = el('div', 'detail-section');
    var del = el('button', 'add-record-btn', 'Delete this file');
    del.type = 'button';
    del.addEventListener('click', function () {
      var n = m.links.length;
      if (!window.confirm('Delete this file' + (n ? ' and remove it from ' + n + ' linked record' + (n === 1 ? '' : 's') : '') + '? This can’t be undone.')) return;
      deleteMedia(m.id).then(function () { location.hash = '#/business/media'; }).catch(function (err) {
        clearEl(msg);
        msg.appendChild(el('p', 'form-message error', err.message));
      });
    });
    danger.appendChild(del);
    wrap.appendChild(danger);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

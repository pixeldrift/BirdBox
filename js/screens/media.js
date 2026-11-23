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

  // Calls onSwipe(+1) for a swipe to the left (next) or onSwipe(-1) for a swipe to the right (previous).
  function swipe(target, onSwipe) {
    var start = null;
    target.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { start = null; return; }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    target.addEventListener('touchend', function (e) {
      if (!start) return;
      var t = e.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // Full-screen picture with a close button at the top right; swipe (or use the arrows / arrow keys) to move through the others.
  function viewer(list, index, onClose) {
    if (!list.length) return;
    var i = index;
    var overlay = el('div', 'media-viewer');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Photo viewer');
    var pic = document.createElement('img');
    pic.className = 'media-viewer-img';
    pic.alt = '';
    var cap = el('div', 'media-viewer-cap');
    var close = el('button', 'media-viewer-btn media-viewer-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.appendChild(ListTools.icon('close'));
    var prev = el('button', 'media-viewer-btn media-viewer-prev');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous photo');
    prev.appendChild(ListTools.icon('prev'));
    var next = el('button', 'media-viewer-btn media-viewer-next');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next photo');
    next.appendChild(ListTools.icon('next'));
    [pic, close, prev, next, cap].forEach(function (e) { overlay.appendChild(e); });

    function show() {
      pic.src = list[i].url;
      cap.textContent = titleOf(list[i]) + (list.length > 1 ? '  ·  ' + (i + 1) + ' of ' + list.length : '');
      prev.hidden = i <= 0;
      next.hidden = i >= list.length - 1;
    }
    function go(d) { var n = i + d; if (n >= 0 && n < list.length) { i = n; show(); } }
    function done() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      if (onClose) onClose(list[i]);
    }
    function onKey(e) {
      if (e.key === 'Escape') done();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    }
    close.addEventListener('click', done);
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    swipe(overlay, go);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    show();
  }

  var order = []; // ids of the files in the list as last shown — what swiping moves through

  function imagesInOrder() {
    var ids = order.length ? order : MEDIA.map(function (m) { return m.id; });
    return ids.map(getMedia).filter(function (m) { return m && mediaIsImage(m); });
  }

  function renderList(main, navigate) {
    var state = { query: '', types: [] };
    var wrap = el('div', 'list-screen');

    var tools = ListTools.create({
      screen: 'media', placeholder: 'Search files…', ariaLabel: 'Search media', query: state.query,
      add: { label: '+ Add File', onClick: function () { navigate('new'); } },
      onQuery: function (v) { state.query = v; draw(); }, onRedraw: function () { draw(); },
      filters: [{ key: 'types', label: 'Kind of file', options: MEDIA_TYPES.map(function (t) { return [t.type, t.label]; }) }],
      get: function (k) { return state[k]; }, set: function (k, v) { state[k] = v; },
    });
    var count = el('p', 'list-count');
    var rows = el('div', 'list-rows');

    function draw() {
      tools.refresh();
      var words = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var results = MEDIA.filter(function (m) {
        if (state.types.length && state.types.indexOf(m.type) === -1) return false;
        if (!words.length) return true;
        var hay = mediaSearchText(m);
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      order = results.map(function (m) { return m.id; });
      clearEl(count);
      count.appendChild(el('strong', '', String(results.length)));
      count.appendChild(document.createTextNode(results.length === 1 ? ' file' : ' files'));
      clearEl(rows);
      rows.className = tools.view === 'grid' ? 'tile-grid' : 'list-rows';
      if (!results.length) rows.appendChild(el('p', 'list-empty', MEDIA.length ? 'No files match that.' : 'Nothing here yet — add a receipt, waybill or photo to start your library.'));
      results.forEach(function (m) {
        var kind = m.type === 'photo' ? '' : mediaTypeInfo(m.type).one; // no need to say "Photo" on a photo
        if (tools.view === 'grid') {
          var thumb = el('span', 'media-grid-thumb');
          fillThumb(thumb, mediaThumbSpec(m));
          rows.appendChild(tools.card({ thumb: thumb, title: titleOf(m), sub: [kind, dateOf(m)].filter(Boolean).join(' · '), onClick: function () { navigate(m.id); } }));
          return;
        }
        var row = el('button', 'list-row');
        row.type = 'button';
        var avatar = el('span', 'list-row-avatar');
        fillThumb(avatar, mediaThumbSpec(m));
        var info = el('span', 'list-row-info');
        info.appendChild(el('span', 'list-row-title', titleOf(m)));
        var meta = el('span', 'media-meta');
        meta.appendChild(el('span', 'list-row-sub', [kind, linkedNames(m, 2)].filter(Boolean).join(' · ')));
        meta.appendChild(el('span', 'media-date', dateOf(m)));
        info.appendChild(meta);
        row.appendChild(avatar);
        row.appendChild(info);
        row.addEventListener('click', function () { navigate(m.id); });
        rows.appendChild(row);
      });
    }

    draw();
    [tools.bar, tools.chips, count, rows].forEach(function (e) { wrap.appendChild(e); });
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

    // The file itself: a card with a close button, the picture (tap for full screen, swipe for the next one), then the title and details.
    var view = el('div', 'detail-section media-card');
    var closeBtn = el('button', 'media-card-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.appendChild(ListTools.icon('close'));
    closeBtn.addEventListener('click', function () { location.hash = '#/business/media'; });
    view.appendChild(closeBtn);

    var imgs = imagesInOrder();
    var at = imgs.map(function (x) { return x.id; }).indexOf(m.id);
    var open = el('button', 'media-preview');
    open.type = 'button';
    if (mediaIsImage(m)) {
      var img = document.createElement('img');
      img.src = m.url;
      img.alt = titleOf(m);
      open.appendChild(img);
      open.setAttribute('aria-label', 'View full screen');
      open.addEventListener('click', function () {
        viewer(imgs, Math.max(0, at), function (last) { if (last && last.id !== m.id) navigate(last.id); });
      });
    } else {
      open.appendChild(el('span', 'media-pdf', 'PDF · tap to open'));
      open.addEventListener('click', function () { window.open(m.url, '_blank', 'noopener'); });
    }
    view.appendChild(open);
    if (imgs.length > 1 && at !== -1) {
      swipe(view, function (dir) { var n = imgs[at + dir]; if (n) navigate(n.id); });
      view.appendChild(el('p', 'form-note media-swipe-hint', (at + 1) + ' of ' + imgs.length + ' · swipe for the next'));
    }

    var msg = el('div');
    var titleRow = el('div', 'media-title-row');
    function drawTitle() {
      clearEl(titleRow);
      var label = el('button', 'media-title', titleOf(m));
      label.type = 'button';
      label.setAttribute('aria-label', 'Edit title');
      var pen = el('button', 'media-title-icon');
      pen.type = 'button';
      pen.setAttribute('aria-label', 'Edit title');
      pen.appendChild(ListTools.icon('pencil'));
      function edit() {
        clearEl(titleRow);
        var input = el('input', 'form-input media-title-input');
        input.type = 'text';
        input.value = m.title;
        input.placeholder = m.filename || 'Add a title';
        var ok = el('button', 'media-title-icon media-title-save');
        ok.type = 'button';
        ok.setAttribute('aria-label', 'Save title');
        ok.appendChild(ListTools.icon('check'));
        var saving = false;
        function save() {
          if (saving) return;
          saving = true;
          renameMedia(m.id, input.value).then(again).catch(function (err) {
            saving = false;
            clearEl(msg);
            msg.appendChild(el('p', 'form-message error', err.message));
          });
        }
        ok.addEventListener('click', save);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          if (e.key === 'Escape') drawTitle();
        });
        titleRow.appendChild(input);
        titleRow.appendChild(ok);
        input.focus();
        input.select();
      }
      label.addEventListener('click', edit);
      pen.addEventListener('click', edit);
      titleRow.appendChild(label);
      titleRow.appendChild(pen);
    }
    drawTitle();
    view.appendChild(titleRow);

    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Type', mediaTypeInfo(m.type).one));
    facts.appendChild(factRow('Added', dateOf(m)));
    facts.appendChild(factRow('File', m.filename || '—'));
    view.appendChild(facts);
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
    var del = el('button', 'add-record-btn danger-btn', 'Delete this file');
    del.type = 'button';
    del.addEventListener('click', function () {
      var n = m.links.length;
      Modal.confirm({
        title: 'Delete this file?', message: 'Delete this file' + (n ? ' and remove it from ' + n + ' linked record' + (n === 1 ? '' : 's') : '') + '? This can’t be undone.', confirmLabel: 'Delete', danger: true,
        onConfirm: function () {
          deleteMedia(m.id).then(function () { location.hash = '#/business/media'; }).catch(function (err) {
            clearEl(msg);
            msg.appendChild(el('p', 'form-message error', err.message));
          });
        },
      });
    });
    danger.appendChild(del);
    wrap.appendChild(danger);

    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

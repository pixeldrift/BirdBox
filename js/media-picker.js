// "Add photos" popup: take a photo, choose from the device's album, or pick from the BirdBox media
// library (recent items first, with search and filters). Library thumbnails can be multi-selected.
//
//   MediaPicker.open({ type: 'photo', title: 'Add photos', target: { ownerType: 'bird', ownerId }, onDone: function () {} })
const MediaPicker = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var RECENT = 6;

  function open(opts) {
    var type = opts.type || 'photo';
    var target = opts.target;
    var info = mediaTypeInfo(type);

    Modal.open({
      title: opts.title || 'Add ' + info.label.toLowerCase(),
      onClose: function () {},
      build: function (body, close) {
        var message = el('div');
        var chosen = {};     // media id -> true
        var state = { query: '', filter: 'recent', limit: RECENT };

        // 1. Take a new one, or choose from the device.
        function deviceButton(label, capture) {
          var btn = el('label', 'media-source');
          var ic = el('span', 'media-source-icon');
          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('class', 'media-source-svg');
          svg.setAttribute('aria-hidden', 'true');
          // a plain line camera, and an upload arrow into a tray
          var d = capture ? 'M4 8h3l1.5-2h7L17 8h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z' : 'M12 16V4M7 9l5-5 5 5M4 15v5h16v-5';
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          svg.appendChild(path);
          ic.appendChild(svg);
          btn.appendChild(ic);
          btn.appendChild(el('span', '', label));
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = info.accept;
          if (capture) input.setAttribute('capture', 'environment'); else input.multiple = true;
          input.hidden = true;
          input.addEventListener('change', function () {
            var files = Array.prototype.slice.call(input.files);
            if (!files.length) return;
            clearEl(message);
            message.appendChild(el('p', 'form-note', 'Uploading ' + files.length + (files.length === 1 ? ' file…' : ' files…')));
            files.reduce(function (chain, f) {
              return chain.then(function () { return uploadMedia(f, type, [{ targetType: target.ownerType, targetId: target.ownerId }]); });
            }, Promise.resolve()).then(function () { close(); if (opts.onDone) opts.onDone(); }).catch(function (err) {
              clearEl(message);
              message.appendChild(el('p', 'form-message error', err.message || 'Upload failed'));
            });
          });
          btn.appendChild(input);
          return btn;
        }
        var sources = el('div', 'media-sources');
        if (type === 'photo') sources.appendChild(deviceButton('Take a photo', true));
        sources.appendChild(deviceButton(type === 'photo' ? 'Choose from your album' : 'Choose a file', false));
        body.appendChild(sources);
        body.appendChild(message);

        // 2. The library.
        body.appendChild(el('h3', 'media-lib-title', 'From your BirdBox library'));
        var search = el('input', 'search-input');
        search.type = 'search';
        search.placeholder = 'Search by name, bird, client…';
        var chips = el('div', 'filter-chips');
        var grid = el('div', 'media-grid');
        var more = el('button', 'pick-link', 'Show more');
        more.type = 'button';
        var foot = el('div', 'modal-foot');
        var addBtn = el('button', 'save-btn', '');
        addBtn.type = 'button';
        foot.appendChild(addBtn);
        [search, chips, grid, more, foot].forEach(function (e) { body.appendChild(e); });

        function candidates() {
          var words = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
          return MEDIA.filter(function (m) {
            if (m.type !== type || mediaLinkedTo(m, target.ownerType, target.ownerId)) return false;
            if (state.filter === 'unlinked' && m.links.length) return false;
            if (!words.length) return true;
            var hay = mediaSearchText(m);
            return words.every(function (w) { return hay.indexOf(w) !== -1; });
          });
        }

        function drawFoot() {
          var n = Object.keys(chosen).length;
          foot.hidden = !n;
          addBtn.textContent = 'Add ' + n + (n === 1 ? ' ' + info.one.toLowerCase() : ' ' + info.label.toLowerCase());
        }

        function draw() {
          clearEl(chips);
          [['recent', 'Recent'], ['unlinked', 'Not used yet']].forEach(function (f) {
            var chip = el('button', 'filter-chip' + (state.filter === f[0] ? ' active' : ''), f[1]);
            chip.type = 'button';
            chip.addEventListener('click', function () { state.filter = f[0]; state.limit = RECENT; draw(); });
            chips.appendChild(chip);
          });
          var all = candidates();
          // Without a search, show just the few most recent for quick access.
          var limit = state.query.trim() ? Math.max(state.limit, 12) : state.limit;
          var shown = all.slice(0, limit);
          clearEl(grid);
          if (!shown.length) grid.appendChild(el('p', 'pick-empty', MEDIA.some(function (m) { return m.type === type; }) ? 'Nothing else matches.' : 'The library has nothing of this kind yet — take or choose one above.'));
          shown.forEach(function (m) {
            var tile = el('button', 'media-tile' + (chosen[m.id] ? ' selected' : ''));
            tile.type = 'button';
            var spec = mediaThumbSpec(m);
            fillThumb(tile, spec);
            tile.title = m.title || m.filename || '';
            tile.appendChild(el('span', 'media-check', '✓'));
            tile.addEventListener('click', function () {
              if (chosen[m.id]) delete chosen[m.id]; else chosen[m.id] = true;
              tile.classList.toggle('selected', !!chosen[m.id]);
              drawFoot();
            });
            grid.appendChild(tile);
          });
          more.hidden = all.length <= shown.length;
          drawFoot();
        }

        search.addEventListener('input', function () { state.query = search.value; state.limit = RECENT; draw(); });
        more.addEventListener('click', function () { state.limit += 12; draw(); });
        addBtn.addEventListener('click', function () {
          var ids = Object.keys(chosen);
          addBtn.disabled = true;
          addBtn.textContent = 'Adding…';
          ids.reduce(function (chain, id) {
            return chain.then(function () { return linkMedia(id, target.ownerType, target.ownerId); });
          }, Promise.resolve()).then(function () { close(); if (opts.onDone) opts.onDone(); }).catch(function (err) {
            addBtn.disabled = false;
            clearEl(message);
            message.appendChild(el('p', 'form-message error', err.message || 'Could not add those'));
            drawFoot();
          });
        });
        draw();
      },
    });
  }

  return { open: open };
})();

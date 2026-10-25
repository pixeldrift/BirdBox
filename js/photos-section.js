// The Photos box on a record's page: a grid of its pictures. Tap a photo to see it full size. "Edit" is where you add
// photos (+), drag them into a new order, and take them off (the ⊗ on each). The FIRST photo is the record's picture
// everywhere, so there is no separate "main photo" setting. Taking a photo off only unlinks it — it stays in the Media
// library — with a separate choice to delete it for good. The same box is used for birds, places, the aviary, supplies,
// contacts and shipments, so photos behave the same everywhere.
//
//   PhotosSection.render({ ownerType, ownerId, name, photos: [{ id, url, isPrimary }], refresh,
//                          fixed: [url], fixedMain: url, onFixedMain: function (url) → promise, onMediaMain: function () → promise })
// `fixed` are photos that came with the app rather than being uploaded (supplies). They sit in the same order; when one
// is dragged to the front onFixedMain(url) runs, and when an uploaded photo is, onMediaMain() runs so only one leads.
const PhotosSection = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var ICON = {
    x: 'M7 7l10 10M17 7L7 17',
  };
  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'photo-act-icon');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICON[name]);
    s.appendChild(p);
    return s;
  }

  // Tapping a photo shows it full size.
  function viewer(url, title) {
    Modal.open({
      title: title || 'Photo',
      build: function (body, close) {
        var big = el('img', 'photo-big');
        big.src = url;
        big.alt = '';
        body.appendChild(big);
      },
    });
  }

  // Taking a photo or file off a record. The usual choice just unlinks it — it stays in the Media library — and
  // deleting it for good is a separate, clearly worded button.
  //   confirmRemove({ mediaId, ownerType, ownerId, name, noun: 'photo' | 'file', onDone })
  function confirmRemove(o) {
    var noun = o.noun || 'photo';
    var m = typeof getMedia === 'function' ? getMedia(o.mediaId) : null;
    var others = m ? m.links.filter(function (l) { return !(l.targetType === o.ownerType && l.targetId === o.ownerId); }).length : 0;
    Modal.open({
      title: 'Remove ' + noun + ' from ' + (o.name || 'this record') + '?',
      build: function (body, close) {
        body.appendChild(el('p', 'confirm-text', 'Take this ' + noun + ' off ' + (o.name || 'this record') + '? It stays in the Media library' + (others ? ' and on the ' + others + ' other record' + (others === 1 ? '' : 's') + ' it’s linked to' : '') + '.'));
        var unlink = el('button', 'save-btn', 'Remove from ' + (o.name || 'this record'));
        unlink.type = 'button';
        unlink.addEventListener('click', function () { close(); unlinkMedia(o.mediaId, o.ownerType, o.ownerId).then(o.onDone).catch(failed); });
        var del = el('button', 'add-record-btn danger-btn', 'Delete the ' + noun + ' completely');
        del.type = 'button';
        del.addEventListener('click', function () {
          close();
          Modal.confirm({
            title: 'Delete for good?', confirmLabel: 'Delete completely', danger: true,
            message: 'Delete this ' + noun + ' from the Media library' + (others ? ', and take it off the ' + others + ' other record' + (others === 1 ? '' : 's') + ' that use it' : '') + '? This can’t be undone.',
            onConfirm: function () { deleteMedia(o.mediaId).then(o.onDone).catch(failed); },
          });
        });
        var cancel = el('button', 'add-record-btn', 'Cancel');
        cancel.type = 'button';
        cancel.addEventListener('click', close);
        [unlink, del, cancel].forEach(function (e) { body.appendChild(e); });
      },
    });
  }

  function actBtn(cls, name, label, onClick) {
    var b = el('span', 'photo-act ' + cls);
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', label);
    b.title = label;
    b.appendChild(icon(name));
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return b;
  }

  function failed(err) { Modal.alert((err && err.message) || 'That didn’t save — try again.', 'Couldn’t save that'); }

  var editing = {}; // which photo boxes are in edit mode, kept across redraws

  // Drag a tile to a new place in the grid (pointer events, so it works with a finger too).
  function makeDraggable(grid, onOrder) {
    var drag = null;
    function tiles() { return Array.prototype.slice.call(grid.querySelectorAll('.photo-tile')); }
    grid.addEventListener('pointerdown', function (e) {
      var tile = e.target.closest('.photo-tile');
      if (!tile || e.target.closest('.photo-act')) return;
      drag = { tile: tile, x: e.clientX, y: e.clientY, active: false, id: e.pointerId };
    });
    grid.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) + Math.abs(dy) < 8) return;
        drag.active = true;
        drag.tile.classList.add('dragging');
        try { grid.setPointerCapture(e.pointerId); } catch (err) { /* fine without */ }
      }
      drag.tile.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var over = tiles().filter(function (t) {
        if (t === drag.tile) return false;
        var r = t.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      })[0];
      if (over) {
        var list = tiles();
        var from = list.indexOf(drag.tile), to = list.indexOf(over);
        var anchorBefore = from < to ? over.nextSibling : over;
        grid.insertBefore(drag.tile, anchorBefore);
        drag.x = e.clientX; drag.y = e.clientY; // the tile now sits where it was dropped; restart the offset from here
        drag.tile.style.transform = '';
      }
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var was = drag;
      drag = null;
      was.tile.classList.remove('dragging');
      was.tile.style.transform = '';
      if (was.active) {
        was.tile.dataset.justDragged = '1';
        setTimeout(function () { delete was.tile.dataset.justDragged; }, 50);
        onOrder(tiles());
      }
    }
    grid.addEventListener('pointerup', end);
    grid.addEventListener('pointercancel', end);
  }

  function render(o) {
    var key = o.ownerType + ':' + o.ownerId;
    var section = el('div', 'detail-section');
    var head = el('div', 'photo-head');
    head.appendChild(el('h3', '', o.title || 'Photos'));
    var uploads = o.photos.slice();
    var fixed = (o.fixed || []).slice();
    var total = fixed.length + uploads.length;
    var isEditing = !!editing[key];
    var toggle = el('button', 'pick-link photo-edit', isEditing ? 'Done' : 'Edit');
    toggle.type = 'button';
    toggle.addEventListener('click', function () { editing[key] = !editing[key]; o.refresh(); });
    head.appendChild(toggle);
    section.appendChild(head);

    // One list, in order: whichever comes first is the picture used everywhere.
    var hasPrimaryUpload = uploads.some(function (p) { return p.isPrimary; });
    var mainFixed = o.fixedMain && fixed.indexOf(o.fixedMain) >= 0 ? o.fixedMain : (!hasPrimaryUpload ? fixed[0] : '');
    var items = [];
    if (mainFixed) items.push({ fixed: true, url: mainFixed });
    {
      // the rest of the app's own pictures sit after the uploads that lead, or right after the main one
      var otherFixed = fixed.filter(function (u) { return u !== mainFixed; }).map(function (u) { return { fixed: true, url: u }; });
      var ups = uploads.map(function (p) { return { id: p.id, url: p.url }; });
      items = items.concat(mainFixed ? otherFixed.concat(ups) : ups.concat(otherFixed));
    }

    var grid = el('div', 'photo-grid' + (isEditing ? ' editing' : ''));
    items.forEach(function (item, i) {
      var tile = el('div', 'photo-tile' + (i === 0 ? ' primary' : ''));
      tile.dataset.key = item.fixed ? 'f:' + item.url : 'm:' + item.id;
      var img = el('img');
      img.src = item.url;
      img.alt = '';
      img.draggable = false;
      tile.appendChild(img);
      if (i === 0 && total > 1) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      if (isEditing && !item.fixed) {
        tile.appendChild(actBtn('photo-act-del', 'x', 'Remove photo', function () {
          confirmRemove({ mediaId: item.id, ownerType: o.ownerType, ownerId: o.ownerId, name: o.name, noun: 'photo', onDone: o.refresh });
        }));
      }
      tile.addEventListener('click', function () {
        if (tile.dataset.justDragged) return;
        viewer(item.url, o.name);
      });
      grid.appendChild(tile);
    });
    if (isEditing) {
      var add = el('button', 'photo-add-tile', '+');
      add.type = 'button';
      add.setAttribute('aria-label', 'Add photos');
      add.addEventListener('click', function () {
        MediaPicker.open({ type: 'photo', title: 'Add photos', target: { ownerType: o.ownerType, ownerId: o.ownerId }, onDone: o.refresh });
      });
      grid.appendChild(add);
      if (total > 1) makeDraggable(grid, function (tileEls) {
        var keys = tileEls.map(function (t) { return t.dataset.key; });
        var ids = keys.filter(function (k) { return k.charAt(0) === 'm'; }).map(function (k) { return k.slice(2); });
        var firstFixed = keys[0].charAt(0) === 'f' ? keys[0].slice(2) : '';
        var changed = keys.join('|') !== items.map(function (it) { return it.fixed ? 'f:' + it.url : 'm:' + it.id; }).join('|');
        if (!changed) return;
        var steps = Promise.resolve();
        if (ids.length) steps = steps.then(function () { return reorderPhotos(o.ownerType, o.ownerId, ids); });
        if (firstFixed && o.onFixedMain && firstFixed !== mainFixed) steps = steps.then(function () { return o.onFixedMain(firstFixed); });
        else if (!firstFixed && o.onMediaMain) steps = steps.then(function () { return o.onMediaMain(); });
        steps.then(o.refresh).catch(failed);
      });
    }
    section.appendChild(grid);
    if (!total && !isEditing) section.appendChild(el('p', 'form-note', 'No photos yet — tap Edit to add some.'));
    if (isEditing && total > 1) section.appendChild(el('p', 'form-note', 'Drag to reorder — the first photo is the main one.'));
    return section;
  }

  return { render: render, confirmRemove: confirmRemove };
})();

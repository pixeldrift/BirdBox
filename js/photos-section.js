// The Photos box on a record's page: a grid of its pictures. Tap a photo to see it full size. "Edit" turns on a ✓ (make it
// the MAIN picture — the record's thumbnail everywhere) and a bin (take it off, with a separate choice to delete it for
// good) on each photo; "+" adds more. The same box is used for birds, places, the aviary, supplies, contacts and
// shipments, so photos behave the same everywhere.
//
//   PhotosSection.render({ ownerType, ownerId, name, photos: [{ id, url, isPrimary }], refresh,
//                          fixed: [url], fixedMain: url, onFixedMain: function (url) → promise, onMediaMain: function () → promise })
// `fixed` are photos that came with the app rather than being uploaded (supplies); they can be chosen as the main picture
// too (onFixedMain), and choosing an uploaded photo afterwards calls onMediaMain so only one is main.
const PhotosSection = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var ICON = {
    check: 'M5 12.5l4.5 4.5L19 7.5',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
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

  // Tapping a photo shows it full size (with a way to make it the main one from there).
  function viewer(url, title, onMain) {
    Modal.open({
      title: title || 'Photo',
      build: function (body, close) {
        var big = el('img', 'photo-big');
        big.src = url;
        big.alt = '';
        body.appendChild(big);
        if (onMain) {
          var b = el('button', 'save-btn photo-main-btn', 'Make this the main photo');
          b.type = 'button';
          b.addEventListener('click', function () { close(); onMain(); });
          body.appendChild(b);
        }
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
      title: 'Remove ' + noun + '?',
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

  function render(o) {
    var key = o.ownerType + ':' + o.ownerId;
    var section = el('div', 'detail-section');
    var head = el('div', 'photo-head');
    head.appendChild(el('h3', '', o.title || 'Photos'));
    var total = (o.fixed || []).length + o.photos.length;
    if (total) {
      var toggle = el('button', 'pick-link photo-edit', editing[key] ? 'Done' : 'Edit');
      toggle.type = 'button';
      toggle.addEventListener('click', function () { editing[key] = !editing[key]; o.refresh(); });
      head.appendChild(toggle);
    }
    section.appendChild(head);
    var isEditing = !!editing[key] && total > 0;
    var grid = el('div', 'photo-grid' + (isEditing ? ' editing' : ''));
    var fixedMain = o.fixedMain || '';
    var hasPrimaryUpload = o.photos.some(function (p) { return p.isPrimary; });

    (o.fixed || []).forEach(function (url) {
      var isMain = fixedMain ? url === fixedMain : !hasPrimaryUpload && url === o.fixed[0];
      var makeMain = o.onFixedMain && !isMain ? function () { o.onFixedMain(url).then(o.refresh).catch(failed); } : null;
      var tile = el('button', 'photo-tile' + (isMain ? ' primary' : ''));
      tile.type = 'button';
      var img = el('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      tile.appendChild(img);
      if (isMain) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      if (isEditing && makeMain) tile.appendChild(actBtn('photo-act-main', 'check', 'Make main photo', makeMain));
      tile.addEventListener('click', function () { viewer(url, o.name, makeMain); });
      grid.appendChild(tile);
    });

    o.photos.forEach(function (photo) {
      var isMain = photo.isPrimary && !fixedMain && !((o.fixed || []).length && !hasPrimaryUpload);
      var makeMain = isMain ? null : function () {
        setMainPhotoFor(o.ownerType, o.ownerId, photo.id).then(function () { return o.onMediaMain ? o.onMediaMain() : null; }).then(o.refresh).catch(failed);
      };
      var tile = el('button', 'photo-tile' + (isMain ? ' primary' : ''));
      tile.type = 'button';
      var img = el('img');
      img.src = photo.url;
      img.alt = '';
      tile.appendChild(img);
      if (isMain) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      if (isEditing) {
        if (makeMain) tile.appendChild(actBtn('photo-act-main', 'check', 'Make main photo', makeMain));
        tile.appendChild(actBtn('photo-act-del', 'trash', 'Remove photo', function () {
          confirmRemove({ mediaId: photo.id, ownerType: o.ownerType, ownerId: o.ownerId, name: o.name, noun: 'photo', onDone: o.refresh });
        }));
      }
      tile.addEventListener('click', function () { viewer(photo.url, o.name, makeMain); });
      grid.appendChild(tile);
    });
    var add = el('button', 'photo-add-tile', '+');
    add.type = 'button';
    add.setAttribute('aria-label', 'Add photos');
    add.addEventListener('click', function () {
      MediaPicker.open({ type: 'photo', title: 'Add photos', target: { ownerType: o.ownerType, ownerId: o.ownerId }, onDone: o.refresh });
    });
    grid.appendChild(add);
    section.appendChild(grid);
    if (isEditing && total > 1) section.appendChild(el('p', 'form-note', 'Tap ✓ to make a photo the main picture, or the bin to take it off.'));
    return section;
  }

  return { render: render, confirmRemove: confirmRemove };
})();

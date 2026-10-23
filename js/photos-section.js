// The Photos box on a record's page: a grid of its pictures. Tap a photo to make it the MAIN picture (the one used as
// the record's thumbnail everywhere), ⤢ to view it full size, ✕ to take it off, and "+" to add more. The same box is
// used for birds, places, the aviary, supplies, contacts and shipments, so photos behave the same everywhere.
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

  function viewer(url, title) {
    Modal.open({ title: title || 'Photo', build: function (body) { var big = el('img', 'photo-big'); big.src = url; big.alt = ''; body.appendChild(big); } });
  }

  function zoomButton(url, title) {
    var z = el('span', 'photo-zoom', '⤢');
    z.setAttribute('role', 'button');
    z.setAttribute('aria-label', 'View full size');
    z.addEventListener('click', function (e) { e.stopPropagation(); viewer(url, title); });
    return z;
  }

  function render(o) {
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', o.title || 'Photos'));
    var grid = el('div', 'photo-grid');
    var fixedMain = o.fixedMain || '';
    var total = (o.fixed || []).length + o.photos.length;

    (o.fixed || []).forEach(function (url) {
      var isMain = fixedMain ? url === fixedMain : !o.photos.some(function (p) { return p.isPrimary; }) && url === o.fixed[0];
      var tile = el('button', 'photo-tile' + (isMain ? ' primary' : ''));
      tile.type = 'button';
      var img = el('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      tile.appendChild(img);
      if (isMain) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      tile.appendChild(zoomButton(url, o.name));
      tile.addEventListener('click', function () {
        if (isMain || !o.onFixedMain) return;
        o.onFixedMain(url).then(o.refresh).catch(function () {});
      });
      grid.appendChild(tile);
    });

    o.photos.forEach(function (photo) {
      var isMain = photo.isPrimary && !fixedMain && !((o.fixed || []).length && !o.photos.some(function (p) { return p.isPrimary; }));
      var tile = el('button', 'photo-tile' + (isMain ? ' primary' : ''));
      tile.type = 'button';
      var img = el('img');
      img.src = photo.url;
      img.alt = '';
      tile.appendChild(img);
      if (isMain) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      tile.appendChild(zoomButton(photo.url, o.name));
      tile.addEventListener('click', function () {
        if (isMain) return;
        setMainPhotoFor(o.ownerType, o.ownerId, photo.id).then(function () { return o.onMediaMain ? o.onMediaMain() : null; }).then(o.refresh).catch(function () {});
      });
      var del = el('span', 'file-remove', '✕');
      del.setAttribute('role', 'button');
      del.setAttribute('aria-label', 'Remove photo');
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        Modal.confirm({
          title: 'Remove photo?', message: 'Remove this photo from ' + (o.name || 'this record') + '? It stays in the Media library.', confirmLabel: 'Remove',
          onConfirm: function () { unlinkMedia(photo.id, o.ownerType, o.ownerId).then(o.refresh).catch(function () {}); },
        });
      });
      tile.appendChild(del);
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
    if (total > 1) section.appendChild(el('p', 'form-note', 'Tap a photo to make it the main picture.'));
    return section;
  }

  return { render: render };
})();

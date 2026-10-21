// The Photos box on a record's page: a grid of its pictures (tap one to make it the main picture,
// ✕ to take it off), plus a "+" to add more. Works for birds, places, the aviary — anything photos
// can be linked to (see js/data/files.js).
//   PhotosSection.render({ ownerType, ownerId, name, photos: [{ id, url, isPrimary }], refresh })
const PhotosSection = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function render(o) {
    var section = el('div', 'detail-section');
    section.appendChild(el('h3', '', o.title || 'Photos'));
    var grid = el('div', 'photo-grid');
    o.photos.forEach(function (photo) {
      var tile = el('button', 'photo-tile' + (photo.isPrimary ? ' primary' : ''));
      tile.type = 'button';
      var img = el('img');
      img.src = photo.url;
      img.alt = '';
      tile.appendChild(img);
      if (photo.isPrimary) tile.appendChild(el('span', 'photo-primary-badge', 'Main'));
      tile.addEventListener('click', function () {
        if (photo.isPrimary) return;
        setMainPhotoFor(o.ownerType, o.ownerId, photo.id).then(o.refresh).catch(function () {});
      });
      var del = el('span', 'file-remove', '✕');
      del.setAttribute('role', 'button');
      del.setAttribute('aria-label', 'Remove photo');
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!window.confirm('Remove this photo from ' + (o.name || 'this record') + '? It stays in the Media library.')) return;
        unlinkMedia(photo.id, o.ownerType, o.ownerId).then(o.refresh).catch(function () {});
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
    if (o.photos.length > 1) section.appendChild(el('p', 'form-note', 'Tap a photo to make it the main picture.'));
    return section;
  }

  return { render: render };
})();

// A reusable "files on this record" section: thumbnails for pictures, links for PDFs, a ✕ to
// remove, and an add button per kind. Used by shipments, health records and accounting entries.
//
//   FilesUI.render({
//     ownerType, ownerId,
//     title,                         // optional heading above everything
//     items: function () { return [{ id, kind, filename, url, contentType, size }]; },
//     kinds: [{ kind, title, addLabel, accept, grid, empty }],
//     refresh: function () {}        // redraw the screen after a change
//   })
const FilesUI = (function () {
  // An upload problem to show after the screen redraws.
  var pendingError = '';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function sizeLabel(bytes) {
    if (!bytes) return '';
    return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function render(opts) {
    var section = el('div', 'detail-section');
    var message = el('div');
    if (opts.title) section.appendChild(el('h3', '', opts.title));

    function fail(text) {
      clearEl(message);
      message.appendChild(el('p', 'form-message error', text));
    }

    function removeButton(file) {
      var x = el('button', 'file-remove', '✕');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remove ' + (file.filename || 'file'));
      x.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!window.confirm('Remove this file?')) return;
        removeFile(file.id).then(opts.refresh).catch(function (err) { fail(err.message); });
      });
      return x;
    }

    function addButton(k) {
      var btn = el('label', 'add-record-btn photo-upload-btn', k.addLabel);
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = k.accept;
      input.multiple = true;
      input.hidden = true;
      input.addEventListener('change', function () {
        var files = Array.prototype.slice.call(input.files);
        if (!files.length) return;
        btn.firstChild.textContent = 'Uploading…';
        files.reduce(function (chain, f) {
          return chain.then(function () { return uploadFile(opts.ownerType, opts.ownerId, k.kind, f); });
        }, Promise.resolve()).then(opts.refresh).catch(function (err) {
          pendingError = err.message || 'Upload failed';
          opts.refresh();
        });
      });
      btn.appendChild(input);
      return btn;
    }

    var all = opts.items();
    opts.kinds.forEach(function (k) {
      var items = all.filter(function (f) { return f.kind === k.kind; });
      if (k.title) section.appendChild(el('h3', '', k.title));
      if (k.grid) {
        if (items.length) {
          var grid = el('div', 'photo-grid');
          items.forEach(function (f) {
            var tile = el('div', 'photo-tile');
            var a = el('a');
            a.href = f.url;
            a.target = '_blank';
            a.rel = 'noopener';
            if (/^image\//.test(f.contentType)) {
              var img = document.createElement('img');
              img.src = f.url;
              img.alt = f.filename || 'Photo';
              a.appendChild(img);
            } else {
              a.appendChild(el('span', 'attachment-file-icon', 'PDF'));
            }
            tile.appendChild(a);
            tile.appendChild(removeButton(f));
            grid.appendChild(tile);
          });
          section.appendChild(grid);
        } else if (k.empty) {
          section.appendChild(el('p', 'form-note', k.empty));
        }
      } else {
        items.forEach(function (f) {
          var row = el('div', 'file-row');
          var link = el('a', '', (f.filename || k.title || 'File') + (f.size ? ' · ' + sizeLabel(f.size) : ''));
          link.href = f.url;
          link.target = '_blank';
          link.rel = 'noopener';
          row.appendChild(link);
          row.appendChild(removeButton(f));
          section.appendChild(row);
        });
        if (!items.length && k.empty) section.appendChild(el('p', 'form-note', k.empty));
      }
      section.appendChild(addButton(k));
    });

    section.appendChild(message);
    if (pendingError) { fail(pendingError); pendingError = ''; }
    return section;
  }

  return { render: render };
})();

// Drag-and-drop editor for the menus. First level = the home screen grid (the tiles); second level =
// the tabs inside each tile. Drag a tile to reorder the grid; drag a tab to reorder it, or drop it
// into another tile to move it to that section. ✓/Hide switches an item off without deleting it.
// Saved to the navigation table (js/data/navigation.js). Works with touch (pointer events).
const NavEditor = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Builds the editor into `container`. onChange() runs after anything is saved.
  function build(container, onChange) {
    clearEl(container);
    var message = el('div');
    var root = el('div', 'ne-groups');
    container.appendChild(el('p', 'form-note', 'Drag ≡ to reorder; tap the eye to hide or show. Drag a tab into another section to move it there. First level = the home screen; second level = the tabs inside it.'));
    container.appendChild(message);
    container.appendChild(root);

    function fail(err) {
      clearEl(message);
      message.appendChild(el('p', 'form-message error', (err && err.message) || 'That didn’t save — try again.'));
    }

    function save(changes) {
      if (!changes.length) return Promise.resolve();
      if (!NAV_ROWS.length) { fail(new Error('Run sql/017_navigation.sql in Neon first, then you can customize.')); return Promise.resolve(); }
      return saveNavigation(changes).then(function () { clearEl(message); if (onChange) onChange(); }).catch(fail);
    }

    // Visibility as an eye (slashed when hidden); same look for tiles and tabs.
    function eyeButton(hidden, onClick) {
      var b = el('button', 'ne-eye' + (hidden ? ' off' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', hidden ? 'Show' : 'Hide');
      b.title = hidden ? 'Hidden — tap to show' : 'Showing — tap to hide';
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('class', 'ne-eye-icon');
      [['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'], ['circle']].forEach(function (p) {
        var node = p[0] === 'circle' ? document.createElementNS(ns, 'circle') : document.createElementNS(ns, 'path');
        if (p[0] === 'circle') { node.setAttribute('cx', '12'); node.setAttribute('cy', '12'); node.setAttribute('r', '3'); } else node.setAttribute('d', p[0]);
        svg.appendChild(node);
      });
      if (hidden) { var slash = document.createElementNS(ns, 'path'); slash.setAttribute('d', 'M4 20L20 4'); svg.appendChild(slash); }
      b.appendChild(svg);
      b.addEventListener('click', onClick);
      return b;
    }

    function handle() {
      var h = el('span', 'ne-handle', '≡');
      h.setAttribute('aria-hidden', 'true');
      return h;
    }

    function draw() {
      clearEl(root);
      NAV.forEach(function (g) {
        var isAccount = g.id === 'account';
        var group = el('div', 'ne-group');
        group.dataset.id = g.id;
        var head = el('div', 'ne-row ne-head');
        head.appendChild(el('strong', 'ne-label', isAccount ? g.label + ' (the avatar menu)' : g.label));
        if (!isAccount) {
          head.appendChild(eyeButton(g.homeTile === false, function () { save([{ id: g.id, visible: g.homeTile === false, homeTile: true }]).then(draw); }));
          head.appendChild(handle());
        }
        group.appendChild(head);
        var tabs = el('div', 'ne-tabs');
        tabs.dataset.parent = g.id;
        g.screens.forEach(function (s) {
          var tab = el('div', 'ne-row ne-tab' + (s.hidden ? ' off' : ''));
          tab.dataset.key = s.key;
          tab.appendChild(el('span', 'ne-label', s.label));
          tab.appendChild(eyeButton(!!s.hidden, function () { save([{ id: s.key, visible: !!s.hidden }]).then(draw); }));
          tab.appendChild(handle());
          tabs.appendChild(tab);
        });
        group.appendChild(tabs);
        root.appendChild(group);
      });
    }

    // What the screen now looks like, as the rows that differ from what's saved.
    function readOrder() {
      var changes = [];
      Array.prototype.forEach.call(root.querySelectorAll('.ne-group'), function (groupEl, gi) {
        var id = groupEl.dataset.id;
        var row = navRow(id);
        var sort = (gi + 1) * 10;
        if (id !== 'account' && (!row || row.sort !== sort)) changes.push({ id: id, sort: sort });
        Array.prototype.forEach.call(groupEl.querySelectorAll('.ne-tab'), function (tabEl, ti) {
          var key = tabEl.dataset.key;
          var srow = navRow(key);
          var tsort = (ti + 1) * 10;
          if (!srow || srow.sort !== tsort || srow.parentId !== id) changes.push({ id: key, parentId: id, sort: tsort });
        });
      });
      return changes;
    }

    // ---- drag and drop (pointer events, so it works on touch too) ----
    var drag = null;
    root.addEventListener('pointerdown', function (e) {
      var h = e.target.closest('.ne-handle');
      if (!h) return;
      var item = h.closest('.ne-tab') || h.closest('.ne-group');
      if (!item) return;
      var r = item.getBoundingClientRect();
      var ph = el('div', 'ne-drop');
      ph.style.height = r.height + 'px';
      drag = { item: item, ph: ph, type: item.classList.contains('ne-tab') ? 'tab' : 'group', dx: e.clientX - r.left, dy: e.clientY - r.top };
      item.parentNode.insertBefore(ph, item);
      item.style.width = r.width + 'px';
      item.style.left = r.left + 'px';
      item.style.top = r.top + 'px';
      item.classList.add('dragging');
      document.body.appendChild(item);
      h.setPointerCapture && h.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    function insertAmong(list, selector, item, y) {
      var kids = Array.prototype.filter.call(list.querySelectorAll(':scope > ' + selector), function (k) { return k !== item && k !== drag.ph; });
      var before = null;
      for (var i = 0; i < kids.length; i++) {
        var r = kids[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { before = kids[i]; break; }
      }
      if (drag.type === 'group' && !before) before = root.querySelector('.ne-group[data-id="account"]'); // Account stays last
      if (before === item.nextSibling) return;
      list.insertBefore(item, before);
    }

    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.item.style.left = (e.clientX - drag.dx) + 'px';
      drag.item.style.top = (e.clientY - drag.dy) + 'px';
      // auto-scroll when near the top or bottom of the visible area
      var scroller = container.closest('.modal-body') || document.scrollingElement;
      var box = scroller === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : scroller.getBoundingClientRect();
      if (e.clientY < box.top + 50) scroller.scrollTop -= 14;
      else if (e.clientY > box.bottom - 50) scroller.scrollTop += 14;
      if (drag.type === 'group') {
        insertAmong(root, '.ne-group', drag.ph, e.clientY);
        return;
      }
      var under = document.elementFromPoint(e.clientX, e.clientY);
      var list = under && under.closest && (under.closest('.ne-tabs') || (under.closest('.ne-group') && under.closest('.ne-group').querySelector('.ne-tabs')));
      if (list && root.contains(list)) insertAmong(list, '.ne-tab', drag.ph, e.clientY);
    });

    function end() {
      if (!drag) return;
      var d = drag;
      d.item.classList.remove('dragging');
      d.item.style.width = d.item.style.left = d.item.style.top = '';
      d.ph.parentNode.replaceChild(d.item, d.ph);
      drag = null;
      save(readOrder()).then(draw);
    }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    var reset = el('button', 'add-record-btn danger-btn', 'Reset to the standard layout');
    reset.type = 'button';
    reset.addEventListener('click', function () {
      Modal.confirm({
        title: 'Reset menus?', message: 'Put the home screen and all the tabs back to the standard layout?', confirmLabel: 'Reset',
        onConfirm: function () { resetNavigation().then(function () { if (onChange) onChange(); draw(); }).catch(fail); },
      });
    });
    container.appendChild(reset);
    draw();
  }

  // The editor in a popup, opened from the faded ✎ on the home screen.
  function open(onClose) {
    var changed = false;
    Modal.open({
      title: 'Edit menus',
      onClose: function () { if (changed && onClose) onClose(); else if (onClose) onClose(); },
      build: function (body) { body.classList.add('ne-body'); build(body, function () { changed = true; }); },
    });
  }

  return { build: build, open: open };
})();

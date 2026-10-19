// Account → Customize: reorder and hide the home screen tiles, and the tabs inside each section.
// What you set here is stored in the navigation table (sql/017_navigation.sql) and the whole app
// follows it. "Reset" goes back to the built-in layout.
const CustomizeScreen = (function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function iconButton(label, text, disabled, onClick) {
    var b = el('button', 'nav-move', text);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderList(main) {
    clearEl(main);
    var wrap = el('div', 'detail-screen');
    var intro = el('div', 'detail-section');
    intro.appendChild(el('h3', '', 'Make BirdBox yours'));
    intro.appendChild(el('p', 'notes-text', 'Move things up or down and switch off what you don’t use. Your home screen and every section’s tabs follow this list. Nothing is deleted — you can bring anything back.'));
    var message = el('div');
    intro.appendChild(message);
    wrap.appendChild(intro);

    function fail(err) {
      clearEl(message);
      message.appendChild(el('p', 'form-message error', (err && err.message) || 'That didn’t save — try again.'));
    }

    // Swap an item with its neighbour: both get each other's sort number.
    function move(list, i, dir, idOf) {
      var a = list[i], b = list[i + dir];
      var sa = navRow(idOf(a)), sb = navRow(idOf(b));
      if (!sa || !sb) { fail(new Error('Run sql/017_navigation.sql first, then customize.')); return; }
      saveNavigation([{ id: idOf(a), sort: sb.sort }, { id: idOf(b), sort: sa.sort }]).then(function () { renderList(main); }).catch(fail);
    }

    function toggleRow(label, on, onChange) {
      var t = makeToggle(on, label, onChange);
      return t;
    }

    var groups = NAV.filter(function (g) { return g.id !== 'account'; });
    groups.forEach(function (g, gi) {
      var card = el('div', 'detail-section');
      var head = el('div', 'nav-head');
      head.appendChild(el('h3', '', g.label));
      var arrows = el('div', 'nav-arrows');
      arrows.appendChild(iconButton('Move ' + g.label + ' up', '↑', gi === 0, function () { move(groups, gi, -1, function (x) { return x.id; }); }));
      arrows.appendChild(iconButton('Move ' + g.label + ' down', '↓', gi === groups.length - 1, function () { move(groups, gi, 1, function (x) { return x.id; }); }));
      head.appendChild(arrows);
      card.appendChild(head);
      var row = navRow(g.id);
      card.appendChild(toggleRow('Show on the home screen', g.homeTile !== false, function (on) {
        saveNavigation([{ id: g.id, visible: on, homeTile: true }]).catch(fail);
      }));
      card.appendChild(el('p', 'subsection-label', 'Tabs'));
      g.screens.forEach(function (s, si) {
        var line = el('div', 'nav-line');
        var name = el('span', 'nav-name' + (s.hidden ? ' off' : ''), s.label);
        line.appendChild(name);
        var ctrl = el('div', 'nav-arrows');
        ctrl.appendChild(iconButton('Move ' + s.label + ' up', '↑', si === 0, function () { move(g.screens, si, -1, function (x) { return g.id + '/' + x.id; }); }));
        ctrl.appendChild(iconButton('Move ' + s.label + ' down', '↓', si === g.screens.length - 1, function () { move(g.screens, si, 1, function (x) { return g.id + '/' + x.id; }); }));
        var eye = el('button', 'nav-move', s.hidden ? 'Show' : 'Hide');
        eye.type = 'button';
        eye.addEventListener('click', function () {
          saveNavigation([{ id: g.id + '/' + s.id, visible: !!s.hidden }]).then(function () { renderList(main); }).catch(fail);
        });
        ctrl.appendChild(eye);
        line.appendChild(ctrl);
        card.appendChild(line);
      });
      wrap.appendChild(card);
    });

    var reset = el('div', 'detail-section');
    var btn = el('button', 'add-record-btn danger-btn', 'Reset to the standard layout');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      if (!window.confirm('Put the home screen and all the tabs back to the standard layout?')) return;
      resetNavigation().then(function () { renderList(main); }).catch(fail);
    });
    reset.appendChild(btn);
    wrap.appendChild(reset);
    main.appendChild(wrap);
  }

  function renderDetail(main) { renderList(main); }

  return { renderList: renderList, renderDetail: renderDetail };
})();

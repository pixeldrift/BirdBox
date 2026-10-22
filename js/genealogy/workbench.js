// The workbench: the birds you're working with, shared by the Genealogy and Genetics tabs so the same
// birds stay selected as you switch between the family tree and the breeding tools. It lives in a drawer
// at the bottom of the screen on a phone (tap the handle: small, tall, hidden) and docks to the side on a
// wide screen.
//
//   Workbench.selected            ids of the birds on the bench (kept while you move between tabs)
//   Workbench.toggle(id) / add(id) / remove(id) / clear()
//   Workbench.drawer(opts) -> element   opts: { onChange, onResize, link: { label, go } }
const Workbench = (function () {
  var selected = [];
  var mode = 'half'; // 'closed' | 'half' | 'full'

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function btn(cls, text, onClick) {
    var b = el('button', cls, text);
    b.type = 'button';
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  // Drop birds that have since been deleted.
  function tidy() { selected = selected.filter(function (id) { return !!getBird(id); }); }

  function add(id) { if (id && selected.indexOf(id) === -1) selected.push(id); }
  function remove(id) { var i = selected.indexOf(id); if (i !== -1) selected.splice(i, 1); }
  function toggle(id) { if (selected.indexOf(id) === -1) selected.push(id); else remove(id); }
  function clear() { selected = []; }
  function only(ids) { selected = ids.slice(); }

  function popup(onPicked) {
    Modal.open({
      title: 'Add a bird',
      build: function (body, close) {
        body.appendChild(Picker.create({
          items: function () { return Picker.listItems('birds'); }, placeholder: 'Search band, name or species…',
          onChange: function (id) { if (!id) return; close(); add(id); onPicked(); },
        }).el);
      },
    });
  }

  function drawer(opts) {
    tidy();
    var root = el('div', 'gen-drawer');

    function setMode(m) {
      mode = m;
      var screen = root.closest('.gen-screen');
      if (screen) screen.className = 'gen-screen drawer-' + m;
      if (opts.onResize) setTimeout(opts.onResize, 260);
    }

    function draw() {
      clearEl(root);
      var handle = btn('gen-handle', '');
      handle.setAttribute('aria-label', 'Show or hide the workbench');
      handle.appendChild(el('span', 'gen-grip'));
      handle.appendChild(el('span', 'gen-summary', 'Workbench' + (selected.length ? ' · ' + selected.length + (selected.length === 1 ? ' bird' : ' birds') : '')));
      handle.addEventListener('click', function () { setMode(mode === 'closed' ? 'half' : mode === 'half' ? 'full' : 'closed'); });
      root.appendChild(handle);

      var body = el('div', 'gen-drawer-body');
      var top = el('div', 'gen-drawer-actions');
      top.appendChild(btn('loc-add gen-add', '+ Add bird', function () { popup(changed); }));
      if (opts.link && selected.length) top.appendChild(btn('loc-details-btn', opts.link.label, opts.link.go));
      if (selected.length) top.appendChild(btn('pick-link', 'Clear', function () { clear(); changed(); }));
      body.appendChild(top);

      if (!selected.length) {
        body.appendChild(el('p', 'form-note', 'Add the birds you want to look at. Tap a bird in the family tree to add it too. They stay here as you switch between Genealogy and Genetics.'));
      }
      selected.forEach(function (id) {
        var bird = getBird(id);
        if (!bird) return;
        var row = el('div', 'relation-row');
        var holder = el('div', 'relation-body');
        holder.appendChild(birdChip(bird, function () { location.hash = '#/mybirds/birds/' + id; }));
        row.appendChild(holder);
        row.appendChild(btn('pick-link relation-remove', 'Remove', function () { remove(id); changed(); }));
        body.appendChild(row);
      });
      root.appendChild(body);
    }

    function changed() { draw(); if (opts.onChange) opts.onChange(); }

    draw();
    return { el: root, refresh: draw, mode: function () { return mode; } };
  }

  return {
    get selected() { return selected; }, tidy: tidy, add: add, remove: remove, toggle: toggle, clear: clear, only: only,
    get mode() { return mode; }, drawer: drawer,
  };
})();

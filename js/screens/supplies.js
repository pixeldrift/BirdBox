// Aviary → Supplies: feed, supplements, cleaning products, medical items and equipment — what you have,
// when to reorder, who sells it, and photos. Care plans (Feed/Water) link to these, so tapping a food shows
// its photos, source and stock. Routes: <id> · new · edit~<id>
const SuppliesScreen = (function () {
  var state = { query: '', category: 'All', lowOnly: false };

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

  function supplySpec(s) {
    var url = supplyThumbUrl(s);
    return url ? { src: url } : { icon: 'icons/tinted/aviary/Supplies.png' };
  }

  function row(s, navigate) {
    var b = el('button', 'list-row');
    b.type = 'button';
    var av = el('span', 'list-row-avatar');
    fillThumb(av, supplySpec(s));
    b.appendChild(av);
    var info = el('span', 'list-row-info');
    info.appendChild(el('span', 'list-row-title', s.name));
    info.appendChild(el('span', 'list-row-sub', [s.category, s.brand].filter(Boolean).join(' · ')));
    b.appendChild(info);
    b.appendChild(el('span', 'type-badge ' + (supplyIsLow(s) ? 'supply-low' : 'type-breeder'), supplyIsLow(s) ? 'Low · ' + supplyAmount(s) : supplyAmount(s)));
    b.addEventListener('click', function () { navigate(s.id); });
    return b;
  }

  function renderList(main, navigate) {
    var wrap = el('div', 'list-screen');
    var actions = el('div', 'list-actions');
    actions.appendChild(btn('add-record-btn', '+ Add supply', function () { navigate('new'); }));
    var search = el('input', 'search-input');
    search.type = 'search';
    search.placeholder = 'Search supplies…';
    search.value = state.query;
    var chips = el('div', 'filter-chips');
    var count = el('p', 'list-count');
    var list = el('div', 'list-rows');

    function draw() {
      clearEl(chips);
      ['All'].concat(SUPPLY_CATEGORIES).forEach(function (c) {
        chips.appendChild(btn('filter-chip' + (state.category === c ? ' active' : ''), c, function () { state.category = c; draw(); }));
      });
      var q = state.query.trim().toLowerCase();
      var lowCount = SUPPLIES_SAMPLE.filter(supplyIsLow).length;
      var results = SUPPLIES_SAMPLE.filter(function (s) {
        if (state.category !== 'All' && s.category !== state.category) return false;
        if (state.lowOnly && !supplyIsLow(s)) return false;
        return !q || [s.name, s.brand, s.category, s.source, s.description].join(' ').toLowerCase().indexOf(q) !== -1;
      });
      clearEl(count);
      count.appendChild(document.createTextNode(results.length + (results.length === 1 ? ' supply' : ' supplies')));
      if (lowCount) {
        var low = btn('pick-link', state.lowOnly ? '  · Show all' : '  · ' + lowCount + ' running low', function () { state.lowOnly = !state.lowOnly; draw(); });
        count.appendChild(low);
      }
      clearEl(list);
      results.forEach(function (s) { list.appendChild(row(s, navigate)); });
      if (!results.length) list.appendChild(el('p', 'list-empty', SUPPLIES_SAMPLE.length ? 'Nothing matches.' : 'No supplies yet — tap “+ Add supply” to add feed, supplements and the rest of what you keep on hand.'));
    }
    search.addEventListener('input', function (e) { state.query = e.target.value; draw(); });
    draw();
    [actions, search, chips, count, list].forEach(function (e) { wrap.appendChild(e); });
    main.appendChild(wrap);
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    if (id === 'new' || id.indexOf('edit~') === 0) {
      var editId = id === 'new' ? null : id.slice(5);
      RecordForm.render(main, {
        type: 'supplies', id: editId, navigate: navigate, setTitle: setTitle,
        after: function (savedId) { navigate(savedId); },
        onCancel: function () { if (editId) navigate(editId); else location.hash = '#/aviary/supplies'; },
        afterDelete: function () { location.hash = '#/aviary/supplies'; },
      });
      return;
    }
    var s = getSupply(id);
    if (!s) { main.appendChild(el('p', '', 'Supply not found.')); return; }
    setTitle(s.name);
    var again = function () { clearEl(main); renderDetail(main, id, navigate, setTitle); };
    var wrap = el('div', 'detail-screen');

    var header = el('div', 'detail-header');
    var av = el('span', 'detail-avatar');
    fillThumb(av, supplySpec(s));
    header.appendChild(av);
    var t = el('div', 'detail-title');
    t.appendChild(el('h2', '', s.name));
    t.appendChild(el('span', 'type-badge type-breeder', s.category));
    header.appendChild(t);
    header.appendChild(makeEditButton(function () { navigate('edit~' + s.id); }));
    wrap.appendChild(header);

    // Stock: the amount on hand, with quick adjust.
    var stock = el('div', 'detail-section');
    stock.appendChild(el('h3', '', 'Inventory'));
    var line = el('div', 'stock-line');
    line.appendChild(el('strong', 'stock-amount' + (supplyIsLow(s) ? ' low' : ''), supplyAmount(s)));
    if (supplyIsLow(s)) line.appendChild(el('span', 'type-badge supply-low', 'Running low'));
    stock.appendChild(line);
    var adjust = el('div', 'stock-adjust');
    var message = el('div');
    function change(delta) {
      var next = Math.max(0, (Number(s.quantity) || 0) + delta);
      updateRecord('supplies', s.id, { quantity: next }).then(again).catch(function (err) { clearEl(message); message.appendChild(el('p', 'form-message error', err.message)); });
    }
    [['−1', -1], ['+1', 1], ['+5', 5], ['+10', 10]].forEach(function (a) { adjust.appendChild(btn('loc-mini', a[0], function () { change(a[1]); })); });
    stock.appendChild(adjust);
    if (s.reorderLevel !== null && s.reorderLevel !== undefined) stock.appendChild(el('p', 'form-note', 'Reorder at ' + supplyAmount(s, s.reorderLevel) + '.'));
    stock.appendChild(message);
    wrap.appendChild(stock);

    var facts = el('div', 'fact-grid');
    if (s.brand) facts.appendChild(factRow('Brand', s.brand));
    if (s.price !== null && s.price !== undefined) facts.appendChild(factRow('Price each', formatMoney(s.price)));
    if (s.source) facts.appendChild(factRow('Source details', s.source));
    if (facts.firstChild) wrap.appendChild(facts);
    if (s.description) { var d = el('div', 'detail-section'); d.appendChild(el('h3', '', 'About')); d.appendChild(el('p', 'notes-text', s.description)); wrap.appendChild(d); }

    wrap.appendChild(PhotosSection.render({ ownerType: 'supply', ownerId: s.id, name: s.name, photos: mediaPhotos('supply', s.id), fixed: s.images || [], fixedMain: s.mainImage || '', refresh: again,
      onFixedMain: function (url) { return updateRecord('supplies', s.id, { mainImage: url }); },
      onMediaMain: function () { return s.mainImage ? updateRecord('supplies', s.id, { mainImage: '' }) : null; } }));

    var used = supplyUsage(s.id);
    var usage = el('div', 'detail-section');
    usage.appendChild(el('h3', '', 'Used in care plans (' + used.length + ')'));
    if (!used.length) usage.appendChild(el('p', 'form-note', 'Not in any care plan yet. Add it to a cage, bird or place under “Care & feeding”.'));
    used.forEach(function (c) {
      var r = el('button', 'list-row');
      r.type = 'button';
      r.appendChild(el('span', 'list-row-info', ''));
      var info = r.firstChild;
      info.appendChild(el('span', 'list-row-title', careLabel(c.targetType, c.targetId)));
      info.appendChild(el('span', 'list-row-sub', [c.amount, c.mealTime].filter(Boolean).join(' · ')));
      r.addEventListener('click', function () { location.hash = careTargetHash(c.targetType, c.targetId); });
      usage.appendChild(r);
    });
    wrap.appendChild(usage);

    wrap.appendChild(Relations.one({
      title: 'Source', parentName: 'supply', value: s.vendorId || '', find: getContact,
      render: function (c) { return contactChip(c, function () { location.hash = '#/business/contacts/' + c.id; }); },
      picker: function (cfg) { return Picker.contacts(Object.assign({ placeholder: 'Pick the vendor — search contacts…' }, cfg)); },
      set: function (cid) { return updateRecord('supplies', s.id, { vendorId: cid || '' }); }, refresh: again,
    }));

    if (s.notes) { var n = el('div', 'detail-section'); n.appendChild(el('h3', '', 'Notes')); n.appendChild(el('p', 'notes-text', s.notes)); wrap.appendChild(n); }
    main.appendChild(wrap);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

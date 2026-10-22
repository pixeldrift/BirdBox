// Caging: where the birds live. A hierarchy you can use as much or as little of as you like —
//   My Aviary  >  Location (a site)  >  Building  >  Room  >  Cage  >  birds
// Every level below My Aviary is optional. The list is the explorer (js/location-explorer.js);
// the pages here are each place's own page: photos, what's in it, and where it sits. Places are
// added, edited and deleted here (js/data/record-schemas.js); a bird points at its cage by the cage's code.
// Routes: <cage> · building~<code> · location~<id> · room~<id> · aviary · unassigned
//         new~cage|building|location|room · edit~cage|building|location|room~<key>
const CagingScreen = (function () {
  var UNASSIGNED = 'unassigned';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function goToBird(birdId) {
    location.hash = '#/mybirds/birds/' + birdId;
  }

  var TYPE_OF = { cage: 'cages', building: 'buildings', location: 'locations', room: 'rooms' };

  function pageHash(kind, key) {
    return '#/aviary/caging/' + (kind === 'cage' ? key : kind + '~' + key);
  }

  function icon() {
    var img = el('img');
    img.src = 'icons/tinted/aviary/Caging.png';
    img.alt = '';
    return img;
  }

  function avatar(cls) {
    var a = el('span', cls || 'list-row-avatar');
    a.appendChild(icon());
    return a;
  }

  function birdCount(n) {
    return n + (n === 1 ? ' bird' : ' birds');
  }

  function renderList(main, navigate) {
    LocationExplorer.render(main, navigate);
  }

  // ---- pages ------------------------------------------------------------------------------

  function header(titleText, badgeText, onEdit, photoUrl) {
    var h = el('div', 'detail-header');
    if (photoUrl) {
      var a = el('span', 'detail-avatar');
      var img = el('img', 'avatar-photo');
      img.src = photoUrl; img.alt = '';
      a.appendChild(img);
      h.appendChild(a);
    } else {
      h.appendChild(avatar('detail-avatar'));
    }
    var t = el('div', 'detail-title');
    t.appendChild(el('h2', '', titleText));
    if (badgeText) t.appendChild(el('span', 'type-badge type-breeder', badgeText));
    h.appendChild(t);
    if (onEdit) h.appendChild(makeEditButton(onEdit));
    return h;
  }

  function addButton(label, onClick) {
    var b = el('button', 'add-record-btn', label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  // Always shown on a place's page: its description, or a nudge to add one.
  function describe(rec, onEdit) {
    var box = el('div', 'detail-section');
    box.appendChild(el('h3', '', 'Description'));
    if (rec && rec.description) box.appendChild(el('p', 'notes-text', rec.description));
    else {
      box.appendChild(el('p', 'form-note', 'No description yet.'));
      if (onEdit) { var b = el('button', 'pick-link', 'Add a description'); b.type = 'button'; b.addEventListener('click', onEdit); box.appendChild(b); }
    }
    return box;
  }

  function summary(node) {
    var n = node.kind === 'cage' || node.kind === 'loose' ? node.directBirds : node.birds;
    return (node.kind === 'cage' ? '' : LocationModel.countsLine(node) + (LocationModel.countsLine(node) ? ' · ' : '')) + birdCount(n);
  }

  function photos(kind, key, name, again) {
    return PhotosSection.render({ ownerType: kind, ownerId: key, name: name, photos: mediaPhotos(kind, key), refresh: again });
  }

  // A tappable row for a place, the same one the explorer uses.
  function placeRow(model, kind, key, navigate) {
    var node = model.byId[kind + ':' + key];
    if (!node) return el('span');
    return LocationExplorer.item(node, { onOpen: function () { navigate(kind === 'cage' ? key : kind + '~' + key); } });
  }

  function saveCage(code, changes) {
    return getCage(code) ? updateRecord('cages', code, changes) : createRecord('cages', Object.assign({ code: code }, changes));
  }

  function renderCage(main, id, navigate, setTitle) {
    var isLoose = id === UNASSIGNED;
    var birds = isLoose ? BIRDS_SAMPLE.filter(function (b) { return !b.cage && !birdIsGone(b); }) : birdsInCage(id);
    var rec = isLoose ? null : getCage(id);
    if (!isLoose && !rec && !birds.length) { main.appendChild(el('p', '', 'Cage not found.')); return; }
    setTitle(isLoose ? 'Unassigned birds' : id);
    var again = function () { clearEl(main); renderCage(main, id, navigate, setTitle); };
    var model = LocationModel.build();

    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(isLoose ? 'Unassigned birds' : id, isLoose ? birdCount(birds.length) : cagePlaceLabel(id) + ' · ' + birdCount(birds.length),
      rec ? function () { navigate('edit~cage~' + id); } : null, isLoose ? '' : mediaMainPhotoUrl('cage', id)));

    if (!isLoose) {
      wrap.appendChild(describe(rec, rec ? function () { navigate('edit~cage~' + id); } : null));
      wrap.appendChild(photos('cage', id, 'cage ' + id, again));
      // Where this cage is — assign or change it from here (or from the room's / building's page).
      wrap.appendChild(Relations.one({
        title: 'Room', parentName: 'cage', value: rec && rec.roomId || '', find: getRoom,
        render: function (r) { return placeRow(model, 'room', r.id, navigate); },
        picker: function (cfg) { return Picker.rooms(Object.assign({ placeholder: 'Put this cage in a room — search…' }, cfg)); },
        set: function (rid) { return saveCage(id, { roomId: rid || '' }); }, refresh: again,
      }));
      wrap.appendChild(Relations.one({
        title: 'Building', parentName: 'cage', value: rec ? rec.buildingCode || '' : '', find: getBuilding,
        render: function (b) { return placeRow(model, 'building', b.code, navigate); },
        picker: function (cfg) { return Picker.buildings(Object.assign({ placeholder: 'Assign to a building — browse or search…' }, cfg)); },
        set: function (code) { return assignCageToBuilding(id, code || ''); }, refresh: again,
      }));
    }

    // The birds in this cage — add one from here (it moves out of its old cage) or remove one.
    wrap.appendChild(Relations.many({
      title: 'Birds', related: birds, render: function (bd) { return birdChip(bd, function () { goToBird(bd.id); }); },
      parentName: 'cage', empty: isLoose ? 'Every bird has a cage.' : 'No birds in this cage.', refresh: again,
      unlink: isLoose ? null : function (bd) { return editBird(bd.id, { cage: '' }); },
      candidates: isLoose ? null : function () {
        return Picker.listItems('birds', function (bd) { return bd.cage !== id; }).map(function (it) {
          var bd = getBird(it.id);
          if (bd && bd.cage) it.hay = (it.hay || '') + ' ' + bd.cage;
          return it;
        });
      },
      link: function (birdId) { return editBird(birdId, { cage: id }); },
      addPlaceholder: 'Add a bird to this cage',
      itemName: function (bd) { return birdShortLabel(bd); },
    }));

    if (!isLoose && !rec) {
      var note = el('div', 'detail-section');
      note.appendChild(el('p', 'form-note', 'This cage number is on some birds but hasn’t been set up yet. Set it up to give it a description and photos.'));
      note.appendChild(addButton('Set up this cage', function () { navigate('new~cage~' + id); }));
      wrap.appendChild(note);
    }
    main.appendChild(wrap);
  }

  function renderRoom(main, id, navigate, setTitle) {
    var r = getRoom(id);
    if (!r) { main.appendChild(el('p', '', 'Room not found.')); return; }
    setTitle(r.name);
    var again = function () { clearEl(main); renderRoom(main, id, navigate, setTitle); };
    var model = LocationModel.build();
    var node = model.byId['room:' + id];
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(r.name, summary(node), function () { navigate('edit~room~' + id); }, mediaMainPhotoUrl('room', id)));
    wrap.appendChild(describe(r, function () { navigate('edit~room~' + id); }));
    wrap.appendChild(photos('room', id, r.name, again));
    wrap.appendChild(Relations.one({
      title: 'Building', parentName: 'room', value: r.buildingCode || '', find: getBuilding,
      render: function (b) { return placeRow(model, 'building', b.code, navigate); },
      picker: function (cfg) { return Picker.buildings(Object.assign({ placeholder: 'Put this room in a building — search…' }, cfg)); },
      set: function (code) { return updateRecord('rooms', id, { buildingCode: code || '' }); }, refresh: again,
    }));
    wrap.appendChild(Relations.many({
      title: 'Cages', related: node.children.map(function (c) { return c.record; }), render: function (c) { return placeRow(model, 'cage', c.code, navigate); }, parentName: 'room',
      empty: 'No cages in this room yet.', refresh: again,
      unlink: function (c) { return saveCage(c.code, { roomId: '' }); },
      candidates: function () { return Picker.listItems('cages', function (c) { return c.roomId !== id; }); },
      link: function (code) { return saveCage(code, { roomId: id }); },
      addPlaceholder: '+ Add an existing cage — search…',
      addNew: { label: '+ Add a new cage to this room', onClick: function () { LocationExplorer.setPrefill({ roomId: id, buildingCode: r.buildingCode || '' }); navigate('new~cage'); } },
    }));
    main.appendChild(wrap);
  }

  function renderBuilding(main, code, navigate, setTitle) {
    var b = getBuilding(code);
    if (!b) { main.appendChild(el('p', '', 'Building not found.')); return; }
    setTitle('Building ' + b.nickname);
    var again = function () { clearEl(main); renderBuilding(main, code, navigate, setTitle); };
    var model = LocationModel.build();
    var node = model.byId['building:' + code];
    var rooms = node.children.filter(function (c) { return c.kind === 'room'; }).map(function (c) { return c.record; });
    var cages = node.children.filter(function (c) { return c.kind === 'cage'; }).map(function (c) { return c.record; });
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header('Building ' + b.nickname, summary(node), function () { navigate('edit~building~' + code); }, mediaMainPhotoUrl('building', code)));
    var facts = el('div', 'fact-grid');
    facts.appendChild(factRow('Code', b.code));
    wrap.appendChild(facts);
    wrap.appendChild(describe(b, function () { navigate('edit~building~' + code); }));
    wrap.appendChild(photos('building', code, 'Building ' + b.nickname, again));

    wrap.appendChild(Relations.one({
      title: 'Location', parentName: 'building', value: b.locationId || '', find: getLocation,
      render: function (l) { return placeRow(model, 'location', l.id, navigate); },
      picker: function (cfg) { return Picker.locations(Object.assign({ placeholder: 'Put this building on a location — search…' }, cfg)); },
      set: function (id) { return updateRecord('buildings', code, { locationId: id || '' }); }, refresh: again,
    }));

    wrap.appendChild(Relations.many({
      title: 'Rooms', related: rooms, render: function (r) { return placeRow(model, 'room', r.id, navigate); }, parentName: 'building',
      empty: 'No rooms in this building. Rooms are optional — cages can sit right in the building.', refresh: again,
      unlink: function (r) { return updateRecord('rooms', r.id, { buildingCode: '' }); },
      candidates: function () { return Picker.listItems('rooms', function (r) { return r.buildingCode !== code; }); },
      link: function (rid) { return updateRecord('rooms', rid, { buildingCode: code }); },
      addPlaceholder: '+ Add an existing room — search…',
      addNew: { label: '+ Add a new room here', onClick: function () { LocationExplorer.setPrefill({ buildingCode: code }); navigate('new~room'); } },
    }));

    wrap.appendChild(Relations.many({
      title: 'Cages (not in a room)', related: cages, render: function (c) { return placeRow(model, 'cage', c.code, navigate); }, parentName: 'building',
      empty: 'No cages directly in this building.', refresh: again,
      unlink: function (c) { return assignCageToBuilding(c.code, ''); },
      candidates: function () { return Picker.listItems('cages', function (c) { var bb = buildingForCage(c.code); return !(bb && bb.code === code); }); },
      link: function (cageCode) { return saveCage(cageCode, { buildingCode: code, roomId: '' }); },
      addPlaceholder: '+ Add an existing cage — search…',
      addNew: { label: '+ Add a new cage to this building', onClick: function () { LocationExplorer.setPrefill({ buildingCode: code }); navigate('new~cage'); } },
    }));
    main.appendChild(wrap);
  }

  function renderLocation(main, id, navigate, setTitle) {
    var l = getLocation(id);
    if (!l) { main.appendChild(el('p', '', 'Location not found.')); return; }
    setTitle(l.name);
    var again = function () { clearEl(main); renderLocation(main, id, navigate, setTitle); };
    var model = LocationModel.build();
    var node = model.byId['location:' + id];
    var buildings = node.children.filter(function (c) { return c.kind === 'building'; }).map(function (c) { return c.record; });
    var rooms = node.children.filter(function (c) { return c.kind === 'room'; }).map(function (c) { return c.record; });
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(l.name, summary(node), function () { navigate('edit~location~' + id); }, mediaMainPhotoUrl('location', id)));
    wrap.appendChild(describe(l, function () { navigate('edit~location~' + id); }));
    wrap.appendChild(photos('location', id, l.name, again));
    wrap.appendChild(Relations.many({
      title: 'Buildings', related: buildings, render: function (b) { return placeRow(model, 'building', b.code, navigate); }, parentName: 'location',
      empty: 'No buildings on this location yet.', refresh: again,
      unlink: function (b) { return updateRecord('buildings', b.code, { locationId: '' }); },
      candidates: function () { return Picker.listItems('buildings', function (b) { return b.locationId !== id; }); },
      link: function (code) { return updateRecord('buildings', code, { locationId: id }); },
      addPlaceholder: '+ Add an existing building — search…',
      addNew: { label: '+ Add a new building here', onClick: function () { LocationExplorer.setPrefill({ locationId: id }); navigate('new~building'); } },
    }));
    if (rooms.length) {
      wrap.appendChild(Relations.many({
        title: 'Rooms (not in a building)', related: rooms, render: function (r) { return placeRow(model, 'room', r.id, navigate); }, parentName: 'location',
        refresh: again, unlink: function (r) { return updateRecord('rooms', r.id, { locationId: '' }); },
      }));
    }
    main.appendChild(wrap);
  }

  // My Aviary: the top of everything. Its details (and logo) are edited under Account > Settings.
  function renderAviary(main, navigate, setTitle) {
    setTitle(AVIARY.name);
    var again = function () { clearEl(main); renderAviary(main, navigate, setTitle); };
    var model = LocationModel.build();
    var node = model.root;
    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(AVIARY.name, summary(node), function () { location.hash = '#/account/settings'; }, mediaMainPhotoUrl('aviary', 'main')));
    var facts = el('div', 'fact-grid');
    [['About', AVIARY.description], ['Address', AVIARY.address], ['Phone', AVIARY.phone], ['Email', AVIARY.email], ['Website', AVIARY.website], ['Social', AVIARY.socials]].forEach(function (f) { if (f[1]) facts.appendChild(factRow(f[0], f[1])); });
    if (facts.firstChild) wrap.appendChild(facts);
    wrap.appendChild(photos('aviary', 'main', AVIARY.name, again));
    var note = el('div', 'detail-section');
    note.appendChild(el('p', 'form-note', 'Your aviary’s name, contact details and logo live under Account → Settings.'));
    note.appendChild(addButton('Edit my aviary', function () { location.hash = '#/account/settings'; }));
    wrap.appendChild(note);
    main.appendChild(wrap);
  }

  // new~<kind>  — parents are pre-filled from where "Add new" was tapped (see LocationExplorer).
  // new~cage~<code> sets up a cage number that's already on birds.
  function renderForm(main, parts, navigate, setTitle) {
    var mode = parts[0], kind = parts[1], key = parts[2] || '';
    var type = TYPE_OF[kind];
    if (!type) { main.appendChild(el('p', '', 'Not found.')); return; }
    var prefill = LocationExplorer.takePrefill();
    if (mode === 'new' && kind === 'cage' && key) { prefill.code = key; var guess = buildingForCage(key); if (guess && !prefill.buildingCode) prefill.buildingCode = guess.code; }
    if (mode === 'new' && prefill.roomId && kind !== 'cage') delete prefill.roomId;
    var backList = function () { location.hash = '#/aviary/caging'; };
    RecordForm.render(main, {
      type: type, id: mode === 'edit' ? key : null, prefill: prefill, setTitle: setTitle, navigate: navigate,
      after: function (savedKey) { location.hash = pageHash(kind, savedKey); },
      onCancel: function () { if (mode === 'edit') location.hash = pageHash(kind, key); else backList(); },
      afterDelete: backList,
    });
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    var parts = id.split('~');
    if (parts[0] === 'new' || parts[0] === 'edit') return renderForm(main, parts, navigate, setTitle);
    if (parts[0] === 'building') return renderBuilding(main, parts[1], navigate, setTitle);
    if (parts[0] === 'location') return renderLocation(main, parts[1], navigate, setTitle);
    if (parts[0] === 'room') return renderRoom(main, parts[1], navigate, setTitle);
    if (id === 'aviary') return renderAviary(main, navigate, setTitle);
    return renderCage(main, id, navigate, setTitle);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

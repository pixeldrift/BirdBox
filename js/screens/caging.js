// Caging: where the birds live. One tree of places, as deep as you like:
//   My Aviary  >  any place (a building, room, coop, cage, shelf, box… or a kind you invented)  >  any place inside it  >  birds
// The list is the explorer (js/location-explorer.js); the pages here are each place's own page: photos, what's in it, and where it sits.
// Places are added, edited and deleted through js/data/record-schemas.js; a bird points at its place by the place's id.
// Routes: <place id> · aviary · unassigned · new · new~<code on birds> · edit~<place id>
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

  function pageHash(id) {
    return '#/aviary/caging/' + id;
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
    var b = el('button', 'btn-positive', label);
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
    var inside = node.kind === 'loose' ? '' : LocationModel.countsLine(node);
    var n = node.kind === 'loose' ? node.directBirds : node.birds;
    return (inside ? inside + ' · ' : '') + birdCount(n);
  }

  function photos(key, name, again) {
    return PhotosSection.render({ ownerType: 'place', ownerId: key, name: name, photos: mediaPhotos('place', key), refresh: again });
  }

  // A tappable row for a place, the same one the explorer uses.
  function placeRow(model, key, navigate) {
    var node = model.byId['place:' + key];
    if (!node) return el('span');
    return LocationExplorer.item(node, { onOpen: function () { navigate(key); } });
  }

  // Save a change to a place; a code that's only on birds is set up as a place first.
  function savePlace(id, changes) {
    return getPlace(id) ? updateRecord('places', id, changes) : createRecord('places', Object.assign({ name: id, type: leafPlaceType() }, changes));
  }

  // The page for the unassigned birds, or for any place (including a code that's on birds but not set up yet).
  function renderPlace(main, id, navigate, setTitle) {
    var isLoose = id === UNASSIGNED;
    var birds = isLoose ? BIRDS_SAMPLE.filter(function (b) { return !b.cage && !birdIsArchived(b); }) : birdsInCage(id);
    var rec = isLoose ? null : getPlace(id);
    if (!isLoose && !rec && !birds.length) { main.appendChild(el('p', '', 'Place not found.')); return; }
    var name = isLoose ? 'Unassigned birds' : rec ? rec.name : id;
    setTitle(name);
    var again = function () { clearEl(main); renderPlace(main, id, navigate, setTitle); };
    var model = LocationModel.build();
    var node = isLoose ? model.byId['loose:none'] : model.byId['place:' + id];

    var wrap = el('div', 'detail-screen');
    wrap.appendChild(header(name, isLoose ? birdCount(birds.length) : [placeTypeLabel(rec ? rec.type : leafPlaceType()), node ? summary(node) : birdCount(birds.length)].join(' · '),
      rec ? function () { navigate('edit~' + id); } : null, isLoose ? '' : mediaMainPhotoUrl('place', id)));

    if (!isLoose) {
      var where = placePathLabel(id);
      if (where) { var facts = el('div', 'fact-grid'); facts.appendChild(factRow('Inside', where)); wrap.appendChild(facts); }
      wrap.appendChild(describe(rec, rec ? function () { navigate('edit~' + id); } : null));
      wrap.appendChild(photos(id, name, again));
      wrap.appendChild(CareSection.render({ targetType: 'place', targetId: id, name: name, refresh: again }));
      wrap.appendChild(CareSection.render({ targetType: 'place', targetId: id, name: name, refresh: again, plan: 'cleaning' }));

      // What this place is inside — any place will do.
      var cannot = [id].concat(placeDescendants(id).map(function (d) { return d.id; }));
      wrap.appendChild(Relations.one({
        title: 'Inside', parentName: 'place', value: rec && rec.parentId || '', find: getPlace,
        render: function (p) { return placeRow(model, p.id, navigate); },
        picker: function (cfg) { return Picker.places(Object.assign({ placeholder: 'Put this inside something — search or browse…', exclude: cannot }, cfg)); },
        set: function (pid) { return savePlace(id, { parentId: pid || '' }); }, refresh: again,
      }));

      // What's inside this place — anything, of any kind.
      var kids = placeChildren(id);
      wrap.appendChild(Relations.many({
        title: 'Inside it', related: kids, render: function (c) { return placeRow(model, c.id, navigate); }, parentName: 'place',
        empty: 'Nothing is inside this yet.', refresh: again,
        unlink: function (c) { return savePlace(c.id, { parentId: '' }); },
        candidates: function () { return Picker.listItems('places', function (p) { return p.id !== id && p.parentId !== id && cannot.indexOf(p.id) === -1 && placeAncestors(rec || { parentId: '' }).every(function (a) { return a.id !== p.id; }) ; }); },
        link: function (childId) { return savePlace(childId, { parentId: id }); },
        addPlaceholder: '+ Put an existing place inside — search…',
        addNew: { label: '+ Add a new place inside', onClick: function () { LocationExplorer.setPrefill({ parentId: id, type: suggestedPlaceType(id) }); navigate('new'); } },
      }));
    }

    // The birds here — add one from here (it moves out of its old place) or remove one.
    wrap.appendChild(Relations.many({
      title: 'Birds', related: birds, render: function (bd) { return birdChip(bd, function () { goToBird(bd.id); }); },
      parentName: 'place', empty: isLoose ? 'Every bird has a place.' : 'No birds directly here.', refresh: again,
      unlink: isLoose ? null : function (bd) { return editBird(bd.id, { cage: '' }); },
      candidates: isLoose ? null : function () {
        return Picker.listItems('birds', function (bd) { return bd.cage !== id; }).map(function (it) {
          var bd = getBird(it.id);
          if (bd && bd.cage) it.hay = (it.hay || '') + ' ' + placeName(bd.cage);
          return it;
        });
      },
      link: function (birdId) { return editBird(birdId, { cage: id }); },
      addPlaceholder: 'Add a bird here',
      itemName: function (bd) { return birdShortLabel(bd); },
    }));

    if (!isLoose && !rec) {
      var note = el('div', 'detail-section');
      note.appendChild(el('p', 'form-note', 'This name is on some birds but hasn’t been set up as a place yet. Set it up to give it a type, a description and photos.'));
      note.appendChild(addButton('Set up this place', function () { navigate('new~' + id); }));
      wrap.appendChild(note);
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
    wrap.appendChild(CareSection.render({ targetType: 'aviary', targetId: 'main', name: AVIARY.name, refresh: again }));
    wrap.appendChild(CareSection.render({ targetType: 'aviary', targetId: 'main', name: AVIARY.name, refresh: again, plan: 'cleaning' }));
    var note = el('div', 'detail-section');
    note.appendChild(el('p', 'form-note', 'Your aviary’s name, contact details and logo live under Account → Settings.'));
    note.appendChild(addButton('Edit my aviary', function () { location.hash = '#/account/settings'; }));
    wrap.appendChild(note);
    main.appendChild(wrap);
  }

  // new — parent and type are pre-filled from where "Add new" was tapped (see LocationExplorer).
  // new~<code> sets up a name that's already on birds.  edit~<place id> changes a place.
  function renderForm(main, parts, navigate, setTitle) {
    var mode = parts[0], key = parts[parts.length - 1] === parts[0] ? '' : parts[parts.length - 1]; // (old links had a kind in the middle: edit~cage~F2-001)
    var prefill = LocationExplorer.takePrefill();
    if (mode === 'new' && key) { prefill.name = key; prefill.type = prefill.type || leafPlaceType(); }
    if (mode === 'new' && !prefill.type) prefill.type = suggestedPlaceType(prefill.parentId || '');
    var backList = function () { location.hash = '#/aviary/caging'; };
    var made = null;
    RecordForm.render(main, {
      type: 'places', id: mode === 'edit' ? key : null, prefill: prefill, setTitle: setTitle, navigate: navigate,
      after: function (savedId) {
        if (mode === 'new' && key && key !== savedId) { // set up a name that was on birds: those birds now point at the new place
          Promise.all(BIRDS_SAMPLE.filter(function (b) { return b.cage === key; }).map(function (b) { return editBird(b.id, { cage: savedId }); }))
            .catch(function () {}).then(function () { location.hash = pageHash(savedId); });
        } else location.hash = pageHash(savedId);
      },
      onCancel: function () { if (mode === 'edit') location.hash = pageHash(key); else backList(); },
      afterDelete: backList,
    });
  }

  // Links made before places were one kind of thing (building~F2, room~room-1, location~loc-1) still open the right page.
  function legacyId(parts) {
    if (parts[0] === 'building') return 'bld-' + parts[1];
    if (parts[0] === 'room' || parts[0] === 'location') return parts[1];
    return null;
  }

  function renderDetail(main, id, navigate, setTitle) {
    clearEl(main);
    var parts = id.split('~');
    if (parts[0] === 'new' || parts[0] === 'edit') return renderForm(main, parts, navigate, setTitle);
    var old = legacyId(parts);
    if (old) id = old;
    if (id === 'aviary') return renderAviary(main, navigate, setTitle);
    return renderPlace(main, id, navigate, setTitle);
  }

  return { renderList: renderList, renderDetail: renderDetail };
})();

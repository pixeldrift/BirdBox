// The places hierarchy as one tree of plain nodes, built from the records BirdBox already has:
//   My Aviary  >  Location  >  Building  >  Room  >  Cage  >  birds
// Every level except the aviary is optional, and nothing is created to fill a gap: a building with
// no location simply sits directly under My Aviary, and is marked "No location" so you can spot it.
// Birds with no cage appear as one "Unassigned birds" entry under My Aviary.
//
// node: { id, kind, key, name, typeLabel, parentId, children, counts {locations, buildings, rooms, cages},
//         birds (everything below), directBirds, flags [], unassigned, setUp, record }
const LocationModel = (function () {
  var KINDS = { aviary: 'My Aviary', location: 'Location', building: 'Building', room: 'Room', cage: 'Cage', loose: 'Birds' };
  var CHILD_KIND = { aviary: 'location', location: 'building', building: 'room', room: 'cage' };
  var PLURAL = { location: 'locations', building: 'buildings', room: 'rooms', cage: 'cages' };

  function make(kind, key, name, record) {
    return { id: kind + ':' + key, kind: kind, key: key, name: name, typeLabel: KINDS[kind], parentId: null, children: [],
      counts: { locations: 0, buildings: 0, rooms: 0, cages: 0 }, birds: 0, directBirds: 0, flags: [], unassigned: false, setUp: true, record: record || null };
  }

  function numeric(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); }

  function build() {
    var byId = {};
    var root = make('aviary', 'main', AVIARY.name || 'My Aviary', AVIARY);
    byId[root.id] = root;
    function add(node, parent) { byId[node.id] = node; node.parentId = parent.id; parent.children.push(node); return node; }

    var haveLocations = LOCATIONS_SAMPLE.length > 0;
    var locNodes = {};
    LOCATIONS_SAMPLE.forEach(function (l) { locNodes[l.id] = add(make('location', l.id, l.name, l), root); });

    var bldNodes = {};
    BUILDINGS_SAMPLE.forEach(function (b) {
      var parent = b.locationId && locNodes[b.locationId] ? locNodes[b.locationId] : root;
      var n = add(make('building', b.code, 'Building ' + b.nickname, b), parent);
      n.code = b.code;
      if (parent === root && haveLocations) { n.unassigned = true; }
      bldNodes[b.code] = n;
    });

    var roomNodes = {};
    ROOMS_SAMPLE.forEach(function (r) {
      var parent = r.buildingCode && bldNodes[r.buildingCode] ? bldNodes[r.buildingCode] : r.locationId && locNodes[r.locationId] ? locNodes[r.locationId] : root;
      var n = add(make('room', r.id, r.name, r), parent);
      if (parent === root) { n.unassigned = true; n.flags.push('Not in a building'); }
      roomNodes[r.id] = n;
    });

    allCages().forEach(function (c) {
      var room = c.roomId ? roomNodes[c.roomId] : null;
      var bld = !room ? buildingForCage(c.code) : null;
      var parent = room || (bld && bldNodes[bld.code]) || root;
      var n = add(make('cage', c.code, c.code, c), parent);
      n.setUp = c.setUp;
      n.directBirds = birdsInCage(c.code).length;
      n.birdList = birdsInCage(c.code);
      if (!c.setUp) n.flags.push('Not set up');
      if (parent === root && (BUILDINGS_SAMPLE.length || ROOMS_SAMPLE.length)) { n.unassigned = true; n.flags.push('No building'); }
      if (!n.directBirds) n.flags.push('Empty');
    });

    var loose = BIRDS_SAMPLE.filter(function (b) { return !b.cage && !birdIsGone(b); });
    if (loose.length) {
      var ln = add(make('loose', 'none', 'Unassigned birds', null), root);
      ln.directBirds = loose.length;
      ln.birdList = loose;
      ln.unassigned = true;
    }

    // Totals for everything below each node, and a stable order within each level.
    function walk(n) {
      n.children.sort(function (a, b) {
        var order = { location: 0, building: 1, room: 2, cage: 3, loose: 4 };
        return order[a.kind] - order[b.kind] || numeric(a.name, b.name);
      });
      var seen = {};
      (n.birdList || []).forEach(function (bd) { seen[bd.id] = true; });
      n.children.forEach(function (c) {
        walk(c);
        (c.allBirdIds || []).forEach(function (id) { seen[id] = true; });
        if (c.kind === 'loose') return;
        n.counts[PLURAL[c.kind]] += 1;
        Object.keys(n.counts).forEach(function (k) { n.counts[k] += c.counts[k]; });
      });
      n.allBirdIds = Object.keys(seen);
      n.birds = n.allBirdIds.length;
      if (n.kind === 'cage' || n.kind === 'loose') n.birds = n.directBirds;
    }
    walk(root);
    root.name = AVIARY.name || 'My Aviary';
    return { root: root, byId: byId };
  }

  // Every node below `node`, flattened.
  function descendants(node, byId) {
    var out = [];
    (function rec(n) { n.children.forEach(function (c) { out.push(c); rec(c); }); })(node);
    return out;
  }

  function ancestors(node, byId) {
    var out = [];
    var cur = node;
    while (cur && cur.parentId) { cur = byId[cur.parentId]; if (cur) out.unshift(cur); }
    return out;
  }

  // "3 rooms · 12 cages" — what's directly inside, without zeros.
  function countsLine(n) {
    if (n.kind === 'cage' || n.kind === 'loose') return n.directBirds + (n.directBirds === 1 ? ' bird' : ' birds');
    var parts = [];
    ['location', 'building', 'room', 'cage'].forEach(function (k) {
      var c = n.counts[PLURAL[k]];
      if (c) parts.push(c + ' ' + (c === 1 ? k : PLURAL[k]));
    });
    return parts.join(' · ');
  }

  return { build: build, descendants: descendants, ancestors: ancestors, countsLine: countsLine, KINDS: KINDS, CHILD_KIND: CHILD_KIND, PLURAL: PLURAL };
})();

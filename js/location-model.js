// The places as one tree of plain nodes, built from the PLACES records (js/data/buildings-sample.js):
//   My Aviary  >  any place  >  any place inside it  >  …  >  birds
// A place is whatever kind the person chose — a building, a room, a coop, a shelf, a type they invented — and can sit inside any other,
// so there is no fixed set of levels. Nothing is created to fill a gap. Birds that name a place with no record yet appear under it as
// "not set up"; birds with no place at all appear as one "Unassigned birds" entry under My Aviary.
//
// node: { id, kind ('aviary' | 'place' | 'loose'), key (the place's id), name, type, typeLabel, parentId, children,
//         counts { <type>: how many of that type are somewhere below, places: how many in all }, birds (everything below),
//         directBirds, birdList, flags [], setUp, record }
const LocationModel = (function () {
  function make(kind, key, name, record, type) {
    return { id: kind + ':' + key, kind: kind, key: key, name: name, type: type || '', typeLabel: kind === 'aviary' ? T('My Aviary') : type ? placeTypeLabel(type) : 'Birds',
      parentId: null, children: [], counts: { places: 0 }, birds: 0, directBirds: 0, birdList: [], flags: [], setUp: true, record: record || null };
  }

  function numeric(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); }

  function build() {
    var byId = {};
    var root = make('aviary', 'main', AVIARY.name || 'My Aviary', AVIARY);
    byId[root.id] = root;

    var nodes = {};
    PLACES.forEach(function (p) { nodes[p.id] = make('place', p.id, p.name, p, p.type); });
    // codes on birds that have no place record yet
    allCages().forEach(function (c) {
      if (c.setUp) return;
      var n = make('place', c.code, c.name, null, 'Cage');
      n.setUp = false;
      n.flags.push('Not set up');
      nodes[c.code] = n;
    });

    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id];
      var pid = n.record && n.record.parentId;
      var parent = pid && nodes[pid] && pid !== id ? nodes[pid] : root;
      // a loop (A inside B inside A) would be unreachable — break it by putting the later one at the top
      var seen = {}, cur = parent;
      while (cur && cur !== root) { if (cur === n || seen[cur.id]) { parent = root; break; } seen[cur.id] = true; cur = cur.record && cur.record.parentId ? nodes[cur.record.parentId] : root; }
      n.parentId = parent.id;
      parent.children.push(n);
      byId[n.id] = n;
      n.birdList = birdsInCage(id);
      n.directBirds = n.birdList.length;
    });

    var loose = BIRDS_SAMPLE.filter(function (b) { return !b.cage && !birdIsArchived(b); });
    if (loose.length) {
      var ln = make('loose', 'none', 'Unassigned birds', null);
      ln.parentId = root.id;
      ln.directBirds = loose.length;
      ln.birdList = loose;
      ln.flags.push('Unassigned');
      root.children.push(ln);
      byId[ln.id] = ln;
    }

    function walk(n) {
      n.children.sort(function (a, b) { return (a.kind === 'loose') - (b.kind === 'loose') || numeric(a.name, b.name); });
      var seen = {};
      n.birdList.forEach(function (bd) { seen[bd.id] = true; });
      n.children.forEach(function (c) {
        walk(c);
        (c.allBirdIds || []).forEach(function (id) { seen[id] = true; });
        if (c.kind === 'loose') return;
        n.counts.places += 1;
        n.counts[c.type] = (n.counts[c.type] || 0) + 1;
        Object.keys(c.counts).forEach(function (k) { n.counts[k] = (n.counts[k] || 0) + c.counts[k]; });
      });
      n.allBirdIds = Object.keys(seen);
      n.birds = n.kind === 'loose' ? n.directBirds : n.allBirdIds.length;
      if (!n.directBirds && !n.children.filter(function (c) { return c.kind !== 'loose'; }).length && n.kind === 'place') n.flags.push('Empty');
    }
    walk(root);
    root.name = AVIARY.name || 'My Aviary';
    return { root: root, byId: byId };
  }

  // Every node below `node`, flattened.
  function descendants(node) {
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

  function pluralType(label, n) {
    if (n === 1) return label;
    if (/[^aeiou]y$/i.test(label)) return label.slice(0, -1) + 'ies';
    if (/(s|x|ch|sh)$/i.test(label)) return label + 'es';
    return label + 's';
  }

  // "3 Rooms · 12 Cages" — what's somewhere below, by kind, without zeros.
  function countsLine(n) {
    if (n.kind === 'loose') return n.directBirds + (n.directBirds === 1 ? ' bird' : ' birds');
    var types = Object.keys(n.counts).filter(function (k) { return k !== 'places' && n.counts[k]; });
    types.sort(function (a, b) { return n.counts[b] - n.counts[a] || a.localeCompare(b); });
    return types.slice(0, 3).map(function (t) { return n.counts[t] + ' ' + pluralType(placeTypeLabel(t), n.counts[t]); }).join(' · ');
  }

  return { build: build, descendants: descendants, ancestors: ancestors, countsLine: countsLine, pluralType: pluralType };
})();

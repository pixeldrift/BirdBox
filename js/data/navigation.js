// The menus as data. NAV (js/nav-data.js) is the built-in layout; the `navigation` table
// (sql/017_navigation.sql) holds the order, names and visibility of every home tile and every tab,
// and wins when it has a row. Account → Customize edits it. If the table is empty or missing, the
// built-in layout is used unchanged.
var NAV_ROWS = [];

var navigationLoaded = fetch('/api/records?type=navigation')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load navigation');
    return res.json();
  })
  .then(function (rows) {
    NAV_ROWS.length = 0;
    Array.prototype.push.apply(NAV_ROWS, rows);
    applyNavigation();
  })
  .catch(function (err) {
    console.error('Could not load navigation from the server (using the built-in menus):', err);
  });

function navRow(id) {
  return NAV_ROWS.filter(function (r) { return r.id === id; })[0] || null;
}

// Remember the built-in layout once, so "Reset" and re-applying always start from it. Every tab
// gets a permanent `key` (its original "group/screen" id) so it can be moved between sections and
// still find its screen.
var NAV_DEFAULT = NAV.map(function (g) {
  g.screens.forEach(function (s) { s.key = g.id + '/' + s.id; s.home = g.id; });
  return { id: g.id, label: g.label, icon: g.icon, blurb: g.blurb, homeTile: g.homeTile, screens: g.screens.map(function (s) { return { id: s.id, key: s.key, label: s.label, icon: s.icon, blurb: s.blurb }; }) };
});
var NAV_SCREENS = [];
NAV.forEach(function (g) { g.screens.forEach(function (s) { NAV_SCREENS.push(s); }); });

// Applies the table's order, names, visibility and nesting onto NAV, in place.
function applyNavigation() {
  var order = {};
  NAV.forEach(function (g) {
    var def = NAV_DEFAULT.filter(function (d) { return d.id === g.id; })[0];
    var row = navRow(g.id);
    g.label = row ? row.label : def.label;
    g.blurb = row && row.blurb ? row.blurb : def.blurb;
    g.homeTile = g.id === 'account' ? false : row ? !!(row.visible && row.homeTile) : def.homeTile;
    order[g.id] = row ? row.sort : NAV_DEFAULT.indexOf(def) * 10 + 10;
    g.screens = [];
  });
  var sorder = {};
  var prevSort = null; // a tab with no saved row (a newer built-in one) slots in right after the tab before it
  NAV_SCREENS.forEach(function (s, i) {
    var srow = navRow(s.key);
    var sd = NAV_DEFAULT.filter(function (d) { return d.id === s.home; })[0].screens.filter(function (x) { return x.key === s.key; })[0];
    s.label = srow ? srow.label : sd.label;
    s.hidden = !!(srow && !srow.visible);
    sorder[s.key] = srow ? srow.sort : prevSort !== null ? prevSort + 0.5 : i;
    prevSort = sorder[s.key];
    var parent = srow && srow.parentId && NAV.some(function (g) { return g.id === srow.parentId; }) ? srow.parentId : s.home;
    NAV.filter(function (g) { return g.id === parent; })[0].screens.push(s);
  });
  NAV.forEach(function (g) { g.screens.sort(function (a, b) { return sorder[a.key] - sorder[b.key]; }); });
  NAV.sort(function (a, b) { return order[a.id] - order[b.id]; });
}

// Saves a new order / visibility. changes: [{ id, sort?, visible?, homeTile?, label? }]
function saveNavigation(changes) {
  return changes.reduce(function (chain, c) {
    return chain.then(function () {
      var body = {};
      ['sort', 'visible', 'homeTile', 'label', 'parentId'].forEach(function (k) { if (c[k] !== undefined) body[k] = c[k]; });
      if (navRow(c.id)) return recordsRequest('PATCH', 'navigation', c.id, body);
      // A menu item that has no saved row yet (a tab added to the app after the table was seeded): create it, so moving it works too.
      var grp = NAV_DEFAULT.filter(function (g) { return g.id === c.id; })[0];
      var tab = NAV_SCREENS.filter(function (s) { return s.key === c.id; })[0];
      var def = grp || tab || {};
      return recordsRequest('POST', 'navigation', null, Object.assign({
        id: c.id, label: def.label || c.label || c.id, icon: def.icon || '', blurb: def.blurb || '', parentId: grp ? '' : (tab ? tab.home : ''),
        sort: 0, visible: true, homeTile: grp ? grp.homeTile !== false : false,
      }, body));
    });
  }, Promise.resolve()).then(function () {
    return fetch('/api/records?type=navigation').then(function (r) { return r.json(); }).then(function (rows) {
      NAV_ROWS.length = 0;
      Array.prototype.push.apply(NAV_ROWS, rows);
      applyNavigation();
    });
  });
}

// Back to the built-in layout.
function resetNavigation() {
  var changes = [];
  NAV_DEFAULT.forEach(function (g, gi) {
    changes.push({ id: g.id, sort: (gi + 1) * 10, visible: true, homeTile: g.homeTile !== false, label: g.label });
    g.screens.forEach(function (s, si) { changes.push({ id: s.key, parentId: g.id, sort: (si + 1) * 10 + gi * 100, visible: true, label: s.label }); });
  });
  return saveNavigation(changes);
}

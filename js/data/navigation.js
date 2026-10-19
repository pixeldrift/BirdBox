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

// Remember the built-in layout once, so "Reset" and re-applying always start from it.
var NAV_DEFAULT = NAV.map(function (g) {
  return { id: g.id, label: g.label, icon: g.icon, blurb: g.blurb, homeTile: g.homeTile, screens: g.screens.map(function (s) { return { id: s.id, label: s.label, icon: s.icon, blurb: s.blurb }; }) };
});

// Applies the table's order, names and visibility onto NAV, in place.
function applyNavigation() {
  var order = {};
  NAV.forEach(function (g) {
    var def = NAV_DEFAULT.filter(function (d) { return d.id === g.id; })[0];
    var row = navRow(g.id);
    g.label = row ? row.label : def.label;
    g.blurb = row && row.blurb ? row.blurb : def.blurb;
    g.homeTile = g.id === 'account' ? false : row ? !!(row.visible && row.homeTile) : def.homeTile;
    order[g.id] = row ? row.sort : NAV_DEFAULT.indexOf(def) * 10 + 10;
    var sorder = {};
    g.screens.forEach(function (s, i) {
      var sd = def.screens.filter(function (d) { return d.id === s.id; })[0];
      var srow = navRow(g.id + '/' + s.id);
      s.label = srow ? srow.label : sd.label;
      s.hidden = !!(srow && !srow.visible);
      sorder[s.id] = srow ? srow.sort : i * 10 + 10;
    });
    g.screens.sort(function (a, b) { return sorder[a.id] - sorder[b.id]; });
  });
  NAV.sort(function (a, b) { return order[a.id] - order[b.id]; });
}

// Saves a new order / visibility. changes: [{ id, sort?, visible?, homeTile?, label? }]
function saveNavigation(changes) {
  return changes.reduce(function (chain, c) {
    return chain.then(function () {
      var body = {};
      ['sort', 'visible', 'homeTile', 'label'].forEach(function (k) { if (c[k] !== undefined) body[k] = c[k]; });
      return recordsRequest('PATCH', 'navigation', c.id, body);
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
    g.screens.forEach(function (s, si) { changes.push({ id: g.id + '/' + s.id, sort: (si + 1) * 10, visible: true, label: s.label }); });
  });
  return saveNavigation(changes.filter(function (c) { return navRow(c.id); }));
}

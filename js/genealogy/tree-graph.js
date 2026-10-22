// The family-tree picture: the birds around your selection laid out with Dagre, each pairing a small dot
// between its parents and chicks. Pan with one finger or the mouse, pinch or scroll to zoom, tap a bird to
// select it. Adapted from the Tree of Birds project; works on pedigree nodes (js/genealogy/pedigree.js).
//
//   var g = TreeGraph.create(container, { onSelect: function (id) {} });
//   g.update({ nodes, selected: Set, show: { parents, siblings, offspring, consang } });  g.fit();
const TreeGraph = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  var pairKey = function (m, f) { return (m || '') + ':' + (f || ''); };
  var keyOf = function (b) { return pairKey(b.motherID, b.fatherID); };

  // Straight segments with rounded corners (or a smooth S-curve for two points).
  function smoothEdgePath(points) {
    if (!points.length) return '';
    if (points.length === 2) {
      var p0 = points[0], p1 = points[1], midY = (p0.y + p1.y) / 2;
      return 'M ' + p0.x + ' ' + p0.y + ' C ' + p0.x + ' ' + midY + ', ' + p1.x + ' ' + midY + ', ' + p1.x + ' ' + p1.y;
    }
    var R = 30;
    function toward(from, to, maxDist) {
      var len = Math.hypot(to.x - from.x, to.y - from.y);
      if (len === 0) return { x: from.x, y: from.y };
      var t = Math.min(maxDist, len / 2) / len;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    var d = 'M ' + points[0].x + ' ' + points[0].y;
    for (var i = 1; i < points.length - 1; i++) {
      var corner = points[i], entry = toward(corner, points[i - 1], R), exit = toward(corner, points[i + 1], R);
      d += ' L ' + entry.x + ' ' + entry.y + ' Q ' + corner.x + ' ' + corner.y + ', ' + exit.x + ' ' + exit.y;
    }
    var last = points[points.length - 1];
    return d + ' L ' + last.x + ' ' + last.y;
  }

  function create(container, opts) {
    var canvas = el('div', 'tg-canvas');
    container.appendChild(canvas);
    var view = { x: 0, y: 0, zoom: 1, w: 0, h: 0 };
    var last = null, focus = null;

    function apply() { canvas.style.transform = 'translate(' + view.x + 'px, ' + view.y + 'px) scale(' + view.zoom + ')'; }

    function zoomAround(cx, cy, factor) {
      var r = container.getBoundingClientRect();
      var x = cx - r.left, y = cy - r.top;
      var nz = Math.min(3, Math.max(0.08, view.zoom * factor));
      var ratio = nz / view.zoom;
      view.x = x - (x - view.x) * ratio;
      view.y = y - (y - view.y) * ratio;
      view.zoom = nz;
      apply();
    }

    function fit() {
      if (!view.w || !view.h) return;
      var r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var pad = 24;
      var s = Math.min((r.width - pad) / view.w, (r.height - pad) / view.h, 1.1);
      view.zoom = Math.max(s, 0.05);
      view.x = (r.width - view.w * view.zoom) / 2;
      view.y = (r.height - view.h * view.zoom) / 2;
      // A big tree would be too small to read: keep names legible and centre on the first selected bird.
      if (view.zoom < 0.6 && focus) {
        view.zoom = 0.6;
        view.x = r.width / 2 - focus.x * view.zoom;
        view.y = r.height / 2 - focus.y * view.zoom;
      }
      apply();
    }

    // ---- touch / mouse: one pointer pans, two pinch ----
    var pointers = {};
    var pan = null, pinch = null, moved = false;
    container.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      moved = false;
      if (ids.length === 1) pan = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
        pan = null;
      }
    });
    window.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length === 2 && pinch) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        zoomAround((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch.d);
        pinch.d = d;
        moved = true;
      } else if (pan && ids.length === 1) {
        var dx = e.clientX - pan.x, dy = e.clientY - pan.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        if (moved) { view.x = pan.vx + dx; view.y = pan.vy + dy; apply(); }
      }
    });
    function up(e) {
      delete pointers[e.pointerId];
      if (Object.keys(pointers).length < 2) pinch = null;
      if (!Object.keys(pointers).length) pan = null;
    }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    container.addEventListener('wheel', function (e) { e.preventDefault(); zoomAround(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });

    function update(state) {
      last = state;
      clearEl(canvas);
      view.w = 0; view.h = 0; focus = null;
      var nodes = state.nodes, selected = state.selected, show = state.show;
      if (!nodes.length || !selected.size) return false;
      var byId = Pedigree.index(nodes);

      var visible = {}, pairings = {};
      selected.forEach(function (selId) {
        var bird = byId[selId];
        if (!bird) return;
        visible[bird.id] = true;
        if ((show.parents || show.siblings) && (bird.motherID || bird.fatherID)) {
          var key = keyOf(bird);
          pairings[key] = { motherID: bird.motherID, fatherID: bird.fatherID };
          if (show.parents) { if (byId[bird.motherID]) visible[bird.motherID] = true; if (byId[bird.fatherID]) visible[bird.fatherID] = true; }
          if (show.siblings) nodes.forEach(function (c) { if (keyOf(c) === key) visible[c.id] = true; });
        }
        if (show.offspring) {
          nodes.forEach(function (c) {
            if (c.motherID === bird.id || c.fatherID === bird.id) {
              pairings[keyOf(c)] = { motherID: c.motherID, fatherID: c.fatherID };
              visible[c.id] = true;
              if (byId[c.motherID]) visible[c.motherID] = true;
              if (byId[c.fatherID]) visible[c.fatherID] = true;
            }
          });
        }
      });

      var g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: 'TB', nodesep: 18, ranksep: 46, marginx: 14, marginy: 14 });
      g.setDefaultEdgeLabel(function () { return {}; });
      Object.keys(visible).forEach(function (id) {
        var b = byId[id];
        var label = b.name || '(unnamed)';
        g.setNode(id, { width: Math.max(78, label.length * 6.6 + 24), height: 36, label: label, bird: b });
      });
      Object.keys(pairings).forEach(function (key) {
        var def = pairings[key];
        var consang = Pedigree.isConsanguineous(def.motherID, def.fatherID, byId);
        g.setNode(key, { width: 12, height: 12, pairing: true, consang: consang });
        if (def.motherID && visible[def.motherID]) g.setEdge(def.motherID, key);
        if (def.fatherID && visible[def.fatherID]) g.setEdge(def.fatherID, key);
        Object.keys(visible).forEach(function (cid) { if (keyOf(byId[cid]) === key) g.setEdge(key, cid); });
      });
      dagre.layout(g);

      var gr = g.graph();
      canvas.style.width = gr.width + 'px';
      canvas.style.height = gr.height + 'px';
      view.w = gr.width; view.h = gr.height;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'tg-edges');
      svg.setAttribute('width', gr.width);
      svg.setAttribute('height', gr.height);
      canvas.appendChild(svg);
      g.edges().forEach(function (e) {
        var edge = g.edge(e), target = g.node(e.w);
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', smoothEdgePath(edge.points));
        path.setAttribute('class', 'tg-edge' + (show.consang && target && target.pairing && target.consang ? ' consang' : ''));
        svg.appendChild(path);
      });
      g.nodes().forEach(function (id) {
        var n = g.node(id);
        if (n.pairing) {
          var dot = el('div', 'tg-pair' + (show.consang && n.consang ? ' consang' : ''));
          dot.style.left = (n.x - n.width / 2) + 'px';
          dot.style.top = (n.y - n.height / 2) + 'px';
          canvas.appendChild(dot);
          return;
        }
        var b = n.bird;
        if (!focus && selected.has(b.id)) focus = { x: n.x, y: n.y };
        var card = el('button', 'tg-node ' + (b.sex === 'F' ? 'female' : b.sex === 'M' ? 'male' : '') + (selected.has(b.id) ? ' selected' : ''));
        card.type = 'button';
        card.style.left = (n.x - n.width / 2) + 'px';
        card.style.top = (n.y - n.height / 2) + 'px';
        card.style.width = n.width + 'px';
        card.style.height = n.height + 'px';
        card.textContent = n.label;
        card.addEventListener('click', function () { if (!moved && opts.onSelect) opts.onSelect(b.id); });
        canvas.appendChild(card);
      });
      return true;
    }

    window.addEventListener('resize', function () { if (last) fit(); });
    return {
      update: function (state) { var ok = update(state); if (ok) fit(); return ok; },
      fit: fit,
      zoomBy: function (f) { var r = container.getBoundingClientRect(); zoomAround(r.left + r.width / 2, r.top + r.height / 2, f); },
    };
  }

  return { create: create };
})();

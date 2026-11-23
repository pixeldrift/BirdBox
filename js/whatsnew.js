// "What's new": the notes for each version of BirdBox, from changelog.json (newest first; add an entry there for every release).
//   - after an update, a bar offers a refresh AND a link to what changed (fetched fresh, since the old version on screen doesn't have the new notes)
//   - the first time you open a new version you're told what's new, once
//   - Account → About lists the recent versions
const WhatsNew = (function () {
  var SEEN_KEY = 'birdbox-seen-version';
  var cache = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // fresh: ask the server (not the phone's saved copy), for notes newer than this running version.
  function load(fresh) {
    if (cache && !fresh) return Promise.resolve(cache);
    return fetch('changelog.json' + (fresh ? '?fresh=' + Date.now() : ''))
      .then(function (res) { if (!res.ok) throw new Error('no notes'); return res.json(); })
      .then(function (list) { if (!fresh) cache = list; return list; })
      .catch(function () { return cache || []; });
  }

  function seen() { try { return localStorage.getItem(SEEN_KEY) || ''; } catch (e) { return ''; } }
  function markSeen(version) { try { localStorage.setItem(SEEN_KEY, version); } catch (e) { /* just shows again next time */ } }

  function entryEl(e) {
    var box = el('div', 'whatsnew-entry');
    var head = el('div', 'whatsnew-head');
    head.appendChild(el('strong', '', e.title));
    head.appendChild(el('span', 'whatsnew-date', formatDate(e.date)));
    box.appendChild(head);
    var ul = el('ul', 'about-list');
    (e.notes || []).forEach(function (n) { ul.appendChild(el('li', '', n)); });
    box.appendChild(ul);
    return box;
  }

  // The notes in a popup. entries: how many versions to show (default 1).
  function open(entries, count) {
    Modal.open({
      title: 'What’s new',
      build: function (body) {
        var list = (entries || []).slice(0, count || 1);
        if (!list.length) body.appendChild(el('p', 'form-note', 'Nothing to show right now.'));
        list.forEach(function (e) { body.appendChild(entryEl(e)); });
      },
    });
  }

  // For About: the recent versions, newest first.
  function section(wrapper) {
    var box = el('div', 'detail-section');
    box.appendChild(el('h3', '', 'What’s new'));
    var inner = el('div');
    box.appendChild(inner);
    load().then(function (list) {
      if (!list.length) { box.style.display = 'none'; return; }
      list.slice(0, 3).forEach(function (e) { inner.appendChild(entryEl(e)); });
    });
    wrapper.appendChild(box);
  }

  // Once, the first time a new version is opened (never on the very first visit).
  function announce() {
    load().then(function (list) {
      if (!list.length) return;
      var latest = list[0].version, before = seen();
      markSeen(latest);
      if (!before || before === latest) return;
      var bar = el('div', 'whatsnew-bar');
      bar.appendChild(el('span', '', 'BirdBox was updated.'));
      var see = el('button', 'whatsnew-link', 'See what’s new');
      see.type = 'button';
      see.addEventListener('click', function () { bar.remove(); open(list, 1); });
      var x = el('button', 'whatsnew-x', '✕');
      x.type = 'button';
      x.setAttribute('aria-label', 'Dismiss');
      x.addEventListener('click', function () { bar.remove(); });
      bar.appendChild(see);
      bar.appendChild(x);
      document.body.appendChild(bar);
    });
  }

  return { load: load, open: open, section: section, announce: announce };
})();

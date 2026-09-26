(function () {
  var appTitle = document.getElementById('app-title');
  var backBtn = document.getElementById('back-btn');
  var tabBar = document.getElementById('tab-bar');
  var main = document.getElementById('main-content');

  function findGroup(id) {
    for (var i = 0; i < NAV.length; i++) {
      if (NAV[i].id === id) return NAV[i];
    }
    return null;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderHome() {
    backBtn.hidden = true;
    tabBar.hidden = true;
    clear(tabBar);
    appTitle.textContent = 'BirdBox';
    document.title = 'BirdBox';

    clear(main);
    var grid = document.createElement('div');
    grid.className = 'home-grid';

    NAV.forEach(function (group) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'home-tile';
      tile.setAttribute('aria-label', group.label);

      var iconWrap = document.createElement('span');
      iconWrap.className = 'home-tile-icon';
      iconWrap.style.background = group.tint;
      var img = document.createElement('img');
      img.src = group.icon;
      img.alt = '';
      iconWrap.appendChild(img);

      var label = document.createElement('span');
      label.className = 'home-tile-label';
      label.textContent = group.label;

      tile.appendChild(iconWrap);
      tile.appendChild(label);
      tile.addEventListener('click', function () {
        location.hash = '#/' + group.id;
      });
      grid.appendChild(tile);
    });

    main.appendChild(grid);
  }

  function renderGroup(group, screenId) {
    backBtn.hidden = false;
    appTitle.textContent = group.label;
    document.title = 'BirdBox — ' + group.label;

    var activeScreen = null;
    for (var i = 0; i < group.screens.length; i++) {
      if (group.screens[i].id === screenId) { activeScreen = group.screens[i]; break; }
    }
    if (!activeScreen) activeScreen = group.screens[0];

    tabBar.hidden = false;
    clear(tabBar);
    group.screens.forEach(function (screen) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'tab' + (screen.id === activeScreen.id ? ' active' : '');
      tab.textContent = screen.label;
      tab.addEventListener('click', function () {
        location.hash = '#/' + group.id + '/' + screen.id;
      });
      tabBar.appendChild(tab);
    });

    clear(main);
    var panel = document.createElement('div');
    panel.className = 'screen-panel';

    var iconWrap = document.createElement('div');
    iconWrap.className = 'screen-icon';
    iconWrap.style.background = group.tint;
    var img = document.createElement('img');
    img.src = activeScreen.icon;
    img.alt = '';
    iconWrap.appendChild(img);

    var h2 = document.createElement('h2');
    h2.textContent = activeScreen.label;

    var p = document.createElement('p');
    p.textContent = activeScreen.blurb;

    var note = document.createElement('p');
    note.className = 'screen-placeholder-note';
    note.textContent = 'Screen not built yet — this is a navigation placeholder.';

    panel.appendChild(iconWrap);
    panel.appendChild(h2);
    panel.appendChild(p);
    panel.appendChild(note);
    main.appendChild(panel);

    var activeTab = tabBar.querySelector('.tab.active');
    if (activeTab && activeTab.scrollIntoView) {
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }

  function route() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (!hash) {
      renderHome();
      return;
    }
    var parts = hash.split('/');
    var group = findGroup(parts[0]);
    if (!group) {
      renderHome();
      return;
    }
    renderGroup(group, parts[1]);
  }

  backBtn.addEventListener('click', function () {
    location.hash = '';
  });
  window.addEventListener('hashchange', route);

  route();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();

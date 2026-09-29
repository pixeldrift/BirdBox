(function () {
  var appTitle = document.getElementById('app-title');
  var backBtn = document.getElementById('back-btn');
  var avatarBtn = document.getElementById('avatar-btn');
  var tabBar = document.getElementById('tab-bar');
  var main = document.getElementById('main-content');

  function findGroup(id) {
    for (var i = 0; i < NAV.length; i++) {
      if (NAV[i].id === id) return NAV[i];
    }
    return null;
  }

  // Routes with a real screen (list/detail UI) instead of the generic
  // nav placeholder, keyed by "groupId/screenId".
  var CUSTOM_SCREENS = {
    'mybirds/birds': typeof BirdsScreen !== 'undefined' ? BirdsScreen : null,
    'mybirds/health': typeof HealthScreen !== 'undefined' ? HealthScreen : null,
    'aviary/caging': typeof CagingScreen !== 'undefined' ? CagingScreen : null,
    'registry/search': typeof RegistrySearchScreen !== 'undefined' ? RegistrySearchScreen : null,
    'registry/register': typeof RegistryManageScreen !== 'undefined' ? RegistryManageScreen : null,
    'business/contacts': typeof ContactsScreen !== 'undefined' ? ContactsScreen : null,
    'business/accounting': typeof AccountingScreen !== 'undefined' ? AccountingScreen : null,
    'business/shipping': typeof ShippingScreen !== 'undefined' ? ShippingScreen : null,
    'account/settings': typeof SettingsScreen !== 'undefined' ? SettingsScreen : null,
    'business/reports': typeof ReportsScreen !== 'undefined' ? ReportsScreen : null,
  };

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

    NAV.filter(function (group) { return group.homeTile !== false; }).forEach(function (group) {
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

  function renderGroup(group, screenId, recordId) {
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

    var custom = CUSTOM_SCREENS[group.id + '/' + activeScreen.id];
    if (custom) {
      var navigateToRecord = function (recId) {
        location.hash = '#/' + group.id + '/' + activeScreen.id + '/' + recId;
      };
      var setTitle = function (text) {
        appTitle.textContent = text;
        document.title = 'BirdBox — ' + text;
      };
      if (recordId) {
        custom.renderDetail(main, recordId, navigateToRecord, setTitle);
      } else {
        custom.renderList(main, navigateToRecord);
      }

      var activeCustomTab = tabBar.querySelector('.tab.active');
      if (activeCustomTab && activeCustomTab.scrollIntoView) {
        activeCustomTab.scrollIntoView({ inline: 'center', block: 'nearest' });
      }
      return;
    }

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
    note.textContent = 'Coming soon.';

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
    renderGroup(group, parts[1], parts[2]);
  }

  backBtn.addEventListener('click', function () {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/').filter(Boolean);
    if (parts.length >= 3) {
      location.hash = '#/' + parts[0] + '/' + parts[1];
    } else {
      location.hash = '';
    }
  });
  avatarBtn.addEventListener('click', function () {
    location.hash = '#/account';
  });
  window.addEventListener('hashchange', route);

  main.textContent = 'Loading…';
  birdsLoaded.then(route);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();

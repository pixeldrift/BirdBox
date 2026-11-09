// Logins. If js/auth-config.js defines window.BirdBoxAuth, every /api call carries the signed-in user's token, the app waits for
// the account to exist before loading anything (the first sign-in creates it), and a signed-out visitor sees a sign-in screen.
// Without it nothing changes: no logins, one account.
//
//   Auth.enabled        true when logins are configured          Auth.account   { id, name }  (after sign-in)
//   Auth.me             { userId, role, name } or null           Auth.ready     a promise that settles once we know who is here
//   Auth.refresh()      re-read the account (after renaming or loading sample data)
const Auth = (function () {
  var provider = window.BirdBoxAuth || null;
  var origFetch = window.fetch.bind(window);
  var api = { enabled: !!provider, account: null, me: null, demo: null, ready: null };
  var gateShown = false;

  function showSignIn(message) {
    if (gateShown) return;
    gateShown = true;
    var gate = document.createElement('div');
    gate.className = 'auth-gate';
    var card = document.createElement('div');
    card.className = 'auth-card';
    card.innerHTML = '<h1 class="auth-title">Bird<span>Box</span></h1><p class="auth-text"></p><button type="button" class="save-btn auth-btn">Sign in</button>';
    card.querySelector('.auth-text').textContent = message || 'Sign in to see your birds.';
    card.querySelector('.auth-btn').addEventListener('click', function () { provider.signIn(); });
    gate.appendChild(card);
    document.body.appendChild(gate);
  }

  function withToken(init) {
    return Promise.resolve(provider.getToken()).then(function (token) {
      init = Object.assign({}, init || {});
      init.headers = Object.assign({}, init.headers || {});
      if (token) init.headers['x-stack-access-token'] = token;
      return { init: init, token: token };
    });
  }

  function profile() {
    return withToken({}).then(function (t) {
      if (!t.token) { showSignIn(); return new Promise(function () { /* wait here until they sign in (the page reloads) */ }); }
      return origFetch('/api/account', t.init).then(function (res) {
        if (res.status === 401) { showSignIn('Your session has ended — please sign in again.'); return new Promise(function () {}); }
        if (!res.ok) throw new Error('Could not open your account');
        return res.json();
      });
    }).then(function (p) {
      api.account = p.account; api.me = p.me; api.demo = p.demo;
      try { if (p.me && p.me.userId) localStorage.setItem('birdbox-me', p.me.userId); } catch (e) { /* storage blocked */ }
      return p;
    });
  }

  if (provider) {
    api.ready = profile();
    api.refresh = function () { return profile(); };
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (!/^\/?api\//.test(url) || /^\/?api\/account\b/.test(url)) {
        // the account call itself needs a token but must not wait for itself
        if (/^\/?api\/account\b/.test(url)) return withToken(init).then(function (t) { return origFetch(input, t.init); });
        return origFetch(input, init);
      }
      return api.ready.then(function () { return withToken(init); }).then(function (t) {
        return origFetch(input, t.init).then(function (res) {
          if (res.status === 401) showSignIn('Your session has ended — please sign in again.');
          return res;
        });
      });
    };
    api.signOut = function () { provider.signOut(); };
    api.email = function () { return provider.email ? provider.email() : ''; };
  } else {
    api.ready = Promise.resolve(null);
    api.refresh = function () { return origFetch('/api/account').then(function (r) { return r.ok ? r.json() : null; }).then(function (p) { if (p) { api.account = p.account; api.me = p.me; api.demo = p.demo; } return p; }).catch(function () { return null; }); };
    api.signOut = function () {};
    api.email = function () { return ''; };
  }
  return api;
})();

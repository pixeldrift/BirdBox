// Logins. BirdBox signs in the same way Lilac does: Neon Auth (managed Better Auth) through the app's own domain (/api/auth, see
// api/authproxy.js), and every API call carries the short-lived JWT it hands out, as `Authorization: Bearer …`.
//
// Nothing to configure here. On load we ask the server whether logins are on (it answers 401 'signin' when they are); if not, the
// app runs exactly as before with one account. If they are, the Neon Auth client (js/vendor/neon-auth.js) is loaded, the app
// waits until we know who is here (the first sign-in creates the account), and signed-out visitors get a sign-in form.
// A page can bring its own provider by defining window.BirdBoxAuth first (used by tests).
//
//   Auth.enabled        true when logins are on                   Auth.account   { id, name }  (after sign-in)
//   Auth.me             { userId, role, name } or null            Auth.ready     a promise that settles once we know who is here
//   Auth.refresh()      re-read the account (after renaming or loading sample data)
const Auth = (function () {
  var origFetch = window.fetch.bind(window);
  var provider = window.BirdBoxAuth || null;
  var api = { enabled: false, account: null, me: null, demo: null, ready: null };
  var gateShown = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  // The Neon Auth client, talking to /api/auth on this site (which passes it on to the auth service, so its cookie is first-party).
  function neonProvider() {
    return loadScript('js/vendor/neon-auth.js').then(function () {
      var client = window.NeonAuth.createAuthClient(location.origin + '/api/auth');
      var known = { email: '', name: '' };
      function check(result, fallback) {
        if (result && result.error) throw new Error(result.error.message || fallback);
        return result;
      }
      return {
        form: true,
        // The session carries the JWT in session.token (the client caches it until it nears expiry); `force` skips that cache.
        getToken: function (force) {
          return Promise.resolve(client.getSession(force ? { fetchOptions: { headers: { 'X-Force-Fetch': '1' } } } : undefined)).then(function (res) {
            var data = res && res.data;
            if (!data || !data.user) return null;
            known.email = data.user.email || ''; known.name = data.user.name || '';
            return (data.session && data.session.token) || null;
          }).catch(function () { return null; });
        },
        signInWithEmail: function (email, password) { return Promise.resolve(client.signIn.email({ email: email, password: password })).then(function (r) { return check(r, 'Couldn’t sign in'); }); },
        signUpWithEmail: function (email, password, name) { return Promise.resolve(client.signUp.email({ email: email, password: password, name: name || email.split('@')[0] })).then(function (r) { return check(r, 'Couldn’t create the account'); }); },
        signOut: function () { return Promise.resolve(client.signOut()).catch(function () {}).then(function () { location.reload(); }); },
        email: function () { return known.email; },
      };
    });
  }

  // Email + password: one form that switches between signing in and creating an account.
  function signInForm() {
    var creating = false;
    var form = document.createElement('form');
    form.className = 'auth-form';
    var name = document.createElement('input');
    name.type = 'text'; name.placeholder = 'Your name'; name.autocomplete = 'name'; name.className = 'form-input'; name.hidden = true;
    var email = document.createElement('input');
    email.type = 'email'; email.placeholder = 'Email'; email.autocomplete = 'email'; email.required = true; email.className = 'form-input';
    var pass = document.createElement('input');
    pass.type = 'password'; pass.placeholder = 'Password'; pass.autocomplete = 'current-password'; pass.required = true; pass.minLength = 8; pass.className = 'form-input';
    var error = document.createElement('p');
    error.className = 'form-message error'; error.hidden = true;
    var go = document.createElement('button');
    go.type = 'submit'; go.className = 'save-btn auth-btn'; go.textContent = 'Sign in';
    var toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'pick-link auth-toggle'; toggle.textContent = 'New here? Create an account';
    [name, email, pass, error, go].forEach(function (e) { form.appendChild(e); });
    if (provider.google && provider.signInWithGoogle) {
      var g = document.createElement('button');
      g.type = 'button'; g.className = 'add-record-btn auth-google'; g.textContent = 'Continue with Google';
      g.addEventListener('click', function () { provider.signInWithGoogle(); });
      form.appendChild(g);
    }
    form.appendChild(toggle);
    toggle.addEventListener('click', function () {
      creating = !creating;
      name.hidden = !creating;
      go.textContent = creating ? 'Create account' : 'Sign in';
      pass.autocomplete = creating ? 'new-password' : 'current-password';
      toggle.textContent = creating ? 'Already have an account? Sign in' : 'New here? Create an account';
      error.hidden = true;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      error.hidden = true;
      go.disabled = true;
      var job = creating ? provider.signUpWithEmail(email.value.trim(), pass.value, name.value.trim()) : provider.signInWithEmail(email.value.trim(), pass.value);
      job.then(function () { location.reload(); }).catch(function (err) {
        go.disabled = false;
        error.textContent = (err && err.message) || 'That didn’t work — try again.';
        error.hidden = false;
      });
    });
    return form;
  }

  // Signed in, but our own server couldn't open the account: say why, with a way to retry or sign out.
  function showProblem(detail) {
    if (gateShown) return;
    gateShown = true;
    var gate = document.createElement('div');
    gate.className = 'auth-gate';
    var card = document.createElement('div');
    card.className = 'auth-card';
    card.innerHTML = '<h1 class="auth-title">Bird<span>Box</span></h1><p class="auth-text">Something went wrong opening your account.</p><p class="form-note auth-detail"></p>';
    card.querySelector('.auth-detail').textContent = detail;
    var retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'save-btn auth-btn'; retry.textContent = 'Try again';
    retry.addEventListener('click', function () { location.reload(); });
    var out = document.createElement('button');
    out.type = 'button'; out.className = 'add-record-btn auth-btn'; out.textContent = 'Sign out';
    out.addEventListener('click', function () { if (provider && provider.signOut) provider.signOut(); else location.reload(); });
    card.appendChild(retry);
    card.appendChild(out);
    gate.appendChild(card);
    document.body.appendChild(gate);
  }

  function showSignIn(message) {
    if (gateShown) return;
    gateShown = true;
    var gate = document.createElement('div');
    gate.className = 'auth-gate';
    var card = document.createElement('div');
    card.className = 'auth-card';
    card.innerHTML = '<h1 class="auth-title">Bird<span>Box</span></h1><p class="auth-text"></p>';
    card.querySelector('.auth-text').textContent = message || 'Sign in to see your birds.';
    if (provider.signInWithEmail) card.appendChild(signInForm());
    else {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'save-btn auth-btn'; btn.textContent = 'Sign in';
      btn.addEventListener('click', function () { provider.signIn(); });
      card.appendChild(btn);
    }
    gate.appendChild(card);
    document.body.appendChild(gate);
  }


  function withToken(init, force) {
    return Promise.resolve(provider.getToken(force)).then(function (token) {
      init = Object.assign({}, init || {});
      init.headers = Object.assign({}, init.headers || {});
      if (token) init.headers.Authorization = 'Bearer ' + token;
      return { init: init, token: token };
    });
  }

  function profile() {
    return withToken({}).then(function (t) {
      if (!t.token) { showSignIn(); return new Promise(function () { /* wait here until they sign in (the page reloads) */ }); }
      return origFetch('/api/account', t.init).then(function (res) {
        if (res.status === 401) { showSignIn('Your session has ended — please sign in again.'); return new Promise(function () {}); }
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (b) {
            showProblem((b.error || 'Could not open your account') + (b.detail ? ' — ' + b.detail : '') + (b.code ? ' (' + b.code + ')' : ''));
            return new Promise(function () { /* stay on the message */ });
          });
        }
        return res.json();
      });
    }).then(function (p) {
      api.account = p.account; api.me = p.me; api.demo = p.demo;
      try { if (p.me && p.me.userId) localStorage.setItem('birdbox-me', p.me.userId); } catch (e) { /* storage blocked */ }
      return p;
    });
  }

  function isApi(url) { return /^\/?api\//.test(url) && !/^\/?api\/auth\b/.test(url); }
  function isAccount(url) { return /^\/?api\/account\b/.test(url); }

  // Everything starts here: are logins on?
  api.ready = (provider ? Promise.resolve(true) : origFetch('/api/account').then(function (res) { return res.status === 401; }).catch(function () { return false; }))
    .then(function (on) {
      api.enabled = on;
      if (!on) return null;
      return (provider ? Promise.resolve(provider) : neonProvider()).then(function (p) { provider = p; return profile(); });
    });

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!isApi(url)) return origFetch(input, init);
    var go = function () {
      if (!api.enabled) return origFetch(input, init);
      return withToken(init).then(function (t) {
        return origFetch(input, t.init).then(function (res) {
          if (res.status !== 401) return res;
          // the token may have just expired: ask the session for a fresh one once before giving up
          return withToken(init, true).then(function (t2) {
            if (!t2.token) { showSignIn('Your session has ended — please sign in again.'); return res; }
            return origFetch(input, t2.init).then(function (res2) { if (res2.status === 401) showSignIn('Your session has ended — please sign in again.'); return res2; });
          });
        });
      });
    };
    // the account call decides who is here, so it can't wait for itself
    return isAccount(url) ? go() : api.ready.then(go);
  };

  api.refresh = function () {
    return api.ready.then(function () {
      if (api.enabled) return profile();
      return origFetch('/api/account').then(function (r) { return r.ok ? r.json() : null; }).then(function (p) { if (p) { api.account = p.account; api.me = p.me; api.demo = p.demo; } return p; }).catch(function () { return null; });
    });
  };
  api.signOut = function () { if (provider && provider.signOut) provider.signOut(); };
  api.email = function () { return provider && provider.email ? provider.email() : ''; };
  return api;
})();

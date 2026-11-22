// Logins, via Neon Auth. Paste your auth URL below — the same value as VITE_NEON_AUTH_URL in your other apps, e.g.
//   https://ep-xxx.neonauth.<region>.aws.neon.tech/neondb/auth
// Leave it empty and BirdBox runs without logins, exactly as before (everything is one account).
//
// To turn logins on:
//   1. Put the URL here, and set these in the Vercel project's environment:
//        AUTH_MODE=neon     NEON_AUTH_URL=<the same URL>     LEGACY_OWNER_EMAIL=<the email you'll sign in with>
//      (LEGACY_OWNER_EMAIL: that login takes over the data that existed before accounts; everyone else gets a fresh account.)
//   2. In the Neon console (Auth → Settings) add this site's address to the trusted domains.
//   3. Deploy. Visitors who aren't signed in see a sign-in / create-account form.
//
// The Neon Auth client is bundled in js/vendor/neon-auth.js (see scripts/build-neon-auth.md).
window.BIRDBOX_NEON_AUTH_URL = '';
window.BIRDBOX_GOOGLE_SIGN_IN = false; // true to show "Continue with Google" (set Google up in the Neon console first)

(function () {
  var url = window.BIRDBOX_NEON_AUTH_URL;
  if (!url || !window.NeonAuth) return; // no logins configured
  var client = window.NeonAuth.createAuthClient(url);
  var known = { email: '', name: '' };

  function fail(result, fallback) {
    if (result && result.error) throw new Error(result.error.message || fallback);
    return result;
  }

  window.BirdBoxAuth = {
    form: true,
    google: !!window.BIRDBOX_GOOGLE_SIGN_IN,
    // The signed-in user's JWT (what our API checks), or null when signed out.
    getToken: function () {
      return Promise.resolve(client.getSession()).then(function (res) {
        var data = res && res.data;
        if (!data || !data.user) return null;
        known.email = data.user.email || ''; known.name = data.user.name || '';
        var token = typeof client.getJWTToken === 'function' ? client.getJWTToken() : (data.session && data.session.token);
        return Promise.resolve(token).then(function (t) { return t || (data.session && data.session.token) || null; });
      }).catch(function () { return null; });
    },
    signInWithEmail: function (email, password) { return Promise.resolve(client.signIn.email({ email: email, password: password })).then(function (r) { return fail(r, 'Couldn’t sign in'); }); },
    signUpWithEmail: function (email, password, name) { return Promise.resolve(client.signUp.email({ email: email, password: password, name: name || email.split('@')[0] })).then(function (r) { return fail(r, 'Couldn’t create the account'); }); },
    signInWithGoogle: function () { return client.signIn.social({ provider: 'google', callbackURL: location.origin + location.pathname }); },
    signOut: function () { return Promise.resolve(client.signOut()).then(function () { location.reload(); }); },
    email: function () { return known.email; },
  };
})();

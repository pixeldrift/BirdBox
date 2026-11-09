// Where you plug in your login provider (Neon Auth / Stack Auth). Leave it empty and BirdBox runs without logins, exactly as
// before — everything is one account. To turn logins on:
//   1. Set these in the Vercel project's environment:   AUTH_MODE=stack   STACK_PROJECT_ID=<your project id>
//      (and, once, LEGACY_OWNER_EMAIL=<the email you'll sign in with> so you take over the data that existed before accounts).
//   2. Define window.BirdBoxAuth here — it's all the app needs from the login library:
//
//      window.BirdBoxAuth = {
//        getToken: function () { return Promise.resolve(/* the signed-in user's access token, or null when signed out */); },
//        signIn:   function () { /* send the person to your sign-in / sign-up screen */ },
//        signOut:  function () { /* sign out, then reload */ },
//        email:    function () { return ''; },   // optional: shown in Settings → Your account
//      };
//
//   With Stack Auth's JS client that looks roughly like:
//      var app = new StackClientApp({ projectId: '…', publishableClientKey: '…', tokenStore: 'cookie' });
//      window.BirdBoxAuth = {
//        getToken: function () { return app.getUser().then(function (u) { return u ? u.getAuthJson().then(function (j) { return j.accessToken; }) : null; }); },
//        signIn: function () { app.redirectToSignIn(); }, signOut: function () { app.getUser().then(function (u) { return u && u.signOut(); }).then(function () { location.reload(); }); },
//      };
//   (BirdBox sends the token in the x-stack-access-token header; the server checks it against your project's public keys.)

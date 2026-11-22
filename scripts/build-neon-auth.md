# Rebuilding js/vendor/neon-auth.js

BirdBox has no build step, so the Neon Auth client (`@neon/auth`) is bundled once into a single browser file, `js/vendor/neon-auth.js`,
which defines `window.NeonAuth = { createAuthClient }`. To rebuild after an SDK update, in a scratch folder (not in the repo):

    npm init -y && npm install @neon/auth esbuild
    printf "import { createAuthClient } from '@neon/auth';\nwindow.NeonAuth = { createAuthClient: createAuthClient };\n" > entry.js
    npx esbuild entry.js --bundle --minify --format=iife --platform=browser --target=es2019 --outfile=neon-auth.js

then copy `neon-auth.js` over `js/vendor/neon-auth.js` and bump the cache version in `sw.js`. (Bundled with @neon/auth 0.8.2.)

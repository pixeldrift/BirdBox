# Rebuilding js/vendor/neon-auth.js

BirdBox has no build step, so the Neon Auth client (`@neondatabase/auth`) is bundled once into a single browser file, `js/vendor/neon-auth.js`,
which defines `window.NeonAuth = { createAuthClient }`. To rebuild after an SDK update, in a scratch folder (not in the repo):

    npm init -y && npm install @neondatabase/auth@0.6.0-beta esbuild
    printf "import { createAuthClient } from '@neondatabase/auth';\nwindow.NeonAuth = { createAuthClient: createAuthClient };\n" > entry.js
    npx esbuild entry.js --bundle --minify --format=iife --platform=browser --target=es2019 --outfile=neon-auth.js

then copy `neon-auth.js` over `js/vendor/neon-auth.js` and bump the cache version in `sw.js`. (Bundled with @neondatabase/auth 0.6.0-beta — the same package Lilac uses.)

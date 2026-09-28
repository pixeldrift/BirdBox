const CACHE = 'birdbox-shell-v8';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/nav-data.js',
  './js/ui-helpers.js',
  './js/data/icon-taxonomy.js',
  './js/data/birds-sample.js',
  './js/data/contacts-sample.js',
  './js/data/transactions-sample.js',
  './js/data/health-sample.js',
  './js/data/buildings-sample.js',
  './js/data/waybills-sample.js',
  './js/screens/birds.js',
  './js/screens/contacts.js',
  './js/screens/accounting.js',
  './js/screens/health.js',
  './js/screens/caging.js',
  './js/screens/shipping.js',
  './js/screens/reports.js',
  './js/screens/registry.js',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

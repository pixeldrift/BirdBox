const CACHE = 'birdbox-shell-v35';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/nav-data.js',
  './js/ui-helpers.js',
  './js/csv.js',
  './js/data/icon-species-birdorable.js',
  './js/data/icon-taxonomy.js',
  './js/data/species.js',
  './js/data/credits.js',
  './js/data/about.js',
  './js/data/birds-sample.js',
  './js/data/contacts-sample.js',
  './js/data/transactions-sample.js',
  './js/data/health-sample.js',
  './js/data/buildings-sample.js',
  './js/data/waybills-sample.js',
  './js/data/transfers-sample.js',
  './js/data/files.js',
  './js/data/record-schemas.js',
  './js/data/records.js',
  './js/species-picker.js',
  './js/modal.js',
  './js/picker.js',
  './js/files-ui.js',
  './js/relations.js',
  './js/ownership-prompt.js',
  './js/sold-followup.js',
  './js/taxonomy-navigator.js',
  './js/taxonomy-funnel.js',
  './js/media-picker.js',
  './js/bird-popups.js',
  './js/screens/birds-add.js',
  './js/screens/transfer.js',
  './js/screens/record-form.js',
  './js/screens/birds.js',
  './js/screens/contacts.js',
  './js/screens/accounting.js',
  './js/screens/health.js',
  './js/screens/caging.js',
  './js/screens/media.js',
  './js/screens/shipping-add.js',
  './js/screens/shipping.js',
  './js/screens/reports.js',
  './js/screens/registry.js',
  './js/screens/settings.js',
  './js/screens/credits.js',
  './js/screens/about.js',
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
  // Data and uploaded files always come straight from the server — serving them from the app
  // cache would show stale records (and miss anything saved since the last visit).
  if (new URL(event.request.url).pathname.startsWith('/api/')) return;
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

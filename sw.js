const CACHE_VERSION = 'v1'; // bump this on each deploy to invalidate old cache
const CACHE_NAME = `games-${CACHE_VERSION}`;

// Files that should always be cached on install (core shell)
const CORE_ASSETS = [
  '/',
  '/index.html',
];

// Install: pre-cache the core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // activate new SW immediately instead of waiting for old tabs to close
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('games-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim(); // take control of open pages right away
});

// Fetch: runtime cache for /assets/ and /g/, network passthrough for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const shouldCache =
    url.pathname.startsWith('/assets/') || url.pathname.startsWith('/g/');

  if (!shouldCache) return; // don't intercept — normal network request

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      // Stale-while-revalidate: serve cached immediately, update cache in background
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cached); // offline fallback if fetch fails

      return cached || fetchPromise;
    })
  );
});

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/indexedDB.js',
  '/manifest.webmanifest',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  // handle runtime GET requests for data from /api routes
  if (event.request.url.includes("/api/")) {
    // make network request and fallback to cache if network request fails (offline)
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }
  // use cache first for all other requests for performance
  event.respondWith(

      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request);
    });
  })
  );
});

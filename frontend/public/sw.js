const CACHE_NAME = "astrosoul-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/dashboard/natal-chart",
  "/dashboard/karmic-path",
  "/dashboard/mystic-depths",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached asset or fetch from network
      return (
        cached ||
        fetch(event.request).then((response) => {
          // Cache new requests for images
          if (event.request.url.match(/\.(webp|png|jpg|svg)$/)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

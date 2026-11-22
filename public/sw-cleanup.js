// Loaded by the service worker (next.config.ts). Earlier versions saved signed-in API responses
// in "cross-origin", keyed by URL alone, so delete that cache when this version takes over.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("cross-origin"));
});

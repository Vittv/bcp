// runtime-caching service worker for the GitHub Pages deployment.
// asset filenames are content-hashed by expo export, so anything under
// _expo/static/ and assets/ is immutable: cache-first is safe and keeps
// the app fully offline after one visit. the document and manifest go
// network-first with a cached fallback so a deploy's new bundle names take
// effect at once. registered only when not inside the tauri desktop shell
// (public/index.html skips registration there), because a stale worker
// inside the webview would keep serving an old embedded bundle after an
// app update on windows, where tauri serves http://tauri.localhost.
(() => {
  // dev bundles are unversioned, so a caching worker replays stale revisions and
  // loops reloads; a worker installed on a dev host uninstalls itself instead
  const isDev =
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1" ||
    self.location.port === "8081";
  if (isDev) {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", () => {
      self.registration.unregister();
    });
    return;
  }

  const VERSION = "v3";
  const CACHE = `bcp-${VERSION}`;

  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE));
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        for (const name of await caches.keys()) {
          if (name !== CACHE) await caches.delete(name);
        }
        await self.clients.claim();
      })(),
    );
  });

  function isImmutable(url) {
    return (
      url.pathname.includes("/_expo/static/") ||
      url.pathname.includes("/assets/") ||
      /\.(woff2?|png|svg|ico)$/.test(url.pathname)
    );
  }

  async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    const response = await fetch(request);
    // await the write: the worker can be stopped as soon as respondWith settles
    if (response.ok) await cache.put(request, response.clone());
    return response;
  }

  // the document names hashed bundles, so fetch fresh; the cache is offline-only
  async function networkFirst(request) {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      // await the write: the worker can be stopped as soon as respondWith settles
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  }

  self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== "GET" || url.origin !== location.origin) {
      return;
    }
    if (isImmutable(url)) {
      event.respondWith(cacheFirst(event.request));
      return;
    }
    // index.html and the manifest: network first, cache only when offline
    event.respondWith(networkFirst(event.request));
  });
})();

// runtime-caching service worker for the GitHub Pages deployment.
// asset filenames are content-hashed by expo export, so anything under
// _expo/static/ and assets/ is immutable: cache-first is safe and keeps
// the app fully offline after one visit. the document itself and the
// manifest are revalidated in the background so updates land on the
// next load. registered only when not inside the tauri desktop shell
// (public/index.html skips registration there), because a stale worker
// inside the webview would keep serving an old embedded bundle after an
// app update on windows, where tauri serves http://tauri.localhost.
const VERSION = "v1";
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

// the document and manifest revalidate in the background: the cached copy
// answers at once, so a launch never waits on a slow or absent network
async function refresh(request) {
  const cache = await caches.open(CACHE);
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function cacheThenRefresh(request, refreshed) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  return cached ?? refreshed;
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
  // index.html and the manifest: cached first, refreshed behind the scenes
  const refreshed = refresh(event.request);
  event.waitUntil(refreshed.catch(() => {}));
  event.respondWith(cacheThenRefresh(event.request, refreshed));
});

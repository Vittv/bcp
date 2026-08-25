// Runtime-caching service worker for the GitHub Pages deployment.
// Asset filenames are content-hashed by expo export, so anything under
// _expo/static/ and assets/ is immutable: cache-first is safe and keeps
// the app fully offline after one visit. The document itself and the
// manifest are revalidated in the background so updates land on the
// next load. Registered only when served from the /bcp/ Pages path;
// the desktop shell (tauri:// protocol) never hits this file.
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
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cache.match(request);
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) {
    return;
  }
  if (isImmutable(url)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    // index.html, manifest, sw itself: fresh when online, cached offline
    event.respondWith(networkFirst(event.request));
  }
});

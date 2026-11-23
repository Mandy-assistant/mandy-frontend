/* Mandy service worker: installable app, fast repeat loads, an offline page.
 *
 * - /api/* is never cached (personal data, always live).
 * - Build assets (/_next/static) are immutable: cache first.
 * - Images, fonts and icons: stale-while-revalidate, capped.
 * - Pages: network first (with navigation preload), then the last good copy, then /offline.
 */
const VERSION = "mandy-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const MEDIA = `${VERSION}-media`;
const PRECACHE = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];
const MEDIA_LIMIT = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC, PAGES, MEDIA]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const trim = async (name, max) => {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
};

const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
};

const staleWhileRevalidate = async (event) => {
  const cache = await caches.open(MEDIA);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(event.request, response.clone()).then(() => trim(MEDIA, MEDIA_LIMIT));
      }
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
};

const page = async (event) => {
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (response.ok && !response.redirected) (await caches.open(PAGES)).put(event.request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    return cached || (await caches.match("/offline")) || Response.error();
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) return; // always live
  if (request.mode === "navigate") return event.respondWith(page(event));
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"))
    return event.respondWith(cacheFirst(request));
  if (["image", "font"].includes(request.destination) || url.pathname.startsWith("/icons/"))
    return event.respondWith(staleWhileRevalidate(event));
});

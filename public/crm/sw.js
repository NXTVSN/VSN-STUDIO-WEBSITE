// VSN Leads — service worker: cache the app shell, never cache the API.
const CACHE = "vsn-crm-v1";
const SHELL = ["/crm/", "/crm/index.html", "/crm/style.css?v=1", "/crm/app.js?v=1", "/crm/manifest.webmanifest", "/crm/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return; // network only
  if (!url.pathname.startsWith("/crm")) return;
  // network-first for the shell so updates land immediately, cache fallback offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/crm/index.html")))
  );
});

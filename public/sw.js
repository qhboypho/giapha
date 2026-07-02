const CACHE_VERSION = "giapha-tc-pwa-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "/",
  "/site.webmanifest",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/tranconglogo.png"
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isApiRequest = (url) => (
  url.pathname.startsWith("/api/") ||
  url.pathname.startsWith("/cdn-cgi/")
);

const isStaticAsset = (request, url) => (
  request.destination === "style" ||
  request.destination === "script" ||
  request.destination === "image" ||
  request.destination === "font" ||
  url.pathname.startsWith("/assets/") ||
  url.pathname.endsWith(".css") ||
  url.pathname.endsWith(".js") ||
  url.pathname.endsWith(".png") ||
  url.pathname.endsWith(".jpg") ||
  url.pathname.endsWith(".jpeg") ||
  url.pathname.endsWith(".webp") ||
  url.pathname.endsWith(".svg") ||
  url.pathname.endsWith(".ico")
);

const isFreshAsset = (request, url) => (
  request.destination === "style" ||
  request.destination === "script" ||
  url.pathname.endsWith(".css") ||
  url.pathname.endsWith(".js")
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isSameOrigin(url) || isApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE)
            .then((cache) => cache.put("/", copy))
            .catch(() => undefined);
          return response;
        })
        .catch(() => caches.match("/") || Response.error())
    );
    return;
  }

  if (!isStaticAsset(request, url) && url.pathname !== "/site.webmanifest") return;

  if (isFreshAsset(request, url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(request) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(RUNTIME_CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => undefined);
        return response;
      });
    })
  );
});

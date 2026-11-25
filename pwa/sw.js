const CACHE_VERSION = "ngesrep-v32decfbd0d212b3f";

const SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "css/fonts.css",
  "manifest.json",
  "js/app.js",
  "js/api.js",
  "js/config.js",
  "js/favorites.js",
  "js/router.js",
  "js/ui.js",
  "js/pages/beranda.js",
  "js/pages/detailResep.js",
  "js/pages/tips.js",
  "js/pages/detailTips.js",
  "js/pages/favorit.js",
  "js/pages/profil.js",
  "js/pages/login.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "images/logo-full.png",
  "images/placeholder.svg",
  "fonts/plus-jakarta-sans.woff2",
  "fonts/material-symbols.woff2",
];

async function cacheResponse(request, response) {
  try {
    await (await caches.open(CACHE_VERSION)).put(request, response);
  } catch {
    // A cache quota or storage error must not fail a successful network response.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("ngesrep-v") && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Hanya menangani GET.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // js/api.js memegang satu-satunya salinan offline untuk data API.
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi halaman: coba jaringan, jika gagal pakai index.html dari cache.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("index.html", { cacheName: CACHE_VERSION })));
    return;
  }

  // Aset app shell lain (css, js, ikon): cache-first.
  if (url.origin === location.origin || url.pathname.includes("/images/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request, { cacheName: CACHE_VERSION }).catch(() => undefined);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cacheResponse(request, response.clone());
        return response;
      })()
    );
  }
});

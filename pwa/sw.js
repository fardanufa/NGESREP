const CACHE_VERSION = "ngesrep-v7";

// Samakan dengan API_BASE_URL di js/config.js.
const API_BASE_URL = "https://ngesrep-7xy6.vercel.app";

const SHELL = [
  "./",
  "index.html",
  "css/style.css",
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
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "images/logo-full.png",
  "images/placeholder.svg",
];

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
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Hanya menangani GET.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API: network-first, salinan disimpan untuk dipakai saat offline.
  if (request.url.startsWith(API_BASE_URL)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Gambar: cache-first.
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Google Fonts: stale-while-revalidate.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navigasi halaman: coba jaringan, jika gagal pakai index.html dari cache.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("index.html")));
    return;
  }

  // Aset app shell lain (css, js, ikon): cache-first.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});

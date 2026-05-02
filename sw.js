const CACHE = 'systeme-n-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icons-pack/icon-manga-180.png',
  './icons-pack/icon-manga-512.png',
  './icons-pack/icon-kawaii-180.png',
  './icons-pack/icon-kawaii-512.png',
  './icons-pack/icon-aesthetic-180.png',
  './icons-pack/icon-aesthetic-512.png',
  './icons-pack/icon-plush-180.png',
  './icons-pack/icon-plush-512.png'
];

// Libs externes à cacher pour offline (lazy au premier accès)
const EXT_CACHE = 'nonosworld-ext-libs-v1';
const EXT_DOMAINS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'tessdata.projectnaptha.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== EXT_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isExt = EXT_DOMAINS.some(d => url.hostname.includes(d));
  const cacheName = isExt ? EXT_CACHE : CACHE;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(cacheName).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

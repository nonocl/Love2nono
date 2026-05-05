const CACHE = 'love2nono-v71-pat2048';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icons-pack/icon-aesthetic-180.png',
  './icons-pack/icon-aesthetic-512.png',
  './icons-pack/icon-kawaii-180.png',
  './icons-pack/icon-kawaii-512.png',
  './icons-pack/icon-manga-180.png',
  './icons-pack/icon-manga-512.png',
  './icons-pack/icon-plush-180.png',
  './icons-pack/icon-plush-512.png'
];

const EXT_CACHE = 'nonosworld-ext-libs-v2';
const EXT_DOMAINS = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'tessdata.projectnaptha.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => { console.warn('SW install failed:', err); return self.skipWaiting(); })
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
  
  // Origin différente : passe-plat ou cache externe
  if (url.origin !== self.location.origin) {
    const isExt = EXT_DOMAINS.some(d => url.hostname.includes(d));
    if (isExt) {
      e.respondWith(
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(EXT_CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          }).catch(() => cached || new Response('', { status: 404 }));
        })
      );
    }
    return;
  }
  
  // === Pour les requêtes de NAVIGATION (HTML page), toujours servir index.html ===
  // C'est ce qui fixe le bug iOS où un mauvais fichier était servi en page principale
  if (e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      caches.match('./index.html').then((cached) => {
        if (cached) return cached;
        return fetch('./index.html').then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        }).catch(() => caches.match('./'));
      })
    );
    return;
  }
  
  // === Pour les autres ressources (images, JS, CSS) : cache-first standard ===
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached || new Response('', { status: 404 }));
    })
  );
});

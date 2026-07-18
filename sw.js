/* =============================================
   Seiko Glass — Service Worker v3.0
   (corrigido para GitHub Pages / index.html)
   ============================================= */

const CACHE_NAME = 'saldocred-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install — cache core assets (não quebra se um arquivo falhar)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] skip cache:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — rede primeiro, fallback no cache
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // só guarda respostas ok do mesmo origin
        if (response && response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          // fallback da SPA/PWA: se pediu página, devolve index
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        })
      )
  );
});

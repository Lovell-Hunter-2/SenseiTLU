const CACHE_NAME = 'senseitlu-cache-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Chỉ cache các request GET
  if (e.request.method !== 'GET') return;

  // Bỏ qua các request từ chrome-extension, API firebase, googleapis, ads, và file 3D .glb lớn
  if (
    e.request.url.startsWith('chrome-extension') ||
    e.request.url.includes('firestore.googleapis.com') ||
    e.request.url.includes('identitytoolkit.googleapis.com') ||
    e.request.url.includes('googlesyndication') ||
    e.request.url.includes('doubleclick') ||
    e.request.url.endsWith('.glb')
  ) {
    return;
  }

  // HTML Navigation: NETWORK-FIRST để luôn cập nhật bản mới nhất từ server
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static Assets: Cache-First with Network Fallback (never cache text/html SPA rewrites!)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const cachedType = cachedResponse?.headers.get('content-type') || '';
      if (cachedResponse && !cachedType.includes('text/html')) {
        // Cập nhật ngầm cache
        fetch(e.request).then((networkResponse) => {
          const netType = networkResponse?.headers.get('content-type') || '';
          if (networkResponse && networkResponse.status === 200 && !netType.includes('text/html')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        const netType = networkResponse?.headers.get('content-type') || '';
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic' ||
          netType.includes('text/html')
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        return new Response("Network error - You are offline");
      });
    })
  );
});

const CACHE_NAME = 'senseitlu-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
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

  // Bỏ qua các request từ chrome-extension, API firebase, googleapis
  if (
    e.request.url.startsWith('chrome-extension') ||
    e.request.url.includes('firestore.googleapis.com') ||
    e.request.url.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Trả về cache nếu có
      if (cachedResponse) {
        // Cập nhật ngầm cache
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Nếu không có cache, lấy từ mạng và cache lại
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Trả về trang offline hoặc lỗi nếu không kết nối được
        return new Response("Network error - You are offline");
      });
    })
  );
});

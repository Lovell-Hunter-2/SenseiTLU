self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Try network first, then cache (or simply network only for this dummy SW)
  e.respondWith(fetch(e.request).catch(() => new Response("Network error")));
});

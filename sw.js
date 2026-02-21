const cacheName = 'bizim-dunya-v1';
const assets = [
  '/',
  '/index.html',
  '/hcstil.css',
  '/hcayar.js',
  '/manifest.json',
  '/assets/192.png',
  '/assets/512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

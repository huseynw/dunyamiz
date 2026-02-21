const cacheName = 'bizim-dunya-v2';
const assets = [
  '/',
  '/index.html',
  '/hcstil.css',
  '/hcayar.js',
  '/manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('Fayllar kəşlənir...');
      return cache.addAll(assets);
    })
  );
  self.skipWaiting(); 
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== cacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

const CACHE='monnegoce-v58';
const ASSETS = ['./', './index.html', './commerce.html', './manifest-commerce.json', './icon-tayba-192.png', './icon-tayba-512.png', './apple-touch-icon-tayba.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => 
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request, {ignoreSearch: true}))   // ?app=commerce hors ligne
  );
});

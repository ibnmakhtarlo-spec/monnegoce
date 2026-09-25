/* Ajout Rapide Produits — service worker minimal.
   Réseau d'abord : cette app évolue souvent, on ne veut jamais qu'elle reste
   bloquée sur une ancienne version. Sert de copie hors-ligne uniquement en
   secours, si aucune connexion n'est disponible. */

const CACHE = 'mn-produits-v1';
const ESSENTIELS = ['./ajout-produits.html', './manifest-produits.json', './icon-produits-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ESSENTIELS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('firebaseio.com') || req.url.includes('googleapis.com') ||
      req.url.includes('gstatic.com') || req.url.includes('jsdelivr.net') ||
      req.url.includes('api.anthropic.com')) return;

  e.respondWith(
    fetch(req)
      .then(rep => {
        if (rep && rep.status === 200 && rep.type === 'basic') {
          const copie = rep.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
        }
        return rep;
      })
      .catch(() => caches.match(req).then(rep => rep || caches.match('./ajout-produits.html')))
  );
});

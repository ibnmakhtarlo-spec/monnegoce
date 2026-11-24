// FICHIER GÉNÉRÉ par outils/generer_tayba.py
const CACHE='tayba-v60';
const ASSETS=['./','./index.html','./manifest.json','./icon-tayba-192.png','./icon-tayba-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('tayba-')&&x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request,{ignoreSearch:true})));});

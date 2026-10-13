/* VenteFlow — service worker : application disponible même sans internet */
const V = 'vf-app-1';
const CDN = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];
const LOCAL = ['./manifest.webmanifest', './icon-192.png', './icon-512.png'];
const PAGE = new URL('./', self.location).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all([
    fetch(PAGE, { cache: 'no-store' }).then(r => { if (r.ok) return c.put(PAGE, r); }).catch(() => {}),
    ...LOCAL.map(u => c.add(u).catch(() => {})),
    ...CDN.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {}))
  ])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function fromNetworkFirst(req) {
  // Page : toujours la dernière version si internet répond en moins de 6 s, sinon la copie gardée
  return caches.open(V).then(c => {
    const net = fetch(req, { cache: 'no-store' }).then(r => {
      if (r.ok) { c.put(PAGE, r.clone()); return r; }
      return c.match(PAGE).then(m => m || r);
    });
    const slow = new Promise(res => setTimeout(() => c.match(PAGE).then(m => m && res(m)), 6000));
    return Promise.race([net.catch(() => c.match(PAGE).then(m => m || Response.error())), slow]);
  });
}

function fromCacheThenUpdate(req, key) {
  return caches.open(V).then(c => c.match(key || req, { ignoreVary: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(key || req, r.clone()); return r; });
    if (hit) { net.catch(() => {}); return hit; }
    return net;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
  if (/supabase\.co$/.test(u.hostname)) return; // données : jamais mises en cache ici
  if (req.mode === 'navigate' || (u.origin === self.location.origin && (u.pathname.endsWith('/') || u.pathname.endsWith('/index.html')))) {
    e.respondWith(fromNetworkFirst(req));
    return;
  }
  if (u.origin === self.location.origin) {
    if (u.pathname.endsWith('/sw.js')) return;
    e.respondWith(fromCacheThenUpdate(req));
    return;
  }
  if (/(^|\.)(jsdelivr\.net|cloudflare\.com|googleapis\.com|gstatic\.com)$/.test(u.hostname)) {
    e.respondWith(fromCacheThenUpdate(req, req.url));
  }
});

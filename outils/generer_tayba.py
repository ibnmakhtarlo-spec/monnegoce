#!/usr/bin/env python3
"""Génère l'application PWA séparée Tayba Telecom (dossier tayba/) à partir de index.html.
À relancer après CHAQUE modification de index.html :  python3 outils/generer_tayba.py
"""
import json, os, re, shutil
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(R, 'tayba'); os.makedirs(T, exist_ok=True)
s = open(os.path.join(R, 'index.html'), encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, 'introuvable : ' + a[:70]
    s = s.replace(a, b)
rep('<meta name="theme-color" content="#f0a500">', '<meta name="theme-color" content="#0b50e6">')
rep('<meta name="apple-mobile-web-app-title" content="Mon Négoce">', '<meta name="apple-mobile-web-app-title" content="Tayba Telecom">')
rep('<meta name="application-name" content="Mon Négoce">', '<meta name="application-name" content="Tayba Telecom">')
rep('<title>Mon Négoce Enterprise</title>', '<title>Tayba Telecom</title>')
s = re.sub(r"\(function\(\)\{var c=/\[\?&\]app=commerce.*?\}\}\)\(\);",
           "(function(){window.ESPACE='commerce';window.TAYBA_PWA=true;})();", s, count=1, flags=re.S)
assert "window.TAYBA_PWA=true" in s
rep("const autre=ESPACE==='commerce'?'./':'./tayba/';", "const autre=ESPACE==='commerce'?'../':'./tayba/';")
s = s.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- FICHIER GÉNÉRÉ par outils/generer_tayba.py depuis index.html : ne pas modifier à la main -->', 1)
open(os.path.join(T, 'index.html'), 'w', encoding='utf-8').write(s)
for src, dst in [('icon-tayba-192.png', 'icon-tayba-192.png'), ('icon-tayba-512.png', 'icon-tayba-512.png'),
                 ('apple-touch-icon-tayba.png', 'apple-touch-icon.png')]:
    shutil.copyfile(os.path.join(R, src), os.path.join(T, dst))
m = {"name": "Tayba Telecom", "short_name": "Tayba Telecom", "description": "Gestion commerciale Tayba Telecom",
     "id": "/monnegoce/tayba/", "start_url": "/monnegoce/tayba/", "scope": "/monnegoce/tayba/",
     "display": "standalone", "background_color": "#060910", "theme_color": "#0b50e6", "orientation": "any",
     "icons": [{"src": "icon-tayba-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
               {"src": "icon-tayba-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}
json.dump(m, open(os.path.join(T, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
v = re.search(r"const CACHE='monnegoce-v(\d+)'", open(os.path.join(R, 'sw.js')).read()).group(1)
open(os.path.join(T, 'sw.js'), 'w').write(f"""// FICHIER GÉNÉRÉ par outils/generer_tayba.py
const CACHE='tayba-v{v}';
const ASSETS=['./','./index.html','./manifest.json','./icon-tayba-192.png','./icon-tayba-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('tayba-')&&x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();}});
self.addEventListener('fetch',e=>{{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request,{{ignoreSearch:true}})));}});
""")
print('tayba/ généré (cache tayba-v' + v + ')')

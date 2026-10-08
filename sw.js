// Caches the app so it opens with no coverage.
// Bump VERSION whenever you change any app file, so phones pick up the new copy.
const VERSION = 'fpi-v14';
const FILES = ['./', './index.html', './app.js', './jspdf.umd.min.js', './firebase-config.js',
  './firebase-app-compat.js', './firebase-auth-compat.js', './firebase-firestore-compat.js', './firebase-storage-compat.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Firebase traffic goes straight to Google, never cached
  // Network first (so updates arrive when there is coverage), with a 4 s cut-off so weak signal falls back to the cache fast
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fallback = () => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html'));
    const timer = setTimeout(() => { if (!done) { done = true; resolve(fallback()); } }, 4000);
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      if (!done) { done = true; clearTimeout(timer); resolve(r); }
    }).catch(() => { if (!done) { done = true; clearTimeout(timer); resolve(fallback()); } });
  }));
});

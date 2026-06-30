/* Service worker — offline-speelbaar + installeerbaar (PWA)
   Strategie: network-first voor navigaties (index.html altijd vers → pakt nieuwe ?v= assets op),
   cache-first voor de rest, met runtime-caching van same-origin én CDN (opaque) zodat het
   na één online bezoek volledig offline werkt. */
const CACHE = 'hajj-cache-v7.16';   // BUMP per release → oude cache (incl. modellen/fonts zonder ?v=) wordt bij activate gepurged

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // navigaties: network-first (verse HTML), val terug op cache bij offline
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE); c.put(req, res.clone());
        return res;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // overige requests (js/css/glb/fonts/CDN): cache-first + runtime-cachen
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const c = await caches.open(CACHE); c.put(req, res.clone());
      }
      return res;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});

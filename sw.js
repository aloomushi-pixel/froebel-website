const CACHE_NAME = 'froebel-web-v2-1-51';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations, JSON, XML, TXT and API so content is never stale
  if (
    e.request.mode === 'navigate' ||
    url.pathname.startsWith('/api/') ||
    /\.(html|json|xml|txt)$/i.test(url.pathname) ||
    !url.pathname.includes('.')
  ) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Stale-while-revalidate for static media/fonts/scripts
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(e.request).then((cached) => {
        const fetched = fetch(e.request)
          .then((netRes) => {
            if (netRes && netRes.ok) cache.put(e.request, netRes.clone());
            return netRes;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    )
  );
});

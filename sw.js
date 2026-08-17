const CACHE_NAME = 'hifz-tracker-shell-v1';
const AUDIO_CACHE = 'audio-assets';
const ASSETS = [
  '/',
  '/index.html',
  '/build/bundle.css',
  '/build/bundle.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for audio requests: try network, cache copy, fallback to cache
  if (req.destination === 'audio' || /\.mp3$/.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(req);
        // clone and cache
        const cache = await caches.open(AUDIO_CACHE);
        try { cache.put(req, response.clone()); } catch (e) { /* ignore cache put errors */ }
        return response;
      } catch (err) {
        // network failed -> fallback to cache
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response('Audio unavailable', { status: 503 });
      }
    })());
    return;
  }

  // Default: cache-first for same-origin navigation/assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(resp => resp || fetch(req))
    );
  } else {
    // network-first for external requests
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});

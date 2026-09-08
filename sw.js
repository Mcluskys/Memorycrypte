const CACHE = 'memory-crypte-v2';
const CORE = [
  './', './index.html', './styles.css', './game.js',
  './assets/crypte.webp', './assets/cercueil-ferme.webp', './assets/cercueil-ouvert.webp',
  './assets/vampire.webp', './assets/sorciere.webp', './assets/zombie.webp',
  './assets/chauve-souris.webp', './assets/momie.webp', './assets/pieu.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCode = url.pathname.endsWith('/') || /\.(?:html|css|js)$/.test(url.pathname);

  if (isCode) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});

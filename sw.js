// ============================================================
//  Service Worker — Ma Cuisine PWA
//  👉 Change CACHE_VERSION à chaque mise à jour pour purger le cache
// ============================================================


const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `ma-cuisine-${CACHE_VERSION}`;

// Fichiers à mettre en cache au premier chargement
const ASSETS = [
  './',
  './index.html',
  './crepes.html',
  './ratatouille.html',
];

// ── Installation : mise en cache des assets ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())  // active immédiatement sans attendre
  );
});

// ── Activation : supprime les anciens caches ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('ma-cuisine-') && key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Suppression ancien cache : ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())  // prend le contrôle de tous les onglets ouverts
  );
});

// ── Fetch : Cache-first, fallback réseau ─────────────────────
self.addEventListener('fetch', event => {
  // On ignore les requêtes non-GET (POST, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → on fetch et on met en cache dynamiquement
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    }).catch(() => {
      // Hors ligne et pas en cache → page de fallback si dispo
      return caches.match('./index.html');
    })
  );
});

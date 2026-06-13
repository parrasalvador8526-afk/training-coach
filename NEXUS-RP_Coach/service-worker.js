/**
 * NEXUS-RP Coach - Service Worker
 * - Assets locales y CDN: cache-first (la app abre sin internet).
 * - Open Food Facts: stale-while-revalidate (el escáner y las sugerencias
 *   funcionan dentro del súper aunque se pierda la señal).
 */
const CACHE_VERSION = 'rp-coach-v4';
const STATIC_CACHE = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const OFF_CACHE = CACHE_VERSION + '-openfoodfacts';

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './css/rp-coach.css',
    './img/icon.svg',
    './img/icon-192.png',
    './img/icon-512.png',
    './js/rp-coach.js',
    './js/data/methodologies-sync.js',
    './js/data/alimentos-db.js',
    './js/data/tiendas-db.js',
    './js/modules/autoregulation.js',
    './js/modules/rir-dynamic.js',
    './js/modules/volume-mev-mrv.js',
    './js/modules/fatigue-heatmap.js',
    './js/modules/session-logger.js',
    './js/modules/progressive-overload.js',
    './js/modules/double-progression.js',
    './js/modules/enhanced-session-logger.js',
    './js/modules/training-templates.js',
    './js/modules/progress-charts.js',
    './js/modules/methodology-engine.js',
    './js/modules/autoregulation-engine.js',
    './js/modules/gate-check.js',
    './js/modules/routine-generator.js',
    './js/modules/active-workout.js',
    './js/modules/nexus-bridge.js',
    './js/modules/smart-alerts.js',
    './js/modules/workout-ui-controller.js',
    './js/modules/calendario-tracker.js',
    './js/modules/progress-analytics.js',
    './js/modules/evolution-dashboard.js',
    './js/modules/strength-tests.js',
    './js/modules/rm-calculator.js',
    './js/modules/bioimpedancia-rp.js',
    './js/modules/nutrition-rp.js',
    './js/modules/nutrition-flexible.js',
    './js/modules/nutrition-stores.js',
    './js/modules/barcode-scanner.js',
    './js/modules/recovery-nutrition-sync.js',
    './js/modules/progressive-tables.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache =>
            // add() individual: si un asset falla no aborta toda la instalación
            Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url)))
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(k => !k.startsWith(CACHE_VERSION))
                .map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') return;

    // Navegación (index.html): network-first para que las actualizaciones
    // lleguen de inmediato; el cache solo es fallback sin conexión.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                const copy = response.clone();
                caches.open(STATIC_CACHE).then(cache => cache.put('./index.html', copy));
                return response;
            }).catch(async () =>
                (await caches.match(event.request)) || (await caches.match('./index.html'))
            )
        );
        return;
    }

    // Open Food Facts: stale-while-revalidate
    if (url.hostname.endsWith('openfoodfacts.org')) {
        event.respondWith(staleWhileRevalidate(event.request, OFF_CACHE));
        return;
    }

    // Geolocalización inversa: solo red (datos de ubicación no se cachean)
    if (url.hostname.endsWith('bigdatacloud.net')) return;

    // Assets locales y CDNs de librerías: cache-first
    if (url.origin === self.location.origin ||
        url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'unpkg.com') {
        event.respondWith(cacheFirst(event.request));
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        // Sin red y sin cache: para navegación regresa el index precacheado
        if (request.mode === 'navigate') {
            const fallback = await caches.match('./index.html');
            if (fallback) return fallback;
        }
        throw e;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => cached);
    return cached || networkFetch;
}

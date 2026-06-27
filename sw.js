const CACHE_NAME = 'jipange-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/jipange-phase4.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install: cache assets on first load
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache successful responses
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
            .catch(() => {
                // Offline fallback
                return new Response(
                    'App is offline. Your data is saved locally and will sync when online.',
                    { status: 503, statusText: 'Service Unavailable' }
                );
            })
    );
});

// Background sync for analytics (future enhancement)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    try {
        const analytics = await getAnalyticsFromStorage();
        // Send analytics to server when online
        console.log('Analytics synced:', analytics);
    } catch (error) {
        console.error('Analytics sync failed:', error);
    }
}

async function getAnalyticsFromStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('jipange');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('analytics', 'readonly');
            const store = tx.objectStore('analytics');
            const data = store.getAll();
            data.onerror = () => reject(data.error);
            data.onsuccess = () => resolve(data.result);
        };
    });
}

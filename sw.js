const CACHE_NAME = 'appbjj-v7';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/styles-enhanced.css',
    '/app.js',
    '/firebase-config.js',
    '/auth.js',
    '/firestore-service.js',
    '/face-recognition.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
    // face-api.js + modelos (carregados separadamente na primeira execução)
    'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(URLS_TO_CACHE).catch((error) => {
                console.warn('Erro ao fazer cache de alguns recursos:', error);
                return cache.addAll(URLS_TO_CACHE.filter((url) => !url.includes('cdnjs')));
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    return new Response('Offline - conteúdo não disponível', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain',
                        }),
                    });
                });
        })
    );
});

// Notificações Push
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || 'Você tem uma notificação',
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><rect fill=%22%230d0d0f%22 width=%22192%22 height=%22192%22/><circle cx=%2296%22 cy=%2296%22 r=%2260%22 fill=%22%23e53935%22/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 192 192%22><circle cx=%2796%22 cy=%2796%22 r=%2760%22 fill=%22%23e53935%22/></svg>',
        tag: data.tag || 'appbjj-notification',
        requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(data.title || 'AppBJJ Kids', options));
});

// Sincronização em Background
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        // Implementação de sincronização futura
        console.log('Sincronizando dados...');
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

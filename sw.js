/* ===========================================
   SW.JS - Service Worker
   Caché y soporte offline
   =========================================== */

const CACHE_NAME = 'despensa-v1';
const STATIC_CACHE = 'despensa-static-v1';
const DYNAMIC_CACHE = 'despensa-dynamic-v1';

// Archivos a cachear inmediatamente (App Shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/css/main.css',
    '/src/css/variables.css',
    '/src/css/styles.css',
    '/src/js/app.js',
    '/src/js/db.js',
    '/src/js/utils.js',
    '/src/js/notifications.js',
    '/src/assets/icons/icon-192x192.png',
    '/src/assets/icons/icon-512x512.png'
];

// Página offline de respaldo
const OFFLINE_PAGE = '/index.html';

/* ===========================================
   INSTALACIÓN
   =========================================== */

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Cacheando archivos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Activar inmediatamente sin esperar
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Error al cachear:', error);
            })
    );
});

/* ===========================================
   ACTIVACIÓN
   =========================================== */

self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    
    event.waitUntil(
        // Limpiar cachés antiguos
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Eliminar cachés que no sean las actuales
                            return name !== STATIC_CACHE && 
                                   name !== DYNAMIC_CACHE;
                        })
                        .map((name) => {
                            console.log('[SW] Eliminando caché antigua:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Tomar control de todas las páginas abiertas
                return self.clients.claim();
            })
    );
});

/* ===========================================
   ESTRATEGIAS DE CACHÉ
   =========================================== */

/**
 * Cache First - para assets estáticos
 * Busca en caché primero, si no encuentra, va a red
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        // Guardar en caché dinámica
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Si falla la red, devolver página offline
        return caches.match(OFFLINE_PAGE);
    }
}

/**
 * Network First - para contenido dinámico
 * Intenta red primero, si falla usa caché
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Actualizar caché
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Página offline como último recurso
        return caches.match(OFFLINE_PAGE);
    }
}

/**
 * Stale While Revalidate - mejor UX
 * Devuelve caché inmediatamente mientras actualiza en segundo plano
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Actualizar en segundo plano
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);
    
    // Devolver caché inmediatamente o esperar red
    return cachedResponse || fetchPromise;
}

/* ===========================================
   INTERCEPCIÓN DE REQUESTS
   =========================================== */

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo manejar requests del mismo origen
    if (url.origin !== location.origin) {
        return;
    }
    
    // Ignorar requests que no sean GET
    if (request.method !== 'GET') {
        return;
    }

    // Estrategia según tipo de recurso
    if (isStaticAsset(url.pathname)) {
        // Assets estáticos: Cache First
        event.respondWith(cacheFirst(request));
    } else if (isHTMLPage(url.pathname)) {
        // Páginas HTML: Stale While Revalidate
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Resto: Network First
        event.respondWith(networkFirst(request));
    }
});

/**
 * Verifica si es un asset estático
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Verifica si es una página HTML
 */
function isHTMLPage(pathname) {
    return pathname.endsWith('.html') || pathname === '/';
}

/* ===========================================
   PUSH NOTIFICATIONS
   =========================================== */

self.addEventListener('push', (event) => {
    console.log('[SW] Push recibido');
    
    let data = {
        title: 'Gestor de Despensa',
        body: 'Tienes una notificación',
        icon: '/src/assets/icons/icon-192x192.png'
    };
    
    // Intentar parsear datos del push
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/src/assets/icons/icon-192x192.png',
        badge: '/src/assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Cerrar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

/**
 * Click en notificación
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click en notificación');
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    // Abrir o enfocar la app
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Si ya hay una ventana abierta, enfocarla
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no, abrir nueva ventana
                return clients.openWindow(url);
            })
    );
});

/* ===========================================
   BACKGROUND SYNC (futuro)
   =========================================== */

self.addEventListener('sync', (event) => {
    console.log('[SW] Background Sync:', event.tag);
    
    if (event.tag === 'sync-products') {
        // Sincronizar productos cuando vuelva la conexión
        event.waitUntil(syncProducts());
    }
});

async function syncProducts() {
    // Implementar sincronización con servidor si es necesario
    console.log('[SW] Sincronizando productos...');
}

/* ===========================================
   MENSAJES DESDE LA APP
   =========================================== */

self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.keys().then((names) => {
                return Promise.all(names.map((name) => caches.delete(name)));
            })
        );
    }
});

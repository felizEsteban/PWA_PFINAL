/* ===========================================
   NOTIFICATIONS.JS - Notificaciones Push
   Alertas de caducidad de productos
   =========================================== */

import { getExpiringProducts, getExpiredProducts } from './db.js';

// Clave para localStorage (guardar preferencias)
const NOTIFICATION_KEY = 'despensa_notifications_enabled';
const LAST_CHECK_KEY = 'despensa_last_notification_check';

/**
 * Verifica si las notificaciones están soportadas
 */
export function isNotificationSupported() {
    return 'Notification' in window;
}

/**
 * Obtiene el estado actual del permiso
 * @returns {string} 'granted', 'denied', o 'default'
 */
export function getNotificationPermission() {
    if (!isNotificationSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Solicita permiso para notificaciones
 * @returns {Promise<string>} Permiso otorgado
 */
export async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
        console.warn('Notificaciones no soportadas en este navegador');
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            localStorage.setItem(NOTIFICATION_KEY, 'true');
            console.log('Notificaciones activadas');
        }
        
        return permission;
    } catch (error) {
        console.error('Error al solicitar permisos:', error);
        return 'denied';
    }
}

/**
 * Verifica si las notificaciones están habilitadas
 */
export function areNotificationsEnabled() {
    return localStorage.getItem(NOTIFICATION_KEY) === 'true' 
           && getNotificationPermission() === 'granted';
}

/**
 * Desactiva las notificaciones (solo la preferencia local)
 */
export function disableNotifications() {
    localStorage.setItem(NOTIFICATION_KEY, 'false');
}

/**
 * Muestra una notificación nativa
 * @param {string} title - Título de la notificación
 * @param {Object} options - Opciones adicionales
 */
export function showNotification(title, options = {}) {
    if (!areNotificationsEnabled()) {
        console.log('Notificaciones desactivadas');
        return null;
    }

    const defaultOptions = {
        icon: '/src/assets/icons/icon-192x192.png',
        badge: '/src/assets/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        silent: false,
        tag: 'despensa-notification', // Agrupa notificaciones similares
        ...options
    };

    try {
        const notification = new Notification(title, defaultOptions);

        // Manejar click en la notificación
        notification.onclick = () => {
            window.focus();
            notification.close();
            
            // Ir a la pestaña de caducidad
            if (options.onClick) {
                options.onClick();
            }
        };

        return notification;
    } catch (error) {
        console.error('Error al mostrar notificación:', error);
        return null;
    }
}

/**
 * Verifica productos y envía alertas
 * Se ejecuta una vez al día como máximo
 */
export async function checkExpiryAlerts() {
    if (!areNotificationsEnabled()) return;

    // Verificar si ya se hizo check hoy
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const today = new Date().toDateString();
    
    if (lastCheck === today) {
        console.log('Ya se verificaron las alertas hoy');
        return;
    }

    try {
        // Obtener productos caducados y próximos a caducar
        const expired = await getExpiredProducts();
        const expiringSoon = await getExpiringProducts(3); // Próximos 3 días

        // Notificar productos caducados
        if (expired.length > 0) {
            showNotification('⚠️ Productos caducados', {
                body: `Tienes ${expired.length} producto(s) caducado(s) en tu despensa`,
                tag: 'expired-products',
                requireInteraction: true,
                onClick: () => {
                    // Navegar a pestaña de caducidad
                    document.querySelector('[data-tab="caducidad"]')?.click();
                }
            });
        }

        // Notificar productos próximos a caducar
        if (expiringSoon.length > 0) {
            showNotification('⏰ Productos por caducar', {
                body: `${expiringSoon.length} producto(s) caducan en los próximos 3 días`,
                tag: 'expiring-products',
                onClick: () => {
                    document.querySelector('[data-tab="caducidad"]')?.click();
                }
            });
        }

        // Guardar fecha del último check
        localStorage.setItem(LAST_CHECK_KEY, today);
        
    } catch (error) {
        console.error('Error al verificar alertas:', error);
    }
}

/**
 * Programa verificación periódica de caducidad
 * Usa el Page Visibility API para ahorrar recursos
 */
export function scheduleExpiryChecks() {
    // Verificar al cargar la app
    checkExpiryAlerts();

    // Verificar cuando la página vuelve a ser visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkExpiryAlerts();
        }
    });

    // También verificar cada hora si la app está abierta
    setInterval(checkExpiryAlerts, 60 * 60 * 1000);
}

/**
 * Envía notificación de prueba
 */
export function sendTestNotification() {
    return showNotification('🔔 Notificaciones activas', {
        body: 'Recibirás alertas cuando tus productos estén por caducar',
        tag: 'test-notification'
    });
}

/**
 * Obtiene resumen de alertas pendientes
 */
export async function getAlertsSummary() {
    try {
        const expired = await getExpiredProducts();
        const expiringSoon = await getExpiringProducts(7);
        
        return {
            expired: expired.length,
            expiringSoon: expiringSoon.length,
            total: expired.length + expiringSoon.length
        };
    } catch (error) {
        console.error('Error al obtener resumen:', error);
        return { expired: 0, expiringSoon: 0, total: 0 };
    }
}

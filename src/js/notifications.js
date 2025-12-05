
import { getExpiringProducts, getExpiredProducts } from './db.js';


const NOTIFICATION_KEY = 'despensa_notifications_enabled';
const LAST_CHECK_KEY = 'despensa_last_notification_check';


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


export function areNotificationsEnabled() {
    return localStorage.getItem(NOTIFICATION_KEY) === 'true' 
           && getNotificationPermission() === 'granted';
}


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
        tag: 'despensa-notification', 
        ...options
    };

    try {
        const notification = new Notification(title, defaultOptions);

        
        notification.onclick = () => {
            window.focus();
            notification.close();
            
            
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


export async function checkExpiryAlerts() {
    if (!areNotificationsEnabled()) return;

    
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const today = new Date().toDateString();
    
    if (lastCheck === today) {
        console.log('Ya se verificaron las alertas hoy');
        return;
    }

    try {
        
        const expired = await getExpiredProducts();
        const expiringSoon = await getExpiringProducts(3); 

       
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

        
        localStorage.setItem(LAST_CHECK_KEY, today);
        
    } catch (error) {
        console.error('Error al verificar alertas:', error);
    }
}


export function scheduleExpiryChecks() {
    
    checkExpiryAlerts();

    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkExpiryAlerts();
        }
    });

    
    setInterval(checkExpiryAlerts, 60 * 60 * 1000);
}


export function sendTestNotification() {
    return showNotification('🔔 Notificaciones activas', {
        body: 'Recibirás alertas cuando tus productos estén por caducar',
        tag: 'test-notification'
    });
}


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

/* ===========================================
   UTILS.JS - Funciones auxiliares
   =========================================== */

/**
 * Formatea fecha a formato legible en español
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
    if (!date) return 'Sin fecha';
    
    const d = new Date(date);
    
    return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Calcula días hasta la caducidad
 * @param {string|Date} expiryDate - Fecha de caducidad
 * @returns {number} Días restantes (negativo si ya caducó)
 */
export function getDaysUntilExpiry(expiryDate) {
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Obtiene el estado de caducidad
 * @param {string|Date} expiryDate - Fecha de caducidad
 * @returns {Object} { status, label, class }
 */
export function getExpiryStatus(expiryDate) {
    const days = getDaysUntilExpiry(expiryDate);
    
    if (days === null) {
        return {
            status: 'unknown',
            label: 'Sin fecha',
            class: ''
        };
    }
    
    if (days < 0) {
        return {
            status: 'expired',
            label: `Caducado hace ${Math.abs(days)} día(s)`,
            class: 'product-card--expired'
        };
    }
    
    if (days === 0) {
        return {
            status: 'expired',
            label: '¡Caduca hoy!',
            class: 'product-card--expired'
        };
    }
    
    if (days <= 7) {
        return {
            status: 'soon',
            label: `Caduca en ${days} día(s)`,
            class: 'product-card--soon'
        };
    }
    
    return {
        status: 'ok',
        label: `Caduca en ${days} días`,
        class: 'product-card--ok'
    };
}

/**
 * Iconos por categoría
 */
export const CATEGORY_ICONS = {
    lacteos: '🥛',
    carnes: '🥩',
    frutas: '🍎',
    cereales: '🌾',
    bebidas: '🥤',
    limpieza: '🧹',
    otros: '📦'
};

/**
 * Nombres legibles de categorías
 */
export const CATEGORY_NAMES = {
    lacteos: 'Lácteos',
    carnes: 'Carnes',
    frutas: 'Frutas y Verduras',
    cereales: 'Cereales y Granos',
    bebidas: 'Bebidas',
    limpieza: 'Limpieza',
    otros: 'Otros'
};

/**
 * Obtiene el icono de una categoría
 */
export function getCategoryIcon(category) {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.otros;
}

/**
 * Genera un ID único simple
 * (IndexedDB usa autoIncrement, pero esto es útil para otros casos)
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce - retrasa ejecución hasta que el usuario deje de escribir
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Milisegundos de espera
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Muestra un toast (notificación temporal)
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en ms
 */
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.hidden = false;
    
    // Ocultar después del tiempo especificado
    setTimeout(() => {
        toast.hidden = true;
    }, duration);
}

/**
 * Vibra el dispositivo (si está soportado)
 * @param {number|number[]} pattern - Patrón de vibración
 */
export function vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

/**
 * Ordena productos por fecha de caducidad
 * @param {Array} products - Lista de productos
 * @param {string} order - 'asc' o 'desc'
 */
export function sortByExpiry(products, order = 'asc') {
    return [...products].sort((a, b) => {
        // Productos sin fecha van al final
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        
        const dateA = new Date(a.expiryDate);
        const dateB = new Date(b.expiryDate);
        
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
}

/**
 * Filtra productos por estado de caducidad
 * @param {Array} products - Lista de productos
 * @param {string} filter - 'all', 'expired', 'soon', 'ok'
 */
export function filterByExpiryStatus(products, filter) {
    if (filter === 'all') return products;
    
    return products.filter(product => {
        const status = getExpiryStatus(product.expiryDate);
        return status.status === filter;
    });
}

/**
 * Valida que un campo no esté vacío
 */
export function isNotEmpty(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

/**
 * Sanitiza texto para prevenir XSS
 */
export function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Formatea cantidad con unidad
 */
export function formatQuantity(quantity, unit) {
    return `${quantity} ${unit}${quantity > 1 && unit === 'unidad' ? 'es' : ''}`;
}

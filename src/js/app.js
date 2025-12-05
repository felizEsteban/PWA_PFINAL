import { 
    initDB, 
    getAllProducts, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    searchProducts,
    getShoppingList,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearBoughtItems
} from './db.js';

import {
    formatDate,
    getExpiryStatus,
    getCategoryIcon,
    debounce,
    showToast,
    vibrate,
    sortByExpiry,
    filterByExpiryStatus,
    formatQuantity,
    sanitizeHTML
} from './utils.js';

import {
    requestNotificationPermission,
    areNotificationsEnabled,
    scheduleExpiryChecks,
    sendTestNotification,
    getNotificationPermission
} from './notifications.js';


let state = {
    products: [],
    shoppingList: [],
    currentTab: 'inventario',
    editingProductId: null,
    expiryFilter: 'all'
};



const elements = {
    loadingScreen: null,
    navTabs: null,
    tabContents: null,
    inventoryList: null,
    shoppingListEl: null,
    expiryList: null,
    searchInput: null,
    modalProduct: null,
    modalShopping: null,
    formProduct: null,
    formShopping: null,
    btnInstall: null
};


let deferredPrompt = null;


async function init() {
    try {
        
        cacheElements();
        
        
        await initDB();
        
        
        await loadData();
        
        
        setupEventListeners();
        
        
        scheduleExpiryChecks();
        
        
        hideLoadingScreen();
        
        
        handleURLParams();
        
        console.log('App inicializada correctamente');
        
    } catch (error) {
        console.error('Error al inicializar:', error);
        showToast('Error al cargar la aplicación');
    }
}


function cacheElements() {
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.navTabs = document.querySelectorAll('.nav-tab');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.inventoryList = document.getElementById('inventory-list');
    elements.shoppingListEl = document.getElementById('shopping-list');
    elements.expiryList = document.getElementById('expiry-list');
    elements.searchInput = document.getElementById('search-inventory');
    elements.modalProduct = document.getElementById('modal-product');
    elements.modalShopping = document.getElementById('modal-shopping');
    elements.formProduct = document.getElementById('form-product');
    elements.formShopping = document.getElementById('form-shopping');
    elements.btnInstall = document.getElementById('btn-install');
}


function hideLoadingScreen() {
    if (elements.loadingScreen) {
        elements.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 300);
    }
}


async function loadData() {
    state.products = await getAllProducts();
    state.shoppingList = await getShoppingList();
    
    renderInventory();
    renderShoppingList();
    renderExpiryList();
}



function setupEventListeners() {
    
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    
    elements.searchInput?.addEventListener('input', 
        debounce((e) => handleSearch(e.target.value), 300)
    );

    
    document.getElementById('btn-add-product')?.addEventListener('click', () => {
        openProductModal();
    });

    
    document.getElementById('btn-add-shopping')?.addEventListener('click', () => {
        openShoppingModal();
    });

    
    elements.formProduct?.addEventListener('submit', handleProductSubmit);

    
    elements.formShopping?.addEventListener('submit', handleShoppingSubmit);

    
    document.querySelectorAll('.btn-close, #btn-cancel').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    document.querySelector('.btn-close-shopping')?.addEventListener('click', () => {
        elements.modalShopping?.close();
    });

    
    elements.modalProduct?.addEventListener('click', (e) => {
        if (e.target === elements.modalProduct) closeModals();
    });

    elements.modalShopping?.addEventListener('click', (e) => {
        if (e.target === elements.modalShopping) elements.modalShopping.close();
    });

    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.expiryFilter = btn.dataset.filter;
            renderExpiryList();
        });
    });

    
    document.getElementById('btn-clear-bought')?.addEventListener('click', handleClearBought);

    
    document.getElementById('btn-enable-notifications')?.addEventListener('click', handleEnableNotifications);

    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        elements.btnInstall.hidden = false;
    });

    elements.btnInstall?.addEventListener('click', handleInstall);

    
    elements.inventoryList?.addEventListener('click', handleInventoryClick);
    elements.shoppingListEl?.addEventListener('click', handleShoppingClick);
    elements.expiryList?.addEventListener('click', handleInventoryClick);
}



function switchTab(tabName) {
    state.currentTab = tabName;

    
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
        tab.setAttribute('aria-selected', tab.dataset.tab === tabName);
    });

    
    elements.tabContents.forEach(content => {
        const isActive = content.id === tabName;
        content.classList.toggle('active', isActive);
        content.hidden = !isActive;
    });

    vibrate(30);
}

function renderInventory(products = state.products) {
    if (!elements.inventoryList) return;

    if (products.length === 0) {
        elements.inventoryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📦</div>
                <p class="empty-state__text">Tu despensa está vacía</p>
                <p class="empty-state__hint">Agrega productos con el botón +</p>
            </div>
        `;
        return;
    }

    elements.inventoryList.innerHTML = products.map(product => 
        createProductCard(product)
    ).join('');
}


function renderShoppingList() {
    if (!elements.shoppingListEl) return;

    if (state.shoppingList.length === 0) {
        elements.shoppingListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🛒</div>
                <p class="empty-state__text">Lista vacía</p>
                <p class="empty-state__hint">¿Qué necesitas comprar?</p>
            </div>
        `;
        return;
    }

    
    const sorted = [...state.shoppingList].sort((a, b) => a.bought - b.bought);

    elements.shoppingListEl.innerHTML = sorted.map(item => `
        <div class="shopping-item ${item.bought ? 'bought' : ''}" data-id="${item.id}">
            <input 
                type="checkbox" 
                class="shopping-item__checkbox" 
                ${item.bought ? 'checked' : ''}
                aria-label="Marcar como comprado"
            >
            <span class="shopping-item__name">${sanitizeHTML(item.name)}</span>
            ${item.quantity ? `<span class="shopping-item__quantity">${sanitizeHTML(item.quantity)}</span>` : ''}
            <button class="product-card__btn product-card__btn--delete" data-action="delete" aria-label="Eliminar">
                🗑️
            </button>
        </div>
    `).join('');
}


function renderExpiryList() {
    if (!elements.expiryList) return;

    
    let products = state.products.filter(p => p.expiryDate);
    
    
    products = filterByExpiryStatus(products, state.expiryFilter);
    
    
    products = sortByExpiry(products, 'asc');

    if (products.length === 0) {
        elements.expiryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📅</div>
                <p class="empty-state__text">No hay productos con fecha</p>
                <p class="empty-state__hint">Agrega fechas de caducidad a tus productos</p>
            </div>
        `;
        return;
    }

    elements.expiryList.innerHTML = products.map(product => 
        createProductCard(product, true)
    ).join('');
}


function createProductCard(product, showExpiry = false) {
    const icon = getCategoryIcon(product.category);
    const expiryStatus = getExpiryStatus(product.expiryDate);
    
    return `
        <article class="product-card ${showExpiry ? expiryStatus.class : ''}" data-id="${product.id}" role="listitem">
            <span class="product-card__icon">${icon}</span>
            <div class="product-card__info">
                <h3 class="product-card__name">${sanitizeHTML(product.name)}</h3>
                <p class="product-card__details">
                    ${formatQuantity(product.quantity, product.unit)}
                    ${product.expiryDate ? ` • ${formatDate(product.expiryDate)}` : ''}
                </p>
                ${showExpiry && product.expiryDate ? `
                    <span class="expiry-badge expiry-badge--${expiryStatus.status}">
                        ${expiryStatus.label}
                    </span>
                ` : ''}
            </div>
            <div class="product-card__actions">
                <button class="product-card__btn" data-action="edit" aria-label="Editar producto">
                    ✏️
                </button>
                <button class="product-card__btn product-card__btn--delete" data-action="delete" aria-label="Eliminar producto">
                    🗑️
                </button>
            </div>
        </article>
    `;
}


async function handleSearch(query) {
    if (!query.trim()) {
        renderInventory();
        return;
    }
    
    const results = await searchProducts(query);
    renderInventory(results);
}


async function handleInventoryClick(e) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    
    const id = parseInt(card.dataset.id);
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'edit') {
        openProductModal(id);
    } else if (action === 'delete') {
        await handleDeleteProduct(id);
    }
}


async function handleShoppingClick(e) {
    const item = e.target.closest('.shopping-item');
    if (!item) return;
    
    const id = parseInt(item.dataset.id);

    
    if (e.target.classList.contains('shopping-item__checkbox')) {
        await toggleShoppingItem(id, e.target.checked);
        state.shoppingList = await getShoppingList();
        renderShoppingList();
        vibrate(30);
        return;
    }

    
    if (e.target.closest('[data-action="delete"]')) {
        await deleteShoppingItem(id);
        state.shoppingList = await getShoppingList();
        renderShoppingList();
        showToast('Item eliminado');
        vibrate(50);
    }
}


async function handleDeleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
        await deleteProduct(id);
        state.products = await getAllProducts();
        renderInventory();
        renderExpiryList();
        showToast('Producto eliminado');
        vibrate(50);
    } catch (error) {
        console.error('Error al eliminar:', error);
        showToast('Error al eliminar');
    }
}


async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const productData = {
        name: formData.get('name').trim(),
        quantity: parseInt(formData.get('quantity')) || 1,
        unit: formData.get('unit'),
        category: formData.get('category'),
        expiryDate: formData.get('expiryDate') || null,
        notes: formData.get('notes')?.trim() || ''
    };

    
    if (!productData.name) {
        showToast('Ingresa el nombre del producto');
        return;
    }

    try {
        if (state.editingProductId) {
            
            productData.id = state.editingProductId;
            await updateProduct(productData);
            showToast('Producto actualizado');
        } else {
            
            await addProduct(productData);
            showToast('Producto agregado');
        }

        
        state.products = await getAllProducts();
        renderInventory();
        renderExpiryList();
        closeModals();
        vibrate([50, 30, 50]);
        
    } catch (error) {
        console.error('Error al guardar:', error);
        showToast('Error al guardar');
    }
}


async function handleShoppingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const itemData = {
        name: formData.get('name').trim(),
        quantity: formData.get('quantity')?.trim() || ''
    };

    if (!itemData.name) {
        showToast('Ingresa qué necesitas comprar');
        return;
    }

    try {
        await addShoppingItem(itemData);
        state.shoppingList = await getShoppingList();
        renderShoppingList();
        elements.modalShopping?.close();
        e.target.reset();
        showToast('Agregado a la lista');
        vibrate(50);
    } catch (error) {
        console.error('Error al agregar:', error);
        showToast('Error al agregar');
    }
}


async function handleClearBought() {
    const boughtCount = state.shoppingList.filter(item => item.bought).length;
    
    if (boughtCount === 0) {
        showToast('No hay items comprados');
        return;
    }

    if (!confirm(`¿Eliminar ${boughtCount} item(s) comprado(s)?`)) return;

    try {
        await clearBoughtItems();
        state.shoppingList = await getShoppingList();
        renderShoppingList();
        showToast('Lista limpiada');
    } catch (error) {
        console.error('Error al limpiar:', error);
        showToast('Error al limpiar');
    }
}


async function handleEnableNotifications() {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
        showToast('Notificaciones activadas');
        sendTestNotification();
        
        
        const btn = document.getElementById('btn-enable-notifications');
        if (btn) {
            btn.textContent = 'Alertas activas';
            btn.disabled = true;
        }
    } else if (permission === 'denied') {
        showToast('Permisos denegados. Actívalos en configuración del navegador.');
    }
}


async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('¡App instalada!');
        elements.btnInstall.hidden = true;
    }
    
    deferredPrompt = null;
}


async function openProductModal(productId = null) {
    state.editingProductId = productId;
    
    const modalTitle = document.getElementById('modal-title');
    
    if (productId) {
        
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        
        modalTitle.textContent = 'Editar Producto';
        
        
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-quantity').value = product.quantity;
        document.getElementById('product-unit').value = product.unit;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-expiry').value = product.expiryDate || '';
        document.getElementById('product-notes').value = product.notes || '';
    } else {
        
        modalTitle.textContent = 'Agregar Producto';
        elements.formProduct?.reset();
    }
    
    elements.modalProduct?.showModal();
}


function openShoppingModal() {
    elements.formShopping?.reset();
    elements.modalShopping?.showModal();
}


function closeModals() {
    elements.modalProduct?.close();
    elements.modalShopping?.close();
    state.editingProductId = null;
}


function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    
    if (params.get('action') === 'add') {
        openProductModal();
    }
    
    
    const tab = params.get('tab');
    if (tab && ['inventario', 'compras', 'caducidad'].includes(tab)) {
        switchTab(tab);
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

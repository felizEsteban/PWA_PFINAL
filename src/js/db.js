/* ===========================================
   DB.JS - Manejo de IndexedDB
   Almacenamiento local persistente
   =========================================== */

const DB_NAME = 'GestorDespensaDB';
const DB_VERSION = 1;

// Stores (tablas)
const STORES = {
    PRODUCTS: 'products',
    SHOPPING: 'shopping'
};

let db = null;

/**
 * Inicializa la base de datos IndexedDB
 * Crea los stores si no existen
 */
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Se ejecuta si la DB no existe o la versión cambió
        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Store de productos (inventario)
            if (!database.objectStoreNames.contains(STORES.PRODUCTS)) {
                const productStore = database.createObjectStore(STORES.PRODUCTS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                // Índices para búsquedas rápidas
                productStore.createIndex('name', 'name', { unique: false });
                productStore.createIndex('category', 'category', { unique: false });
                productStore.createIndex('expiryDate', 'expiryDate', { unique: false });
            }

            // Store de lista de compras
            if (!database.objectStoreNames.contains(STORES.SHOPPING)) {
                const shoppingStore = database.createObjectStore(STORES.SHOPPING, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                shoppingStore.createIndex('bought', 'bought', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB inicializada correctamente');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Obtiene una transacción y store
 * @param {string} storeName - Nombre del store
 * @param {string} mode - 'readonly' o 'readwrite'
 */
function getStore(storeName, mode = 'readonly') {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

/* ===========================================
   OPERACIONES DE PRODUCTOS (INVENTARIO)
   =========================================== */

/**
 * Agrega un nuevo producto al inventario
 */
export async function addProduct(product) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS, 'readwrite');
            
            // Agregar timestamp de creación
            const productData = {
                ...product,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const request = store.add(productData);

            request.onsuccess = () => resolve(request.result); // Retorna el ID
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene todos los productos
 */
export async function getAllProducts() {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(id) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(product) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS, 'readwrite');
            
            const productData = {
                ...product,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(productData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Elimina un producto
 */
export async function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS, 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Busca productos por nombre
 */
export async function searchProducts(query) {
    const products = await getAllProducts();
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => 
        product.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Obtiene productos por categoría
 */
export async function getProductsByCategory(category) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.PRODUCTS);
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene productos próximos a caducar
 * @param {number} days - Días para considerar "próximo"
 */
export async function getExpiringProducts(days = 7) {
    const products = await getAllProducts();
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() + days);

    return products.filter(product => {
        if (!product.expiryDate) return false;
        const expiry = new Date(product.expiryDate);
        return expiry <= limitDate && expiry >= today;
    });
}

/**
 * Obtiene productos ya caducados
 */
export async function getExpiredProducts() {
    const products = await getAllProducts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return products.filter(product => {
        if (!product.expiryDate) return false;
        const expiry = new Date(product.expiryDate);
        return expiry < today;
    });
}

/* ===========================================
   OPERACIONES DE LISTA DE COMPRAS
   =========================================== */

/**
 * Agrega item a lista de compras
 */
export async function addShoppingItem(item) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.SHOPPING, 'readwrite');
            
            const itemData = {
                ...item,
                bought: false,
                createdAt: new Date().toISOString()
            };

            const request = store.add(itemData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene toda la lista de compras
 */
export async function getShoppingList() {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.SHOPPING);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Marca/desmarca item como comprado
 */
export async function toggleShoppingItem(id, bought) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.SHOPPING, 'readwrite');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.bought = bought;
                    const updateRequest = store.put(item);
                    updateRequest.onsuccess = () => resolve(true);
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Item no encontrado'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Elimina item de la lista
 */
export async function deleteShoppingItem(id) {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(STORES.SHOPPING, 'readwrite');
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Elimina todos los items marcados como comprados
 */
export async function clearBoughtItems() {
    const items = await getShoppingList();
    const boughtItems = items.filter(item => item.bought);
    
    const deletePromises = boughtItems.map(item => deleteShoppingItem(item.id));
    
    return Promise.all(deletePromises);
}

/**
 * Mueve item de compras a inventario
 */
export async function moveToInventory(shoppingItem, productDetails) {
    // Agregar al inventario
    const product = {
        name: shoppingItem.name,
        quantity: productDetails.quantity || 1,
        unit: productDetails.unit || 'unidad',
        category: productDetails.category || 'otros',
        expiryDate: productDetails.expiryDate || null,
        notes: productDetails.notes || ''
    };

    await addProduct(product);
    
    // Eliminar de la lista de compras
    await deleteShoppingItem(shoppingItem.id);
    
    return product;
}

// Exportar stores para uso externo si es necesario
export { STORES };

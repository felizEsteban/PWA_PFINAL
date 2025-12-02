# 🏠 Gestor de Despensa - PWA

Aplicación Web Progresiva para gestionar tu despensa, lista de compras y controlar fechas de caducidad.

## ✨ Características

- 📦 **Inventario**: Gestiona todos los productos de tu despensa
- 🛒 **Lista de Compras**: Crea y marca items como comprados
- ⏰ **Control de Caducidad**: Alertas cuando productos están por vencer
- 🔔 **Notificaciones Push**: Recordatorios automáticos
- 📱 **Instalable**: Funciona como app nativa
- 🌐 **Offline First**: Funciona sin conexión

## 🚀 Instalación

### Opción 1: Servidor local
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

### Opción 2: Live Server (VS Code)
1. Instalar extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

### Opción 3: Despliegue
- **GitHub Pages**: Sube el proyecto y activa Pages
- **Netlify/Vercel**: Conecta el repositorio
- **Firebase Hosting**: `firebase deploy`

## 📁 Estructura del Proyecto

```
/gestor-despensa
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── src/
│   ├── assets/
│   │   ├── icons/          # Iconos PWA (72-512px)
│   │   └── images/         # Imágenes optimizadas
│   ├── components/         # Componentes reutilizables
│   ├── css/
│   │   ├── variables.css   # Variables CSS (:root)
│   │   ├── main.css        # Reset y base
│   │   └── styles.css      # Estilos de componentes
│   └── js/
│       ├── app.js          # Lógica principal
│       ├── db.js           # IndexedDB
│       ├── notifications.js # Push notifications
│       └── utils.js        # Funciones auxiliares
└── README.md
```

## 🔧 Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Almacenamiento | IndexedDB |
| PWA | Service Worker, Web Manifest |
| APIs | Notification API, Vibration API |

## 📋 Requisitos Cumplidos

### ✅ Estructura
- [x] Carpetas organizadas (src/, components/, assets/)
- [x] Control de versiones con Git
- [x] Convenciones de nombres coherentes

### ✅ HTML
- [x] Metadatos SEO completos
- [x] Atributos de accesibilidad (ARIA)
- [x] Semántica HTML5

### ✅ CSS
- [x] Variables CSS (:root)
- [x] Mobile First / Responsive
- [x] Sin estilos inline
- [x] Separación de archivos

### ✅ JavaScript
- [x] Código modular (ES Modules)
- [x] Async/await para operaciones asíncronas
- [x] Manejo de errores (try/catch)
- [x] Sin dependencias externas

### ✅ PWA
- [x] manifest.json configurado
- [x] Service Worker con caché
- [x] Soporte offline
- [x] Instalable desde navegador
- [x] Notification API

### ✅ Rendimiento
- [x] Lazy loading implícito
- [x] Archivos modulares
- [x] IndexedDB optimizado

## 🧪 Probar con Lighthouse

1. Abrir DevTools (F12)
2. Ir a pestaña "Lighthouse"
3. Seleccionar: Performance, PWA, Accessibility
4. Click en "Analyze page load"

**Objetivo**: Score > 90 en todas las categorías

## 📱 Capturas

> Agrega screenshots de la app aquí

## 🔜 Próximas Mejoras

- [ ] Sincronización en la nube
- [ ] Escaneo de código de barras
- [ ] Modo oscuro
- [ ] Exportar/Importar datos
- [ ] Compartir lista de compras

## 📄 Licencia

MIT License - Uso libre para fines educativos y personales.

---

Desarrollado con ❤️ como proyecto de PWA

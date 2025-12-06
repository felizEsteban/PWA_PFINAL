# Gestor de Despensa – PWA

Aplicación web progresiva para gestionar inventario, listas de compras y fechas de caducidad. Funciona sin conexión y puede instalarse como aplicación.

## Características
- Inventario de productos
- Lista de compras
- Alertas de caducidad
- Notificaciones push
- Modo offline
- Instalación en dispositivos

## Instalación

### Servidor local
npx serve .


### Live Server (VS Code)
1. Instalar la extensión "Live Server"
2. Abrir index.html con "Open with Live Server"


## Estructura del Proyecto
```
/PWA_PFINAL
├── index.html                # Página principal
├── manifest.json             # Configuración PWA
├── sw.js                     # Service Worker
├── src/
│   ├── assets/
│   │   ├── icons/            # Iconos PWA (72-512px)
│   │   └── images/           # Imágenes optimizadas
│   ├── components/           # Componentes reutilizables
│   ├── css/
│   │   ├── variables.css     # Variables CSS (:root)
│   │   ├── main.css          # Reset y base
│   │   └── styles.css        # Estilos de componentes
│   └── js/
│       ├── app.js            # Lógica principal
│       ├── db.js             # IndexedDB
│       ├── notifications.js  # Push notifications
│       └── utils.js          # Funciones auxiliares
└── README.md
```

# Annie

**Annie** es un sistema de gestión para pequeños negocios y emprendedores. Permite al dueño de una tienda, papelería, puesto o negocio familiar administrar su operación diaria sin equipos costosos ni conocimientos técnicos.

Tiene dos clientes que comparten el mismo backend y la misma base de datos:

- **Web** (`annie-frontend`): aplicación React, pensada como PWA.
- **Móvil** (`annie-mobile`): app nativa para Android y iPhone hecha con **React Native (Expo)**. Ver [annie-mobile/README.md](annie-mobile/README.md).

## ¿Qué hace?

- **Inventario:** registro de productos con precios, categorías y existencias, con alertas de stock bajo.
- **Ventas:** captura rápida con folio, método de pago (efectivo o crédito), pago, cambio y ticket imprimible o compartible.
- **Clientes y créditos:** control de clientes y de sus cuentas a crédito ("fiado"): cargos, abonos y saldo.
- **Reportes:** gráficas de ventas, productos más vendidos, categorías y mejores clientes; la app móvil exporta las ventas a CSV (Excel).
- **App de celular:** instalable en Android (APK) y iPhone, con impresión y envío del ticket en PDF.
- **En desarrollo (próximas revisiones):** modo sin conexión (PWA con service worker e IndexedDB) para registrar ventas sin internet y sincronizarlas después.

## Problema que resuelve

Muchos pequeños negocios llevan sus ventas, inventario y créditos en libreta porque los sistemas de punto de venta son caros y complejos. Además, suelen operar con señal móvil inestable. Annie ofrece una herramienta accesible que funciona incluso sin conexión.

## Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend web | React 19, React Router, Axios, Recharts, Web App Manifest (PWA en desarrollo) |
| App móvil | React Native 0.88, Expo SDK 58, Expo Router, TypeScript, React Query, SecureStore, expo-print |
| Backend | Node.js, Express 5, MongoDB (Mongoose), JWT, bcryptjs, Helmet |
| Despliegue | Vercel (web), Render (backend), EAS Build (APK de Android) |
| Pruebas | node:test + supertest + mongodb-memory-server (backend), Jest + Testing Library (móvil) |

## Estructura

```
annie-backend/              API REST (Express + MongoDB) que usan la web y la app
├── server.js               Arranque: seguridad, CORS, rutas y manejo de errores
├── config/db.js            Conexión a MongoDB
├── middleware/             Autenticación (JWT)
├── models/                 Esquemas: User, Business, Product, Client, Sale, CreditMovement, Counter, Upload
├── routes/                 auth, profile, products, clients, credits, sales
├── utils/                  RFC, errores (mensajes en español), detección de imágenes
├── scripts/                Datos de demostración, servidor en memoria, diagnóstico de conexión
└── test/                   Pruebas (node:test + supertest)

annie-frontend/             Aplicación web (React)
├── public/                 index.html, manifest, estilos y medios de la página de inicio
└── src/
    ├── api/                Cliente HTTP (axios)
    ├── components/         Secciones de la página de inicio
    ├── pages/              Inicio, login, registro, panel
    ├── dashboard/          Panel: pages/ (Ventas, Productos...) y components/ (menú, barra)
    ├── utils/              Formatos, RFC, reglas de venta y constantes compartidas
    └── hooks/              Hooks reutilizables

annie-mobile/               App de celular (React Native + Expo) — ver su README
├── src/app/                Pantallas (Expo Router)
├── src/components/         Componentes y kit de UI
├── src/lib/                API, consultas, reglas de negocio, ticket
└── __tests__/              Pruebas (Jest + Testing Library)

.github/workflows/ci.yml    Pruebas automáticas en GitHub en cada push
render.yaml                 Despliegue del backend en Render
```

## Ejecución local

```bash
# Backend
cd annie-backend
npm install
npm run dev

# Frontend web
cd annie-frontend
npm install
npm start

# App móvil (escanear el QR con Expo Go)
cd annie-mobile
npm install
npx expo start
```

Para probar sin instalar MongoDB: `npm run dev:memoria` en `annie-backend` levanta el backend con una base de datos en memoria y `npm run seed:demo` crea un negocio de demostración.

## Conectar con MongoDB Atlas (nube)

1. Crea `annie-backend/.env` copiando `annie-backend/.env.example` y pon tu cadena de conexión en `DB_URI` y una clave larga en `JWT_SECRET`. **Nunca subas `.env` a GitHub** (ya está en `.gitignore`).
2. En Atlas → **Network Access**, permite tu IP (para probar en tu computadora) y `0.0.0.0/0` (para que Render pueda conectarse).
3. Comandos útiles dentro de `annie-backend`:

```bash
npm run probar:conexion    # diagnóstico: ¿conecta?, bases y colecciones (solo lectura)
npm run test:nube          # las pruebas contra Atlas en bases temporales que se borran solas
npm run dev:nube-pruebas   # backend contra Atlas en la base "annie_pruebas" (no toca los datos reales)
```

## Pruebas

```bash
cd annie-backend && npm test        # API: ventas, folios, crédito, permisos, archivos
cd annie-mobile && npm test         # App móvil: reglas de negocio y pantallas
```

## Estrategia de ramas

- `main`: código estable y desplegado; cada revisión se marca con un tag (`R0`, `R1`, ...).
- `develop`: integración de funcionalidades terminadas.
- `feature/*`: una rama por historia de usuario (ej. `feature/HU-01-venta-offline`).
- `fix/*` y `hotfix/*`: corrección de errores.

No se hace push directo a `main`; los cambios entran por Pull Request con revisión de otro integrante. Commits con formato Conventional Commits (`feat:`, `fix:`, `docs:`...).

## Documentación de entregas

- [R0 – Propuesta y alcance](R0_PROPUESTA_Y_ALCANCE.txt)

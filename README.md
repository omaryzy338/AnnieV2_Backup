# Annie

**Annie** es un sistema de gestión para pequeños negocios y emprendedores. Permite al dueño de una tienda, papelería, puesto o negocio familiar administrar su operación diaria sin equipos costosos ni conocimientos técnicos.

Tiene dos clientes que comparten el mismo backend y la misma base de datos:

- **Web** (`annie-frontend`): aplicación React, pensada como PWA.
- **Móvil** (`annie-mobile`): app nativa para Android y iPhone hecha con **React Native (Expo)**. Ver [annie-mobile/README.md](annie-mobile/README.md).

## ¿Qué hace?

- **Inventario:** registro de productos con precios, categorías y existencias, con alertas de stock bajo.
- **Ventas:** captura rápida con folio, método de pago (efectivo o crédito), pago, cambio y ticket imprimible o compartible.
- **Clientes y créditos:** control de clientes y de sus cuentas a crédito ("fiado"): cargos, abonos y saldo.
- **Reportes:** gráficas de ventas y productos más vendidos, con exportación a Excel.
- **Offline:** las ventas, consultas de inventario y abonos funcionan sin internet y se sincronizan al recuperar la conexión.
- **Instalable:** se agrega a la pantalla de inicio del celular como una app nativa.

## Problema que resuelve

Muchos pequeños negocios llevan sus ventas, inventario y créditos en libreta porque los sistemas de punto de venta son caros y complejos. Además, suelen operar con señal móvil inestable. Annie ofrece una herramienta accesible que funciona incluso sin conexión.

## Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend web (PWA) | React 19, React Router, Service Worker (Workbox), Web App Manifest, IndexedDB, Axios, Recharts |
| App móvil | React Native 0.88, Expo SDK 58, Expo Router, TypeScript, React Query, SecureStore, expo-print |
| Backend | Node.js, Express 5, MongoDB (Mongoose), JWT, bcryptjs, Helmet |
| Despliegue | Vercel (frontend), Render (backend), EAS Build (APK de Android), Docker para desarrollo local |
| Pruebas | node:test + supertest + mongodb-memory-server (backend), Jest + Testing Library (móvil) |

## Estructura

```
annie-frontend/   Aplicación web React (PWA)
annie-mobile/     App móvil React Native (Expo)
annie-backend/    API REST en Express + MongoDB (la usan la web y la app)
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

También puede levantarse todo con Docker: ver [DOCKER.md](DOCKER.md).

## Estrategia de ramas

- `main`: código estable y desplegado; cada revisión se marca con un tag (`R0`, `R1`, ...).
- `develop`: integración de funcionalidades terminadas.
- `feature/*`: una rama por historia de usuario (ej. `feature/HU-01-venta-offline`).
- `fix/*` y `hotfix/*`: corrección de errores.

No se hace push directo a `main`; los cambios entran por Pull Request con revisión de otro integrante. Commits con formato Conventional Commits (`feat:`, `fix:`, `docs:`...).

## Documentación de entregas

- [R0 – Propuesta y alcance](R0_PROPUESTA_Y_ALCANCE.txt)

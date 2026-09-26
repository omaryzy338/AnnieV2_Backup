# Annie

**Annie** es una aplicación web progresiva (PWA) de gestión para pequeños negocios y emprendedores. Permite al dueño de una tienda, papelería, puesto o negocio familiar administrar su operación diaria desde el celular, sin equipos costosos ni conocimientos técnicos.

## ¿Qué hace?

- **Inventario:** registro de productos con precios, categorías y existencias, con alertas de stock bajo.
- **Ventas:** captura rápida de ventas con cálculo automático de totales.
- **Clientes y créditos:** control de clientes y de sus cuentas a crédito ("fiado"): cargos, abonos y saldo.
- **Reportes:** gráficas de ventas y productos más vendidos, con exportación a Excel.
- **Offline:** las ventas, consultas de inventario y abonos funcionan sin internet y se sincronizan al recuperar la conexión.
- **Instalable:** se agrega a la pantalla de inicio del celular como una app nativa.

## Problema que resuelve

Muchos pequeños negocios llevan sus ventas, inventario y créditos en libreta porque los sistemas de punto de venta son caros y complejos. Además, suelen operar con señal móvil inestable. Annie ofrece una herramienta accesible que funciona incluso sin conexión.

## Stack

| Capa | Tecnologías |
|------|-------------|
| Frontend (PWA) | React 19, React Router, Service Worker (Workbox), Web App Manifest, IndexedDB, Axios, Recharts |
| Backend | Node.js, Express 5, MongoDB (Mongoose), JWT, bcryptjs, Helmet |
| Despliegue | Vercel (frontend), Render (backend), Docker para desarrollo local |

## Estructura

```
annie-frontend/   Aplicación React (PWA)
annie-backend/    API REST en Express + MongoDB
```

## Ejecución local

```bash
# Backend
cd annie-backend
npm install
npm run dev

# Frontend
cd annie-frontend
npm install
npm start
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

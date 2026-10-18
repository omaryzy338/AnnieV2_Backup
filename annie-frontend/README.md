# Annie · aplicación web

Panel web de **Annie**, la herramienta de gestión para pequeños negocios en
México. Incluye la página principal (landing), el registro e inicio de sesión
y el panel del negocio: inventario de productos, ventas con ticket imprimible,
clientes, créditos de mayoreo, reportes y los datos de "Mi Negocio".

Está hecha con Create React App 5, React 19, React Router 7, axios y recharts.
Se conecta a la API de `annie-backend`.

## Requisitos

- Node.js 18 o superior
- La API de `annie-backend` corriendo (local o en la nube)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
```

Abre <http://localhost:3000>. La URL de la API se toma de la variable
`REACT_APP_API_URL`; si no se define se usa `http://localhost:5000`.
Para apuntar a otra API crea un archivo `.env.local`:

```
REACT_APP_API_URL=https://tu-api.ejemplo.com
```

## Compilar para producción

```bash
npm run build
```

Genera la carpeta `build/` con los archivos estáticos listos para publicar.
`REACT_APP_API_URL` se fija al compilar, así que debe estar definida en ese
momento.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y elige `annie-frontend` como carpeta raíz
   (framework: Create React App).
2. En *Settings → Environment Variables* agrega `REACT_APP_API_URL` con la URL
   pública del backend.
3. Despliega. `vercel.json` redirige todas las rutas a `index.html` para que
   funcione la recarga en rutas como `/dashboard/ventas`.

## Estructura

```
public/                 index.html, manifest, logos, css de la landing y aviso de privacidad
src/
  api/                  instancia de axios (token, URL base, cierre de sesión con 401)
  components/           secciones de la página principal (landing) y ProtectedRoute
  pages/                Landing, Login, Register, Dashboard y NotFound
  dashboard/
    pages/              Inicio, Productos, Ventas, Clientes, Créditos, Reportes, Mi Negocio
    components/         Sidebar y TopBar del panel
  utils/                formatos (dinero, fechas, folios), reglas de venta, RFC,
                        constantes, eventos y URLs de imágenes
  hooks/                useWindowWidth, useIsMobile y useMensaje
  data/                 textos de la página principal
```

Las reglas compartidas (cálculo del total de una venta, validación de RFC,
formatos) están en `src/utils` y siguen las mismas reglas que el backend y la
app móvil (`annie-mobile/src/lib`).

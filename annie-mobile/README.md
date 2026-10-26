# Annie — App móvil (React Native + Expo)

App de celular de **Annie** para Android y iPhone. Usa **el mismo backend y la misma base de datos** que la página web (`annie-frontend`): lo que registres en el celular aparece en la web y al revés.

## ¿Qué se puede hacer?

| Sección | Funciones |
|---|---|
| **Inicio** | Ventas de hoy y del mes (con comparación contra el mes anterior), ticket promedio, saldo por cobrar, gráfica de los últimos 7 días, productos más vendidos, stock bajo y últimas ventas |
| **Ventas** | Lista con búsqueda por **folio**, producto o cliente; filtros (hoy, 7 días, mes, todo); totales en efectivo y a crédito |
| **Nueva venta** | Producto, cantidad, cliente, descuento (% o $), fecha, **método de pago** (efectivo o crédito, solo si el cliente tiene crédito), **paga con** y **cambio** con billetes sugeridos. Al cobrar: **folio, total, paga con y cambio**, con opción de **imprimir** o **compartir el ticket en PDF** |
| **Detalle de venta** | Ticket, reimprimir o compartir, **cancelar venta** (regresa el producto al inventario y revierte el crédito) |
| **Productos** | Inventario con valor, stock bajo, categorías, búsqueda y orden; alta y edición con **foto desde la galería o la cámara**, precio, costo, margen, stock y unidad |
| **Clientes** | Compras y total gastado por cliente; alta y edición; activar **crédito de mayoreo** (RFC, tipo de persona, límite) |
| **Créditos** | Total por cobrar, clientes sobre su límite, **estado de cuenta** con cargos y abonos |
| **Reportes** | Ventas por día (7/15/30), productos más vendidos, ventas por categoría y por día de la semana, mejores clientes, ganancia neta y **exportar ventas a CSV/Excel** |
| **Mi negocio** | Logo, datos del negocio, RFC, estado, ciudad y datos del propietario |

La sesión se guarda **cifrada** en el teléfono (SecureStore) y dura 30 días.

## Requisitos

- Node.js 22.13 o más reciente (recomendado 24).
- En el celular: la app **Expo Go** para **SDK 54**: en iPhone, la de la App Store; en Android, si la de Play Store es para un SDK más nuevo, instala la de SDK 54 desde https://expo.dev/go. El proyecto se queda en Expo SDK 54 (React Native 0.81) por Expo Go de la App Store: no actualices el SDK sin revisar que Expo Go lo soporte.
- El backend de Annie corriendo (en Render o en tu computadora).

## Instalación

```bash
cd annie-mobile
npm install
```

## Configurar el servidor (backend)

La app necesita saber la dirección del backend. Hay tres formas (de mayor a menor prioridad):

1. **Desde la app**: en la pantalla de inicio de sesión toca **"Servidor"** (o en *Más → Servidor*), escribe la dirección, toca **Probar conexión** y **Guardar**.
2. **Archivo `.env`** (copia `.env.example`):
   ```
   EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com
   ```
3. **Sin configurar nada, en desarrollo**: la app usa la computadora que corre Expo en el puerto 5000 (`http://IP-de-tu-compu:5000`), así que funciona con el backend local si el celular está en la **misma red Wi-Fi**.

> En Render (plan gratuito) el servidor se "duerme": la primera petición puede tardar hasta un minuto. La app espera y muestra un mensaje claro si tarda demasiado.

## Correr la app

```bash
npx expo start
```

Escanea el código QR con **Expo Go** (Android) o con la cámara (iPhone).

### Probar todo en local sin MongoDB

En otra terminal, dentro de `annie-backend`:

```bash
npm install
npm run dev:memoria     # backend con base de datos en memoria (puerto 5000)
npm run seed:demo       # en otra terminal: crea un negocio de demostración con datos
```

El comando `seed:demo` imprime el correo y la contraseña de la cuenta de demostración.

## Pruebas y calidad

```bash
npm test             # pruebas (Jest + Testing Library)
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run doctor       # diagnóstico de dependencias de Expo
```

Las pruebas cubren las reglas de negocio (totales, descuentos, cambio, crédito, fechas, RFC, reportes, CSV, ticket, sesión y cliente HTTP) y las pantallas de **inicio de sesión** y **nueva venta** de punta a punta (con un backend simulado).

## Generar el APK (Android)

Con una cuenta gratuita de [Expo](https://expo.dev):

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Al terminar, EAS da un enlace para descargar el **APK** e instalarlo en cualquier Android. Antes de compilar, define la dirección del backend en `eas.json` (`build.preview.env.EXPO_PUBLIC_API_URL`) o configúrala después desde la app en *Servidor*.

## Estructura

```
annie-mobile/
├── app.json                 Configuración de Expo (nombre, íconos, permisos)
├── eas.json                 Perfiles para compilar APK / tiendas
├── assets/images/           Íconos y logos de Annie
├── src/
│   ├── app/                 Pantallas (Expo Router: cada archivo es una ruta)
│   │   ├── _layout.tsx      Raíz: fuentes, React Query, sesión y rutas protegidas
│   │   ├── login.tsx, registro.tsx, servidor.tsx
│   │   ├── (tabs)/          Inicio, Ventas, Productos, Clientes, Más
│   │   ├── venta/           nueva.tsx, [id].tsx (detalle / ticket)
│   │   ├── producto/[id].tsx, cliente/[id].tsx
│   │   ├── creditos/        index.tsx, [id].tsx (estado de cuenta)
│   │   ├── reportes.tsx, negocio.tsx
│   ├── components/          TicketCard, VentaItem y el kit de UI (components/ui)
│   ├── context/auth.tsx     Sesión (inicio, registro, cierre, sesión vencida)
│   ├── lib/                 API, consultas, reglas de venta, reportes, ticket, validaciones
│   └── theme.ts             Colores (azul #3284F7 del logo) y tipografía Poppins
└── __tests__/               Pruebas
```

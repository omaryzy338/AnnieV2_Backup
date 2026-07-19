# Annie en Docker

Stack completo en contenedores: **MongoDB + Backend (Express) + Frontend (React/nginx)**.

## Requisitos
- Docker Desktop instalado y corriendo.

## Levantar todo

```bash
docker compose up --build
```

La primera vez tarda unos minutos (instala dependencias y compila el frontend).

Cuando termine:

| Servicio | URL |
|----------|-----|
| Frontend (HTTP) | http://localhost:8080 |
| Frontend (HTTPS) | https://localhost:8443 (certificado local, ver `certs/README.md`) |
| Backend (API) | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017/annie_db |

## Comandos útiles

```bash
# Correr en segundo plano
docker compose up --build -d

# Ver logs
docker compose logs -f backend

# Apagar (conserva los datos)
docker compose down

# Apagar y BORRAR la base de datos y las imágenes subidas
docker compose down -v

# Reconstruir sólo un servicio
docker compose build frontend
```

## Variables de entorno

- **JWT_SECRET**: por defecto usa un valor inseguro. Para producción, crea un archivo `.env`
  en la raíz del proyecto con:

  ```
  JWT_SECRET=una_clave_larga_y_segura_aqui
  ```

  Docker Compose lo lee automáticamente.

- **DB_URI**: dentro de Docker apunta a `mongodb://mongo:27017/annie_db` (el servicio `mongo`).
  No hace falta instalar MongoDB en tu máquina.

- **REACT_APP_API_URL**: la URL del backend se hornea al construir el frontend
  (`http://localhost:5000`). Si cambias el puerto del backend, ajústalo en `docker-compose.yml`
  y reconstruye el frontend.

## HTTPS local

```bash
sh certs/generate-self-signed.sh
docker compose up -d --build frontend
```

Abre https://localhost:8443 — el navegador va a avisar que el certificado no es de
confianza (es autofirmado, normal en desarrollo). Detalles y cómo usar un certificado
real en producción: ver `certs/README.md`.

## Datos de demostración

Para llenar la base con productos (con fotos reales), clientes de mayoreo con RFC
válido, ventas de los últimos 30 días y un ejemplo de solicitud de aumento de
crédito pendiente:

```bash
cd annie-backend
npm run seed:demo
```

Crea una cuenta nueva (no toca tus datos reales): `demo@annie.app` / `Demo2026!`

## Notas

- Las imágenes de productos se guardan en el volumen `uploads_data` (persisten entre reinicios).
- Los datos de Mongo se guardan en el volumen `mongo_data`.
- El backend espera a que MongoDB esté listo (`healthcheck`) antes de arrancar.

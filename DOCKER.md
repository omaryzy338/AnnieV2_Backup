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
| Frontend | http://localhost:8080 |
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

## Notas

- Las imágenes de productos se guardan en el volumen `uploads_data` (persisten entre reinicios).
- Los datos de Mongo se guardan en el volumen `mongo_data`.
- El backend espera a que MongoDB esté listo (`healthcheck`) antes de arrancar.

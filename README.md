# AnnieV2_Backup
Repositorio del proyecto Annie 2.0.

Este README proporciona información básica sobre la estructura del proyecto y cómo levantar el entorno de desarrollo.

## Estructura
- `annie-backend/` – servidor Node/Express con API REST y autenticación JWT.
- `annie-frontend/` – aplicación React (CRA) que consume la API.

## Para iniciar
1. Configurar variables de entorno (`.env`) en cada subcarpeta.
2. Instalar dependencias:
   ```bash
   cd annie-backend && npm install
   cd ../annie-frontend && npm install
   ```
3. Levantar servicios:
   ```bash
   cd annie-backend && npm start
   cd ../annie-frontend && npm start
   ```

> Recuerda no modificar los estilos globales del frontend: la identidad visual ya está definida.

# Configurar la base de datos de Annie en MongoDB Atlas

Guía para crear la base de datos en la nube (gratis) y conectar el backend de Annie. Toma unos 10 minutos.

## 1. Crear la cuenta

1. Entra a <https://www.mongodb.com/cloud/atlas/register>.
2. Regístrate con tu cuenta de Google.
3. Si aparecen preguntas de bienvenida, contesta cualquier opción (por ejemplo "Learning MongoDB" y "JavaScript").

## 2. Crear el clúster gratuito

1. Toca **Create** (o **Build a Database**).
2. Elige el plan **M0 – Free**. No cuesta nada y no pide tarjeta.
3. Proveedor **AWS** y la región más cercana a México, por ejemplo *N. Virginia (us-east-1)*.
4. Nombre: `annie`.
5. Toca **Create Deployment**.

## 3. Crear el usuario de la base

En la ventana "Connect to annie" (o en **Security → Database Access**):

1. **Username:** `annie_app`.
2. **Password:** toca **Autogenerate Secure Password**, **cópiala y guárdala**. Usa solo letras y números.
3. Toca **Create Database User**.

## 4. Permitir la conexión desde internet

1. Ve a **Security → Network Access → Add IP Address**.
2. Toca **Allow access from anywhere** (pone `0.0.0.0/0`) y **Confirm**.

Es necesario porque el servidor en Render cambia de dirección IP.

## 5. Copiar la dirección de conexión (URI)

1. Ve a **Database → Clusters** y en tu clúster toca **Connect**.
2. Elige **Drivers** y después **Node.js**.
3. Copia la dirección, que se ve así:

   ```
   mongodb+srv://annie_app:<db_password>@annie.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=annie
   ```

4. Cambia `<db_password>` por la contraseña del paso 3 (borra también `<` y `>`).
5. Después de `.mongodb.net/` agrega el nombre de la base, `annie_db`:

   ```
   mongodb+srv://annie_app:TUCONTRASEÑA@annie.xxxxx.mongodb.net/annie_db?retryWrites=true&w=majority&appName=annie
   ```

## 6. Compartirla de forma segura

- Mándala **solo por mensaje privado** a quien la necesite. Nunca en el grupo, en GitHub ni en documentos compartidos.
- La URI incluye la contraseña: quien la tenga puede leer y borrar la base.
- Si alguna vez se publica por error, cámbiala en **Security → Database Access → Edit → Edit Password** y actualiza la URI en todos lados.

## 7. (Opcional) Dar acceso al equipo

En Atlas: **Access Manager → Invite to Project**, escribe el correo de la persona y dale el rol **Project Owner**.

---

## Conectar el backend

### En tu computadora

1. En la carpeta `annie-backend`, copia `.env.example` como **`.env`** (este archivo nunca se sube a GitHub).
2. Pega la URI en `DB_URI=` y pon una clave larga y aleatoria en `JWT_SECRET=`.
3. Comprueba la conexión:

   ```bash
   cd annie-backend
   npm run probar:conexion    # ¿conecta?, qué bases y colecciones hay (solo lectura)
   npm run test:nube          # pruebas contra Atlas en bases temporales que se borran solas
   ```

### En Render (versión publicada)

En **Render → annie-backend → Environment**, pon la misma URI en `DB_URI` y una clave en `JWT_SECRET`, y guarda. Render reinicia el servidor solo.

> La base nueva empieza vacía. Los datos de una base anterior no se copian automáticamente.

### Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| `bad auth` / `Authentication failed` | Usuario o contraseña incorrectos en la URI. Si la contraseña tiene símbolos (`@ : / ? #`), cámbiala por una de solo letras y números. |
| `querySrv ENOTFOUND` | La dirección del clúster está mal copiada o no hay internet. |
| `Server selection timed out` | Falta el paso 4 (Network Access) o tu red bloquea el puerto 27017. |

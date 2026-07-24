const mongoose = require('mongoose');

// En entornos serverless (Vercel) el archivo se ejecuta en cada invocación
// "en frío", pero el proceso puede reutilizarse entre peticiones. Si abriéramos
// una conexión nueva cada vez agotaríamos el límite de conexiones de Atlas,
// así que la cacheamos y reutilizamos la misma promesa.
let cached = global.__mongooseConn;
if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  const uri = process.env.DB_URI;
  if (!uri) {
    // No matar el proceso: en serverless eso tumba toda la función. Se
    // registra el error y las rutas responderán 500 con un mensaje claro.
    console.error('❌ Falta la variable de entorno DB_URI');
    throw new Error('Falta la variable de entorno DB_URI');
  }

  if (!cached.promise) {
    const isAtlas = uri.includes('mongodb+srv');
    console.log(`🔌 Conectando a: ${isAtlas ? '☁️  Atlas (cloud)' : '💻 MongoDB local'}`);

    cached.promise = mongoose
      .connect(uri, {
        // Si Atlas no responde, fallar rápido en vez de colgar la función
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log('✅ MongoDB conectado correctamente');
        return m;
      })
      .catch((err) => {
        // Limpiar la promesa fallida para poder reintentar en la próxima petición
        cached.promise = null;
        console.error('❌ Error al conectar a MongoDB:', err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;

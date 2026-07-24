require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');
const Upload = require('./models/Upload');

// crear la aplicación express
const app = express();

// conectar base de datos (la conexión se cachea, ver config/db.js)
connectDB().catch((err) => console.error('Fallo inicial de conexión:', err.message));

// En serverless la función puede arrancar antes de que Mongo esté conectado.
// Este middleware espera a que la conexión exista antes de atender la petición,
// en vez de responder con errores raros de "buffering timed out".
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'No se pudo conectar a la base de datos. Revisa DB_URI.' });
  }
});

// ✅ Configuración de CSP con Helmet
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'none'"]
    },
  })
);

// Configuración de CORS. CORS_ORIGIN acepta una lista separada por comas
// (ej. "https://mi-app.vercel.app") para producción. Además se permiten
// automáticamente los despliegues de Vercel (incluidos los previews, que
// cambian de subdominio en cada deploy) y los orígenes de desarrollo local.
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://localhost:8443',
];
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

app.use(cors({
  origin: (origin, cb) => {
    // Sin origin = misma máquina (curl, apps móviles, healthchecks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Cualquier despliegue de Vercel (producción y previews)
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
    return cb(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// middleware
app.use(express.json());

// ── Servir imágenes guardadas en MongoDB ─────────────────────────
// Antes se servían desde disco con express.static, pero en Vercel el sistema
// de archivos es efímero. Ahora viven en la colección "uploads".
app.get('/uploads/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }
    const file = await Upload.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Imagen no encontrada' });

    res.set('Content-Type', file.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(file.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener la imagen' });
  }
});

// ✅ Servir archivos estáticos (incluye tus íconos y robots.txt en /public)
app.use(express.static(path.join(__dirname, 'public')));

// ruta raíz — verificar que la API está viva
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Annie API funcionando correctamente 🚀' });
});

// rutas
const authRoutes     = require('./routes/auth');
const profileRoutes  = require('./routes/profile');
const productsRoutes = require('./routes/products');
const salesRoutes    = require('./routes/sales');
const clientsRoutes  = require('./routes/clients');
const creditsRoutes  = require('./routes/credits');

app.use('/auth',     authRoutes);
app.use('/profile',  profileRoutes);
app.use('/products', productsRoutes);
app.use('/sales',    salesRoutes);
app.use('/clients',  clientsRoutes);
app.use('/credits',  creditsRoutes);

// Middleware de manejo de errores de multer y otros
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo debe pesar menos de 3MB' });
    }
    return res.status(400).json({ message: err.message || 'Error al subir archivo' });
  }
  if (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Error interno del servidor' });
  }
  next();
});

// En Vercel la app corre como función serverless: se exporta y la plataforma
// se encarga de atender las peticiones (no debe llamarse app.listen).
// En local y en Docker sí levantamos el servidor normalmente.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

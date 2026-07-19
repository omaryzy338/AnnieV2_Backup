require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');

// crear la aplicación express
const app = express();

// conectar base de datos
connectDB();

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

// Configuración estricta de CORS. CORS_ORIGIN acepta una lista separada por
// comas (ej. "http://localhost:8080,https://miapp.com") para producción;
// por defecto incluye los orígenes usados en desarrollo local y en el
// stack de Docker de este proyecto (ver docker-compose.yml).
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://localhost:8443',
];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : defaultOrigins;

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

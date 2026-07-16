require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/db');

// crear la aplicación express
const app = express();

// conectar base de datos
connectDB();

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

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

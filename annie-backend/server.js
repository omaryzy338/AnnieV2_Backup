require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// crear la aplicación express
const app = express();

// conectar base de datos
connectDB();

// middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// rutas
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const menuRoutes = require('./routes/menu');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const clientsRoutes = require('./routes/clients');

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/menu', menuRoutes);
app.use('/products', productsRoutes);
app.use('/sales', salesRoutes);
app.use('/clients', clientsRoutes);

// inicio del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

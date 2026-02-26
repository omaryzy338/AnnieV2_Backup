const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar a MongoDB
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.send("Bienvenido a Annie Backend 🚀");
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

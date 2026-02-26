const express = require('express');
const router = express.Router();

// Crear menú
router.post('/', (req, res) => {
  res.json({ message: "Ruta de creación de menú funcionando 🚀" });
});

// Obtener menú
router.get('/', (req, res) => {
  res.json({ message: "Ruta de obtener menú funcionando 🚀" });
});

module.exports = router;

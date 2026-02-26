const express = require('express');
const router = express.Router();

// Crear perfil
router.post('/', (req, res) => {
  res.json({ message: "Ruta de creación de perfil funcionando 🚀" });
});

// Obtener perfil
router.get('/', (req, res) => {
  res.json({ message: "Ruta de obtener perfil funcionando 🚀" });
});

module.exports = router;

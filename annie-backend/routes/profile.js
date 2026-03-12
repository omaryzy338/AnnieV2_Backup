const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// crear perfil (ejemplo)
router.post('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: creación de perfil 🚀" });
});

// obtener perfil
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: obtener perfil 🚀" });
});

module.exports = router;

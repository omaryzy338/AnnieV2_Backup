const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ruta de ejemplo para menú
router.post('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: creación de menú 🚀" });
});

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: "Ruta protegida: obtener menú 🚀" });
});

module.exports = router;

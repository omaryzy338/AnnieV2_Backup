const express = require('express');
const router = express.Router();

// Registro
router.post('/register', (req, res) => {
  res.json({ message: "Ruta de registro funcionando 🚀" });
});

// Login
router.post('/login', (req, res) => {
  res.json({ message: "Ruta de login funcionando 🚀" });
});

module.exports = router;

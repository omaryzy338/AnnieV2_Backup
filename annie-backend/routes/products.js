const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ejemplos de rutas CRUD
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Lista de productos (a implementar)' });
});

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: 'Crear producto (a implementar)' });
});

module.exports = router;

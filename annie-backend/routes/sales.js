const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Lista de ventas (a implementar)' });
});

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: 'Registrar venta (a implementar)' });
});

module.exports = router;

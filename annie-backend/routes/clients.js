const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Client = require('../models/Client');

// ── GET /clients — listar todos los clientes del usuario ──────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await Client.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

// ── GET /clients/:id — obtener un cliente ─────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
});

// ── POST /clients — crear cliente ─────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name)
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });

    const client = new Client({ name, email, phone, owner: req.user.id });
    await client.save();

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

// ── PUT /clients/:id — actualizar cliente ─────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, email, phone },
      { new: true, runValidators: true }
    );

    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

// ── DELETE /clients/:id — eliminar cliente ────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

module.exports = router;

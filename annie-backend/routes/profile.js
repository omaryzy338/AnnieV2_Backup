const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Business = require('../models/Business');

// ── GET /profile — ver perfil del usuario y su negocio ───────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const business = await Business.findOne({ owner: req.user.id });

    res.json({ user, business });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

// ── PUT /profile — actualizar datos del usuario ──────────────────
router.put('/user', authMiddleware, async (req, res) => {
  try {
    const { name, lastName } = req.body;

    if (!name || !lastName)
      return res.status(400).json({ message: 'name y lastName son obligatorios' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, lastName },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// ── PUT /profile/business — actualizar datos del negocio ─────────
router.put('/business', authMiddleware, async (req, res) => {
  try {
    const { name, address, phone, category, description } = req.body;

    const business = await Business.findOneAndUpdate(
      { owner: req.user.id },
      { name, address, phone, category, description },
      { new: true, runValidators: true }
    );

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json(business);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar negocio' });
  }
});

module.exports = router;

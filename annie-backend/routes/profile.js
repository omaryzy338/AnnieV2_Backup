const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Business = require('../models/Business');
const { validarRFC, esRFCGenerico } = require('../utils/rfc');

// Multer para logo del negocio
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo imágenes jpg, png o webp'));
  },
});

// ── GET /profile — ver perfil del usuario y su negocio ───────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const business = await Business.findOne({ owner: req.user.id });
    const businessData = business
      ? { ...business.toObject(), rfcGenerico: esRFCGenerico(business.rfc) }
      : null;

    res.json({ user, business: businessData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

// ── PUT /profile — actualizar datos del usuario ──────────────────
router.put('/user', authMiddleware, async (req, res) => {
  try {
    const { name, lastName, birthDate, country, state, city } = req.body;

    if (!name || !lastName)
      return res.status(400).json({ message: 'name y lastName son obligatorios' });

    const update = { name, lastName };
    if (birthDate !== undefined) update.birthDate = birthDate || null;
    if (country !== undefined)   update.country   = country;
    if (state !== undefined)     update.state     = state;
    if (city !== undefined)      update.city      = city;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      update,
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
    const { name, address, phone, category, description, country, state, city, rfc } = req.body;

    const update = { name, address, phone, category, description, country, state, city };

    // RFC opcional: si lo mandan y no está vacío, debe ser válido (física u moral)
    if (rfc !== undefined) {
      if (rfc && rfc.trim()) {
        const v = validarRFC(rfc);
        if (!v.ok) return res.status(400).json({ message: v.message });
        update.rfc = v.rfc;
      } else {
        update.rfc = '';
      }
    }

    const business = await Business.findOneAndUpdate(
      { owner: req.user.id },
      update,
      { new: true, runValidators: true }
    );

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json({ ...business.toObject(), rfcGenerico: esRFCGenerico(business.rfc) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar negocio' });
  }
});

// ── POST /profile/business/logo — subir logo del negocio ─────────
router.post('/business/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });

    const url = `/uploads/${req.file.filename}`;
    const business = await Business.findOneAndUpdate(
      { owner: req.user.id },
      { logo: url },
      { new: true }
    );

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json({ logo: business.logo, business });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al subir logo' });
  }
});

module.exports = router;

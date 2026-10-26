const express = require('express');
const router = express.Router();
const { responderError } = require('../utils/errores');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { soloDueno } = authMiddleware;
const User = require('../models/User');
const Business = require('../models/Business');
const Upload = require('../models/Upload');
const { detectarTipoImagen } = require('../utils/imagen');
const { validarRFC, esRFCGenerico, GENERIC_RFC } = require('../utils/rfc');
const { rolDe } = require('../utils/roles');

// El logo se recibe en memoria y se guarda en MongoDB (en Vercel el disco es
// de solo lectura y efímero, no se puede escribir en /uploads).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(Object.assign(new Error('Solo imágenes jpg, png o webp'), { status: 400 }));
  },
});

// Datos del usuario para responder (ya sin contraseña), siempre con su rol:
// los usuarios anteriores a los roles no tienen el campo y son dueños
const conRol = (user) => ({ ...user.toJSON(), rol: rolDe(user) });

// ── GET /profile — ver perfil del usuario y su negocio ───────────
// Para un empleado, el negocio es el de su dueño.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const business = await Business.findOne({ owner: req.ownerId });
    const businessData = business
      ? { ...business.toObject(), rfcGenerico: esRFCGenerico(business.rfc) }
      : null;

    res.json({ user: conRol(user), business: businessData });
  } catch (err) {
    responderError(res, err, 'Error al obtener perfil');
  }
});

// ── PUT /profile/user — actualizar datos del usuario ──────────────────
// Cada quien (dueño o empleado) edita solo sus propios datos.
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
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    res.json(user ? conRol(user) : user);
  } catch (err) {
    responderError(res, err, 'Error al actualizar usuario');
  }
});

// ── PUT /profile/business — actualizar datos del negocio (solo el dueño)
router.put('/business', authMiddleware, soloDueno, async (req, res) => {
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
        update.rfc = GENERIC_RFC;
      }
    }

    const business = await Business.findOneAndUpdate(
      { owner: req.ownerId },
      update,
      { returnDocument: 'after', runValidators: true }
    );

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json({ ...business.toObject(), rfcGenerico: esRFCGenerico(business.rfc) });
  } catch (err) {
    responderError(res, err, 'Error al actualizar negocio');
  }
});

// ── POST /profile/business/logo — subir logo (solo el dueño) ─────
router.post('/business/logo', authMiddleware, soloDueno, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });

    // Se revisa el contenido real del archivo (no solo la extensión)
    const tipo = detectarTipoImagen(req.file.buffer);
    if (!tipo || tipo === 'image/gif') return res.status(400).json({ message: 'El archivo no es una imagen válida (jpg, png o webp)' });

    const doc = await Upload.create({
      data: req.file.buffer,
      contentType: tipo,
      filename: req.file.originalname,
      size: req.file.size,
      owner: req.ownerId,
    });

    // Misma forma de URL que antes, para no cambiar nada en el frontend
    const url = `/uploads/${doc._id}`;
    const business = await Business.findOneAndUpdate(
      { owner: req.ownerId },
      { logo: url },
      { returnDocument: 'after' }
    );

    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json({ logo: business.logo, business });
  } catch (err) {
    responderError(res, err, 'Error al subir logo');
  }
});

module.exports = router;

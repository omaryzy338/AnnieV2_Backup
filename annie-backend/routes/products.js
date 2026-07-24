const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Upload = require('../models/Upload');

// La imagen se recibe en memoria y se guarda en MongoDB: en Vercel el disco
// es de solo lectura y efímero, así que no se puede escribir en /uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
  },
});

// ── POST /products/upload-image — subir imagen ───────────────────
router.post('/upload-image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    const doc = await Upload.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
      size: req.file.size,
      owner: req.user.id,
    });

    // Misma forma de URL que antes, para no cambiar nada en el frontend
    res.json({ url: `/uploads/${doc._id}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
});

// ── GET /products — listar todos los productos del usuario ────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// ── GET /products/:id — obtener un producto ───────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user.id });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

// ── POST /products — crear producto ──────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, quantity, discount, category, brand, unit, image, cost } = req.body;

    if (!name || price === undefined)
      return res.status(400).json({ message: 'name y price son obligatorios' });

    if (price < 0)
      return res.status(400).json({ message: 'El precio no puede ser negativo' });

    if (discount !== undefined && (discount < 0 || discount > 100))
      return res.status(400).json({ message: 'El descuento debe estar entre 0 y 100' });

    const product = new Product({
      name, description, price, quantity, discount, category, brand, unit, image, cost,
      owner: req.user.id
    });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

// ── PUT /products/:id — actualizar producto ───────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, quantity, discount, category, brand, unit, image, cost } = req.body;

    if (price !== undefined && price < 0)
      return res.status(400).json({ message: 'El precio no puede ser negativo' });

    if (discount !== undefined && (discount < 0 || discount > 100))
      return res.status(400).json({ message: 'El descuento debe estar entre 0 y 100' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, description, price, quantity, discount, category, brand, unit, image, cost },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

// ── DELETE /products/:id — eliminar producto ──────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

module.exports = router;

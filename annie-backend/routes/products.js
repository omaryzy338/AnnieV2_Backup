const express = require('express');
const router = express.Router();
const { responderError, validarId } = require('../utils/errores');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { soloDueno } = authMiddleware;
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Upload = require('../models/Upload');
const { detectarTipoImagen } = require('../utils/imagen');

// Un id mal formado responde 404 (no 500)
router.param('id', validarId('Producto no encontrado'));

// El costo es información del dueño (su margen): a los empleados no se les envía
const paraRespuesta = (req, product) => {
  if (req.esDueno) return product;
  const { cost, ...resto } = product.toJSON();
  return resto;
};

// La imagen se recibe en memoria y se guarda en MongoDB: en Vercel el disco
// es de solo lectura y efímero, así que no se puede escribir en /uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(Object.assign(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'), { status: 400 }));
  },
});

// Valida y normaliza los campos de un producto. En edición (parcial) solo se
// revisan los que vienen. Regresa { datos } o { error }.
function validarProducto(body, parcial) {
  const datos = {};
  const texto = ['name', 'description', 'category', 'brand', 'unit', 'image'];
  for (const k of texto) {
    if (body[k] !== undefined) datos[k] = body[k] === null ? '' : String(body[k]).trim();
  }
  if (!parcial || body.name !== undefined) {
    if (!datos.name) return { error: 'El nombre del producto es obligatorio' };
  }

  const numero = (k, { requerido = false, max, entero = false, nombre }) => {
    const v = body[k];
    if (v === undefined || v === null || v === '') {
      if (requerido && !parcial) return `${nombre} es obligatorio`;
      if (k === 'cost' && (v === null || v === '')) datos.cost = 0;
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) return `${nombre} debe ser un número`;
    if (n < 0) return `${nombre} no puede ser negativo`;
    if (max !== undefined && n > max) return `${nombre} no puede ser mayor a ${max}`;
    if (entero && !Number.isInteger(n)) return `${nombre} debe ser un número entero`;
    datos[k] = n;
    return null;
  };
  const errores = [
    numero('price', { requerido: true, nombre: 'El precio' }),
    numero('cost', { nombre: 'El costo' }),
    numero('quantity', { nombre: 'El stock' }),
    numero('discount', { max: 100, nombre: 'El descuento' }),
  ].filter(Boolean);
  if (errores.length) return { error: errores[0] };
  return { datos };
}

// ── POST /products/upload-image — subir imagen (solo el dueño) ───
router.post('/upload-image', authMiddleware, soloDueno, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    // Se revisa el contenido real del archivo (no solo la extensión)
    const tipo = detectarTipoImagen(req.file.buffer);
    if (!tipo) return res.status(400).json({ message: 'El archivo no es una imagen válida (jpg, png, webp o gif)' });

    const doc = await Upload.create({
      data: req.file.buffer,
      contentType: tipo,
      filename: req.file.originalname,
      size: req.file.size,
      owner: req.ownerId,
    });

    // Misma forma de URL que antes, para no cambiar nada en el frontend
    res.json({ url: `/uploads/${doc._id}` });
  } catch (err) {
    responderError(res, err, 'Error al subir la imagen');
  }
});

// ── GET /products — listar todos los productos del usuario ────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.ownerId, activo: { $ne: false } }).sort({ createdAt: -1 });
    res.json(products.map((p) => paraRespuesta(req, p)));
  } catch (err) {
    responderError(res, err, 'Error al obtener productos');
  }
});

// ── GET /products/:id — obtener un producto ───────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.ownerId, activo: { $ne: false } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(paraRespuesta(req, product));
  } catch (err) {
    responderError(res, err, 'Error al obtener producto');
  }
});

// ── POST /products — crear producto (solo el dueño) ──────────────
router.post('/', authMiddleware, soloDueno, async (req, res) => {
  try {
    const { datos, error } = validarProducto(req.body, false);
    if (error) return res.status(400).json({ message: error });

    const product = new Product({ ...datos, owner: req.ownerId });
    await product.save();

    res.status(201).json(product);
  } catch (err) {
    responderError(res, err, 'Error al crear producto');
  }
});

// ── PUT /products/:id — actualizar producto (solo el dueño) ───────
router.put('/:id', authMiddleware, soloDueno, async (req, res) => {
  try {
    const { datos, error } = validarProducto(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.ownerId, activo: { $ne: false } },
      datos,
      { returnDocument: 'after', runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    responderError(res, err, 'Error al actualizar producto');
  }
});

// ── DELETE /products/:id — eliminar producto (solo el dueño) ──────
// Si el producto ya tiene ventas se oculta (activo: false) en lugar de
// borrarse, para que los tickets anteriores sigan mostrando su nombre.
router.delete('/:id', authMiddleware, soloDueno, async (req, res) => {
  try {
    const filtro = { _id: req.params.id, owner: req.ownerId, activo: { $ne: false } };
    const conVentas = await Sale.exists({ product: req.params.id, owner: req.ownerId });
    const product = conVentas
      ? await Product.findOneAndUpdate(filtro, { activo: false }, { returnDocument: 'after' })
      : await Product.findOneAndDelete(filtro);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    responderError(res, err, 'Error al eliminar producto');
  }
});

module.exports = router;

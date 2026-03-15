const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// ── GET /sales — listar todas las ventas ─────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.find({ owner: req.user.id })
      .populate('product', 'name price')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
});

// ── POST /sales — registrar venta y descontar inventario ─────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity, clientId } = req.body;

    if (!productId || !quantity)
      return res.status(400).json({ message: 'productId y quantity son obligatorios' });

    if (quantity < 1)
      return res.status(400).json({ message: 'La cantidad debe ser al menos 1' });

    // Buscar el producto (solo del dueño)
    const product = await Product.findOne({ _id: productId, owner: req.user.id });
    if (!product)
      return res.status(404).json({ message: 'Producto no encontrado' });

    // Verificar stock suficiente
    if (product.quantity < quantity)
      return res.status(400).json({
        message: `Stock insuficiente. Disponible: ${product.quantity}`
      });

    // Calcular total con descuento
    const precioFinal = product.price - (product.price * (product.discount / 100));
    const total = parseFloat((precioFinal * quantity).toFixed(2));

    // Registrar la venta
    const sale = new Sale({
      product: product._id,
      client: clientId || null,
      quantity,
      price: product.price,
      discount: product.discount,
      total,
      owner: req.user.id
    });
    await sale.save();

    // Descontar del inventario automáticamente
    product.quantity -= quantity;
    await product.save();

    res.status(201).json({
      message: 'Venta registrada correctamente',
      sale,
      inventarioRestante: product.quantity
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar venta' });
  }
});

// ── GET /sales/resumen — total de ventas del usuario ─────────────
router.get('/resumen', authMiddleware, async (req, res) => {
  try {
    const ventas = await Sale.find({ owner: req.user.id });
    const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0);
    const cantidadVentas = ventas.length;
    res.json({
      cantidadVentas,
      totalVentas: parseFloat(totalVentas.toFixed(2))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
});

module.exports = router;

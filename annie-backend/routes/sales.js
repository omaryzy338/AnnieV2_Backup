const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// ── GET /sales — listar todas las ventas ─────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.find({ owner: req.user.id })
      .populate('product', 'name price image')
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
    const { productId, quantity, clientId, discount, discountType } = req.body;

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
    const descuento     = discount !== undefined ? Number(discount) : product.discount;
    const tipo          = discountType === 'fijo' ? 'fijo' : 'porcentaje';
    const precioFinal   = tipo === 'fijo'
      ? Math.max(0, product.price - descuento)
      : product.price - (product.price * descuento / 100);
    const total = parseFloat((Math.max(0, precioFinal) * quantity).toFixed(2));

    // Registrar la venta
    const sale = new Sale({
      product:      product._id,
      client:       clientId || null,
      quantity,
      price:        product.price,
      discount:     descuento,
      discountType: tipo,
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

// ── DELETE /sales/:id — eliminar venta ──────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.user.id });
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
    await sale.deleteOne();
    res.json({ message: 'Venta eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar venta' });
  }
});

module.exports = router;

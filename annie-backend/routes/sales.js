const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');
const CreditMovement = require('../models/CreditMovement');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Asigna folio a las ventas antiguas que no lo tienen (en orden de creación)
// y regresa el último folio usado por el negocio.
const asegurarFolios = async (owner) => {
  const sinFolio = await Sale.find({ owner, folio: { $exists: false } }).sort({ createdAt: 1 });
  const ultima = await Sale.findOne({ owner, folio: { $exists: true } }).sort({ folio: -1 });
  let ultimo = ultima?.folio || 0;
  for (const s of sinFolio) {
    ultimo += 1;
    s.folio = ultimo;
    await s.save();
  }
  return ultimo;
};

// ── GET /sales — listar todas las ventas ─────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    await asegurarFolios(req.user.id);
    const sales = await Sale.find({ owner: req.user.id })
      .populate('product', 'name price image')
      .populate('client', 'name lastName email')
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
    const { productId, quantity, clientId, discount, discountType, saleDate, paymentMethod, amountPaid } = req.body;
    const metodo = paymentMethod === 'credito' ? 'credito' : 'efectivo';

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

    // Validar método de pago
    let cliente = null;
    if (clientId) {
      cliente = await Client.findOne({ _id: clientId, owner: req.user.id });
      if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    let pagado = null;
    let cambio = 0;
    if (metodo === 'credito') {
      if (!cliente || !cliente.esMayoreo)
        return res.status(400).json({ message: 'Solo los clientes con crédito pueden pagar a crédito' });
      const disponible = round2((cliente.limiteCredito || 0) - (cliente.saldo || 0));
      if (total > disponible)
        return res.status(400).json({ message: `Crédito insuficiente. Disponible: $${disponible.toFixed(2)}` });
    } else {
      pagado = amountPaid !== undefined && amountPaid !== '' && amountPaid !== null ? round2(amountPaid) : total;
      if (Number.isNaN(pagado) || pagado < total)
        return res.status(400).json({ message: `El pago ($${(pagado || 0).toFixed(2)}) es menor al total ($${total.toFixed(2)})` });
      cambio = round2(pagado - total);
    }

    // Fecha: si viene con hora (ISO completo) se respeta; si solo trae el día
    // se usa la hora actual cuando es hoy, para que el ticket muestre la hora real.
    let fechaVenta = new Date();
    if (saleDate) {
      const f = new Date(saleDate.includes('T') ? saleDate : saleDate + 'T12:00:00');
      if (!Number.isNaN(f.getTime())) fechaVenta = f;
    }

    const folio = (await asegurarFolios(req.user.id)) + 1;

    // Registrar la venta
    const sale = new Sale({
      product:      product._id,
      folio,
      client:       cliente ? cliente._id : null,
      quantity,
      price:        product.price,
      discount:     descuento,
      discountType: tipo,
      total,
      saleDate:     fechaVenta,
      paymentMethod: metodo,
      amountPaid:   pagado,
      change:       cambio,
      owner: req.user.id
    });
    await sale.save();

    // Descontar del inventario automáticamente
    product.quantity -= quantity;
    await product.save();

    // Venta a crédito: cargo a la cuenta del cliente
    if (metodo === 'credito') {
      cliente.saldo = round2((cliente.saldo || 0) + total);
      await cliente.save();
      await CreditMovement.create({
        client: cliente._id,
        type: 'cargo',
        amount: total,
        description: `Venta folio ${folio}`,
        sale: sale._id,
        saldoDespues: cliente.saldo,
        owner: req.user.id,
      });
    }

    await sale.populate('product', 'name price image');
    await sale.populate('client', 'name lastName email');

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

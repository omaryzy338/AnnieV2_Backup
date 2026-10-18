const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { responderError, validarId } = require('../utils/errores');
const authMiddleware = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');
const CreditMovement = require('../models/CreditMovement');
const Counter = require('../models/Counter');

// Un id mal formado responde 404 (no 500)
router.param('id', validarId('Venta no encontrada'));

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Siguiente folio del negocio. Usa un contador atómico ($inc) para que dos
// ventas simultáneas (p. ej. desde la web y desde el celular) nunca reciban
// el mismo número. La primera vez arranca desde el folio más alto existente.
const siguienteFolio = async (owner) => {
  const _id = `sale-${owner}`;
  if (!(await Counter.exists({ _id }))) {
    const ultima = await Sale.findOne({ owner, folio: { $ne: null } }).sort({ folio: -1 }).select('folio');
    try {
      await Counter.updateOne({ _id }, { $max: { seq: ultima?.folio || 0 } }, { upsert: true });
    } catch (err) {
      // Otra petición creó el contador al mismo tiempo: no pasa nada
      if (err.code !== 11000) throw err;
    }
  }
  const c = await Counter.findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { returnDocument: 'after' });
  return c.seq;
};

// Asigna folio a las ventas antiguas que no lo tienen (en orden de creación)
const asegurarFolios = async (owner) => {
  const sinFolio = await Sale.find({ owner, folio: null }).sort({ createdAt: 1 });
  for (const s of sinFolio) {
    s.folio = await siguienteFolio(owner);
    await s.save();
  }
};

// Total de la venta. El descuento en porcentaje se aplica al precio; el
// descuento fijo ($) se aplica una sola vez al importe completo de la venta
// (igual que lo muestra el formulario y el ticket).
const calcularTotal = (price, quantity, discount, discountType) => {
  const importe = price * quantity;
  const total = discountType === 'fijo'
    ? importe - discount
    : importe - (importe * discount / 100);
  return round2(Math.max(0, total));
};

// ── GET /sales — listar todas las ventas ─────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    await asegurarFolios(req.user.id);
    const sales = await Sale.find({ owner: req.user.id })
      .populate('product', 'name price image unit category')
      .populate('client', 'name lastName email')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    responderError(res, err, 'Error al obtener ventas');
  }
});

// ── POST /sales — registrar venta y descontar inventario ─────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, clientId, discountType, saleDate, paymentMethod, amountPaid } = req.body || {};
    const metodo   = paymentMethod === 'credito' ? 'credito' : 'efectivo';
    const quantity = Number(req.body?.quantity);

    if (!productId || !req.body?.quantity)
      return res.status(400).json({ message: 'productId y quantity son obligatorios' });

    if (!Number.isInteger(quantity) || quantity < 1)
      return res.status(400).json({ message: 'La cantidad debe ser un número entero mayor o igual a 1' });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(404).json({ message: 'Producto no encontrado' });
    if (clientId && !mongoose.Types.ObjectId.isValid(clientId))
      return res.status(404).json({ message: 'Cliente no encontrado' });

    // Buscar el producto (solo del dueño)
    const product = await Product.findOne({ _id: productId, owner: req.user.id, activo: { $ne: false } });
    if (!product)
      return res.status(404).json({ message: 'Producto no encontrado' });

    if (product.quantity < quantity)
      return res.status(400).json({ message: `Stock insuficiente. Disponible: ${product.quantity}` });

    // Descuento
    const tipo      = discountType === 'fijo' ? 'fijo' : 'porcentaje';
    const descuento = req.body.discount !== undefined && req.body.discount !== ''
      ? Number(req.body.discount)
      : (product.discount || 0);
    if (Number.isNaN(descuento) || descuento < 0)
      return res.status(400).json({ message: 'El descuento no puede ser negativo' });
    if (tipo === 'porcentaje' && descuento > 100)
      return res.status(400).json({ message: 'El descuento en porcentaje no puede ser mayor a 100' });

    const total = calcularTotal(product.price, quantity, descuento, tipo);

    // Cliente y método de pago
    let cliente = null;
    if (clientId) {
      cliente = await Client.findOne({ _id: clientId, owner: req.user.id, activo: { $ne: false } });
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
    // se guarda a las 12:00 UTC para no cambiar de día por la zona horaria
    // (las apps reconocen ese caso y muestran la hora de registro).
    let fechaVenta = new Date();
    if (saleDate) {
      const f = new Date(String(saleDate).includes('T') ? saleDate : `${saleDate}T12:00:00Z`);
      if (!Number.isNaN(f.getTime())) fechaVenta = f;
    }

    // Descontar inventario de forma atómica: si otra venta se llevó el stock
    // entre la validación y este punto, la condición $gte falla.
    const actualizado = await Product.findOneAndUpdate(
      { _id: product._id, owner: req.user.id, quantity: { $gte: quantity } },
      { $inc: { quantity: -quantity } },
      { returnDocument: 'after' }
    );
    if (!actualizado) {
      const p = await Product.findById(product._id).select('quantity');
      return res.status(400).json({ message: `Stock insuficiente. Disponible: ${p?.quantity ?? 0}` });
    }
    const devolverStock = () =>
      Product.updateOne({ _id: product._id }, { $inc: { quantity } }).catch(() => {});

    // Venta a crédito: cargar al cliente de forma atómica sin pasar su límite
    let clienteCargado = null;
    if (metodo === 'credito') {
      clienteCargado = await Client.findOneAndUpdate(
        {
          _id: cliente._id,
          owner: req.user.id,
          esMayoreo: true,
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ['$saldo', 0] }, total] },
              { $add: [{ $ifNull: ['$limiteCredito', 0] }, 0.001] },
            ],
          },
        },
        { $inc: { saldo: total } },
        { returnDocument: 'after' }
      );
      if (!clienteCargado) {
        await devolverStock();
        return res.status(400).json({ message: 'Crédito insuficiente para esta venta' });
      }
      // Evitar acumulación de decimales flotantes en el saldo
      const redondeado = round2(clienteCargado.saldo);
      if (redondeado !== clienteCargado.saldo) {
        await Client.updateOne({ _id: cliente._id }, { $set: { saldo: redondeado } });
        clienteCargado.saldo = redondeado;
      }
    }
    const devolverCredito = () => clienteCargado
      ? Client.updateOne({ _id: cliente._id }, { $inc: { saldo: -total } }).catch(() => {})
      : Promise.resolve();

    let sale;
    try {
      await asegurarFolios(req.user.id);
      const folio = await siguienteFolio(req.user.id);
      sale = await Sale.create({
        product:       product._id,
        folio,
        client:        cliente ? cliente._id : null,
        quantity,
        price:         product.price,
        discount:      descuento,
        discountType:  tipo,
        total,
        saleDate:      fechaVenta,
        paymentMethod: metodo,
        amountPaid:    pagado,
        change:        cambio,
        owner:         req.user.id,
      });
    } catch (err) {
      await devolverStock();
      await devolverCredito();
      throw err;
    }

    if (clienteCargado) {
      await CreditMovement.create({
        client:       cliente._id,
        type:         'cargo',
        amount:       total,
        description:  `Venta folio ${sale.folio}`,
        sale:         sale._id,
        saldoDespues: clienteCargado.saldo,
        owner:        req.user.id,
      });
    }

    await sale.populate('product', 'name price image unit category');
    await sale.populate('client', 'name lastName email');

    res.status(201).json({
      message: 'Venta registrada correctamente',
      sale,
      inventarioRestante: actualizado.quantity,
    });
  } catch (err) {
    responderError(res, err, 'Error al registrar venta');
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
    responderError(res, err, 'Error al obtener resumen');
  }
});

// ── DELETE /sales/:id — cancelar venta ──────────────────────────
// Regresa el producto al inventario y, si fue a crédito, descuenta el cargo
// del saldo del cliente registrando un abono de cancelación.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Borrado atómico: si llegan dos cancelaciones de la misma venta al mismo
    // tiempo, solo una la encuentra, así el inventario y el crédito no se
    // regresan dos veces.
    const sale = await Sale.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });

    await Product.updateOne(
      { _id: sale.product, owner: req.user.id },
      { $inc: { quantity: sale.quantity } }
    );

    if (sale.paymentMethod === 'credito' && sale.client) {
      const cliente = await Client.findOne({ _id: sale.client, owner: req.user.id });
      if (cliente) {
        const monto = round2(Math.min(sale.total, cliente.saldo || 0));
        if (monto > 0) {
          cliente.saldo = round2((cliente.saldo || 0) - monto);
          await cliente.save();
          await CreditMovement.create({
            client:       cliente._id,
            type:         'abono',
            amount:       monto,
            description:  `Cancelación de venta folio ${sale.folio ?? ''}`.trim(),
            saldoDespues: cliente.saldo,
            owner:        req.user.id,
          });
        }
      }
    }

    res.json({ message: 'Venta eliminada' });
  } catch (err) {
    responderError(res, err, 'Error al eliminar venta');
  }
});

module.exports = router;
module.exports.calcularTotal = calcularTotal;

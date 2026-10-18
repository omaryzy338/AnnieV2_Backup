const express = require('express');
const router = express.Router();
const { responderError, validarId } = require('../utils/errores');
const authMiddleware = require('../middleware/authMiddleware');
const Client = require('../models/Client');
const CreditMovement = require('../models/CreditMovement');

// Un id mal formado responde 404 (no 500)
router.param('clientId', validarId('Cliente no encontrado'));

// Redondea a 2 decimales evitando errores de coma flotante
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// ── GET /credits — clientes de crédito/mayoreo con su saldo ───────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clientes = await Client.find({ owner: req.user.id, esMayoreo: true, activo: { $ne: false } })
      .sort({ createdAt: -1 });

    // Enriquecer con crédito disponible
    const data = clientes.map((c) => ({
      ...c.toObject(),
      creditoDisponible: Math.max(0, (c.limiteCredito || 0) - (c.saldo || 0)),
    }));

    res.json(data);
  } catch (err) {
    responderError(res, err, 'Error al obtener clientes de crédito');
  }
});

// ── GET /credits/resumen — totales de cuentas por cobrar ──────────
router.get('/resumen', authMiddleware, async (req, res) => {
  try {
    const clientes = await Client.find({ owner: req.user.id, esMayoreo: true, activo: { $ne: false } });
    const totalPorCobrar = clientes.reduce((a, c) => a + (c.saldo || 0), 0);
    const limiteTotal    = clientes.reduce((a, c) => a + (c.limiteCredito || 0), 0);
    const conDeuda       = clientes.filter((c) => (c.saldo || 0) > 0).length;
    const sobreLimite    = clientes.filter((c) => (c.saldo || 0) > (c.limiteCredito || 0)).length;

    res.json({
      clientesCredito: clientes.length,
      conDeuda,
      sobreLimite,
      totalPorCobrar: round2(totalPorCobrar),
      limiteTotal:    round2(limiteTotal),
      disponibleTotal: round2(Math.max(0, limiteTotal - totalPorCobrar)),
    });
  } catch (err) {
    responderError(res, err, 'Error al obtener resumen de crédito');
  }
});

// ── GET /credits/:clientId/movimientos — estado de cuenta ─────────
router.get('/:clientId/movimientos', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    const movimientos = await CreditMovement.find({
      client: client._id,
      owner: req.user.id,
    })
      .populate('sale', 'total quantity')
      .sort({ createdAt: -1 });

    res.json({ client, movimientos });
  } catch (err) {
    responderError(res, err, 'Error al obtener movimientos');
  }
});

// ── PUT /credits/:clientId/limite — ajustar límite de crédito ─────
router.put('/:clientId/limite', authMiddleware, async (req, res) => {
  try {
    const limite = Number(req.body.limiteCredito);
    if (Number.isNaN(limite) || limite < 0)
      return res.status(400).json({ message: 'El límite debe ser un número mayor o igual a 0' });

    const client = await Client.findOne({ _id: req.params.clientId, owner: req.user.id, activo: { $ne: false } });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    if (limite < (client.saldo || 0))
      return res.status(400).json({
        message: `El límite ($${limite.toFixed(2)}) no puede ser menor al saldo actual ($${client.saldo.toFixed(2)})`,
      });

    client.limiteCredito = round2(limite);
    await client.save();

    res.json({
      message: 'Límite de crédito actualizado',
      client,
      creditoDisponible: Math.max(0, client.limiteCredito - client.saldo),
    });
  } catch (err) {
    responderError(res, err, 'Error al actualizar límite');
  }
});

// Registra un cargo (compra a crédito) o un abono (pago) de forma ATÓMICA:
// la condición y el cambio de saldo van en una sola operación de MongoDB, así
// dos movimientos simultáneos no pueden pasar el límite de crédito ni dejar el
// saldo descuadrado respecto al historial.
async function registrarMovimiento(req, res, tipo) {
  const esCargo = tipo === 'cargo';
  const amount = round2(req.body.amount);
  const description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 200) : '';

  if (Number.isNaN(amount) || amount <= 0)
    return res.status(400).json({ message: `El monto del ${tipo} debe ser mayor a 0` });

  const filtro = { _id: req.params.clientId, owner: req.user.id, activo: { $ne: false } };
  const condicion = esCargo
    ? { esMayoreo: true, $expr: { $lte: [{ $add: [{ $ifNull: ['$saldo', 0] }, amount] }, { $add: [{ $ifNull: ['$limiteCredito', 0] }, 0.001] }] } }
    : { $expr: { $gte: [{ $ifNull: ['$saldo', 0] }, amount - 0.001] } };

  let client = await Client.findOneAndUpdate(
    { ...filtro, ...condicion },
    { $inc: { saldo: esCargo ? amount : -amount } },
    { returnDocument: 'after' }
  );

  if (!client) {
    // No se aplicó: explicar por qué
    const actual = await Client.findOne(filtro);
    if (!actual) return res.status(404).json({ message: 'Cliente no encontrado' });
    const saldo = actual.saldo || 0;
    if (esCargo && !actual.esMayoreo)
      return res.status(400).json({ message: 'Este cliente no tiene crédito habilitado (mayoreo)' });
    if (esCargo) {
      const disponible = round2(Math.max(0, (actual.limiteCredito || 0) - saldo));
      return res.status(400).json({
        message: `El cargo excede el crédito disponible. Disponible: $${disponible.toFixed(2)}, cargo solicitado: $${amount.toFixed(2)}`,
      });
    }
    return res.status(400).json({
      message: `El abono ($${amount.toFixed(2)}) es mayor al saldo pendiente ($${saldo.toFixed(2)})`,
    });
  }

  // Evitar decimales flotantes acumulados (y saldos negativos por redondeo)
  const redondeado = Math.max(0, round2(client.saldo));
  if (redondeado !== client.saldo) {
    client = await Client.findOneAndUpdate({ _id: client._id }, { $set: { saldo: redondeado } }, { returnDocument: 'after' });
  }

  let movimiento;
  try {
    movimiento = await CreditMovement.create({
      client: client._id,
      type: tipo,
      amount,
      description: description || (esCargo ? 'Compra a crédito' : 'Pago recibido'),
      saldoDespues: client.saldo,
      owner: req.user.id,
    });
  } catch (e) {
    // Revertir el saldo si no se pudo registrar el movimiento
    await Client.updateOne({ _id: client._id }, { $inc: { saldo: esCargo ? -amount : amount } }).catch(() => {});
    throw e;
  }

  res.status(201).json({
    message: esCargo ? 'Cargo registrado' : 'Abono registrado',
    movimiento,
    saldo: client.saldo,
    creditoDisponible: Math.max(0, round2((client.limiteCredito || 0) - client.saldo)),
  });
}

// ── POST /credits/:clientId/cargo — registrar compra a crédito ────
router.post('/:clientId/cargo', authMiddleware, async (req, res) => {
  try {
    await registrarMovimiento(req, res, 'cargo');
  } catch (err) {
    responderError(res, err, 'Error al registrar el cargo');
  }
});

// ── POST /credits/:clientId/abono — registrar pago del cliente ────
router.post('/:clientId/abono', authMiddleware, async (req, res) => {
  try {
    await registrarMovimiento(req, res, 'abono');
  } catch (err) {
    responderError(res, err, 'Error al registrar el abono');
  }
});

module.exports = router;

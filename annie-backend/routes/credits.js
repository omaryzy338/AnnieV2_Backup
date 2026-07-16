const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Client = require('../models/Client');
const CreditMovement = require('../models/CreditMovement');

// Redondea a 2 decimales evitando errores de coma flotante
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// ── GET /credits — clientes de crédito/mayoreo con su saldo ───────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clientes = await Client.find({ owner: req.user.id, esMayoreo: true })
      .sort({ createdAt: -1 });

    // Enriquecer con crédito disponible
    const data = clientes.map((c) => ({
      ...c.toObject(),
      creditoDisponible: Math.max(0, (c.limiteCredito || 0) - (c.saldo || 0)),
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener clientes de crédito' });
  }
});

// ── GET /credits/resumen — totales de cuentas por cobrar ──────────
router.get('/resumen', authMiddleware, async (req, res) => {
  try {
    const clientes = await Client.find({ owner: req.user.id, esMayoreo: true });
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
    console.error(err);
    res.status(500).json({ message: 'Error al obtener resumen de crédito' });
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
    console.error(err);
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
});

// ── PUT /credits/:clientId/limite — ajustar límite de crédito ─────
router.put('/:clientId/limite', authMiddleware, async (req, res) => {
  try {
    const limite = Number(req.body.limiteCredito);
    if (Number.isNaN(limite) || limite < 0)
      return res.status(400).json({ message: 'El límite debe ser un número mayor o igual a 0' });

    const client = await Client.findOne({ _id: req.params.clientId, owner: req.user.id });
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
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar límite' });
  }
});

// ── POST /credits/:clientId/cargo — registrar compra a crédito ────
router.post('/:clientId/cargo', authMiddleware, async (req, res) => {
  try {
    const amount = round2(req.body.amount);
    const { description } = req.body;

    if (Number.isNaN(amount) || amount <= 0)
      return res.status(400).json({ message: 'El monto del cargo debe ser mayor a 0' });

    const client = await Client.findOne({ _id: req.params.clientId, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    if (!client.esMayoreo)
      return res.status(400).json({ message: 'Este cliente no tiene crédito habilitado (mayoreo)' });

    const nuevoSaldo = round2((client.saldo || 0) + amount);
    const disponible = round2((client.limiteCredito || 0) - (client.saldo || 0));

    if (nuevoSaldo > (client.limiteCredito || 0))
      return res.status(400).json({
        message: `El cargo excede el crédito disponible. Disponible: $${disponible.toFixed(2)}, cargo solicitado: $${amount.toFixed(2)}`,
      });

    // Actualizar saldo y registrar el movimiento
    client.saldo = nuevoSaldo;
    await client.save();

    let movimiento;
    try {
      movimiento = await CreditMovement.create({
        client: client._id,
        type: 'cargo',
        amount,
        description: description || 'Compra a crédito',
        saldoDespues: nuevoSaldo,
        owner: req.user.id,
      });
    } catch (e) {
      // rollback del saldo si no se pudo registrar el movimiento
      client.saldo = round2(nuevoSaldo - amount);
      await client.save();
      throw e;
    }

    res.status(201).json({
      message: 'Cargo registrado',
      movimiento,
      saldo: client.saldo,
      creditoDisponible: Math.max(0, client.limiteCredito - client.saldo),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar el cargo' });
  }
});

// ── POST /credits/:clientId/abono — registrar pago del cliente ────
router.post('/:clientId/abono', authMiddleware, async (req, res) => {
  try {
    const amount = round2(req.body.amount);
    const { description } = req.body;

    if (Number.isNaN(amount) || amount <= 0)
      return res.status(400).json({ message: 'El monto del abono debe ser mayor a 0' });

    const client = await Client.findOne({ _id: req.params.clientId, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    if (amount > (client.saldo || 0))
      return res.status(400).json({
        message: `El abono ($${amount.toFixed(2)}) es mayor al saldo pendiente ($${(client.saldo || 0).toFixed(2)})`,
      });

    const nuevoSaldo = round2((client.saldo || 0) - amount);

    client.saldo = nuevoSaldo;
    await client.save();

    let movimiento;
    try {
      movimiento = await CreditMovement.create({
        client: client._id,
        type: 'abono',
        amount,
        description: description || 'Pago recibido',
        saldoDespues: nuevoSaldo,
        owner: req.user.id,
      });
    } catch (e) {
      client.saldo = round2(nuevoSaldo + amount);
      await client.save();
      throw e;
    }

    res.status(201).json({
      message: 'Abono registrado',
      movimiento,
      saldo: client.saldo,
      creditoDisponible: Math.max(0, client.limiteCredito - client.saldo),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar el abono' });
  }
});

module.exports = router;

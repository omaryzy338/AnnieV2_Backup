const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Client = require('../models/Client');
const { validarRFC } = require('../utils/rfc');

// Construye/valida los datos fiscales y de crédito a partir del body.
// Devuelve { data, error }. Si error !== null, responde 400 con ese mensaje.
function construirDatosCredito(body, actual = {}) {
  const data = {};

  // esMayoreo (booleano tolerante a strings "true"/"false")
  const esMayoreo = body.esMayoreo === true || body.esMayoreo === 'true';
  if (body.esMayoreo !== undefined) data.esMayoreo = esMayoreo;

  const mayoreoFinal = body.esMayoreo !== undefined ? esMayoreo : !!actual.esMayoreo;

  // No permitir quitar el crédito si el cliente todavía debe dinero
  if (body.esMayoreo !== undefined && !esMayoreo && (actual.saldo || 0) > 0) {
    return { error: `No se puede quitar el crédito: el cliente tiene un saldo pendiente de $${actual.saldo.toFixed(2)}` };
  }

  // tipoPersona
  let tipoPersona = actual.tipoPersona || '';
  if (body.tipoPersona !== undefined) {
    tipoPersona = body.tipoPersona || '';
    if (tipoPersona && !['fisica', 'moral'].includes(tipoPersona)) {
      return { error: 'tipoPersona debe ser "fisica" o "moral"' };
    }
    data.tipoPersona = tipoPersona;
  }

  // razonSocial
  if (body.razonSocial !== undefined) data.razonSocial = body.razonSocial;

  // RFC
  let rfc = actual.rfc || '';
  if (body.rfc !== undefined) {
    rfc = (body.rfc || '').trim();
    if (rfc) {
      const v = validarRFC(rfc, tipoPersona);
      if (!v.ok) return { error: v.message };
      rfc = v.rfc;
      // Si no venía tipoPersona lo deducimos del RFC
      if (!tipoPersona && v.tipo) data.tipoPersona = v.tipo;
    }
    data.rfc = rfc;
  }

  // limiteCredito
  if (body.limiteCredito !== undefined) {
    const limite = Number(body.limiteCredito);
    if (Number.isNaN(limite) || limite < 0) {
      return { error: 'El límite de crédito debe ser un número mayor o igual a 0' };
    }
    data.limiteCredito = limite;
  }

  // Reglas para clientes de mayoreo / crédito: RFC obligatorio y válido
  if (mayoreoFinal) {
    const rfcFinal = data.rfc !== undefined ? data.rfc : (actual.rfc || '');
    const tipoFinal = data.tipoPersona !== undefined ? data.tipoPersona : (actual.tipoPersona || '');
    if (!rfcFinal) {
      return { error: 'El RFC es obligatorio para clientes de mayoreo / crédito' };
    }
    if (!tipoFinal) {
      return { error: 'Debes indicar el tipo de persona (física o moral) para clientes de crédito' };
    }
    const v = validarRFC(rfcFinal, tipoFinal);
    if (!v.ok) return { error: v.message };
  }

  return { data };
}

// ── GET /clients — listar todos los clientes del usuario ──────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await Client.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

// ── GET /clients/:id — obtener un cliente ─────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
});

// ── POST /clients — crear cliente ─────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, lastName, email, phone, address, notes } = req.body;

    if (!name)
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });

    const { data, error } = construirDatosCredito(req.body);
    if (error) return res.status(400).json({ message: error });

    const client = new Client({
      name, lastName, email, phone, address, notes,
      ...data,
      saldo: 0, // el saldo siempre arranca en 0; se maneja por movimientos
      owner: req.user.id,
    });
    await client.save();

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

// ── PUT /clients/:id — actualizar cliente ─────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const actual = await Client.findOne({ _id: req.params.id, owner: req.user.id });
    if (!actual) return res.status(404).json({ message: 'Cliente no encontrado' });

    const { name, lastName, email, phone, address, notes } = req.body;

    const { data, error } = construirDatosCredito(req.body, actual);
    if (error) return res.status(400).json({ message: error });

    // Solo actualizamos los campos básicos que vengan definidos
    const update = { ...data };
    if (name     !== undefined) update.name     = name;
    if (lastName !== undefined) update.lastName = lastName;
    if (email    !== undefined) update.email    = email;
    if (phone    !== undefined) update.phone    = phone;
    if (address  !== undefined) update.address  = address;
    if (notes    !== undefined) update.notes    = notes;
    // NOTA: 'saldo' nunca se actualiza aquí; se gestiona en /credits

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      update,
      { new: true, runValidators: true }
    );

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
});

// ── DELETE /clients/:id — eliminar cliente ────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user.id });
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    // No permitir borrar un cliente que aún debe dinero
    if (client.saldo > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: el cliente tiene un saldo pendiente de $${client.saldo.toFixed(2)}`,
      });
    }

    await client.deleteOne();
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
});

module.exports = router;

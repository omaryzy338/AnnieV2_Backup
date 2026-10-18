const mongoose = require('mongoose');

// Nombres en español de los campos, para los mensajes de validación
const CAMPOS = {
  name: 'El nombre',
  lastName: 'El apellido',
  price: 'El precio',
  cost: 'El costo',
  quantity: 'La cantidad',
  discount: 'El descuento',
  limiteCredito: 'El límite de crédito',
  saldo: 'El saldo',
  amount: 'El monto',
  birthDate: 'La fecha de nacimiento',
  email: 'El email',
  tipoPersona: 'El tipo de persona',
};
const campo = (path) => CAMPOS[path] || `El campo "${path}"`;

// Traduce un error de Mongoose a un mensaje entendible para el usuario
function mensajeValidacion(err) {
  if (err.name === 'CastError') {
    if (err.kind === 'Number') return `${campo(err.path)} debe ser un número`;
    if (err.kind === 'date') return `${campo(err.path)} no es una fecha válida`;
    return `${campo(err.path)} no es válido`;
  }
  const primero = Object.values(err.errors || {})[0];
  if (!primero) return 'Datos inválidos';
  if (primero.name === 'CastError') return mensajeValidacion(primero);
  const { kind, path, properties } = primero;
  if (kind === 'required') return `${campo(path)} es obligatorio`;
  if (kind === 'min') return `${campo(path)} no puede ser menor a ${properties.min}`;
  if (kind === 'max') return `${campo(path)} no puede ser mayor a ${properties.max}`;
  if (kind === 'enum') return `${campo(path)} no es válido`;
  return `${campo(path)} no es válido`;
}

/**
 * Respuesta de error de una ruta: los errores de datos del usuario (validación,
 * tipos, duplicados) son 400 con un mensaje claro; lo demás es 500.
 */
function responderError(res, err, mensaje500) {
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ message: mensajeValidacion(err) });
  }
  if (err?.code === 11000) {
    return res.status(400).json({ message: 'Ya existe un registro con esos datos' });
  }
  console.error(err);
  return res.status(500).json({ message: mensaje500 });
}

/** Middleware para router.param: un id mal formado responde 404 en vez de 500. */
const validarId = (mensaje) => (req, res, next, valor) =>
  mongoose.Types.ObjectId.isValid(valor) ? next() : res.status(404).json({ message: mensaje });

module.exports = { responderError, validarId, mensajeValidacion };

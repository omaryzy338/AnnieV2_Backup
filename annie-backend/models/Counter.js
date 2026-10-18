const mongoose = require('mongoose');

// Contadores atómicos (ej. folio de ventas por negocio). El _id identifica
// el contador, p. ej. "sale-<ownerId>", y seq guarda el último valor usado.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);

const mongoose = require('mongoose');

// Estado de cuenta de crédito: cada compra a crédito es un "cargo"
// y cada pago del cliente es un "abono".
const creditMovementSchema = new mongoose.Schema({
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type:        { type: String, enum: ['cargo', 'abono'], required: true },
  amount:      { type: Number, required: true, min: 0.01 },
  description: { type: String, trim: true },
  // Referencia opcional a una venta (cuando el cargo proviene de una venta a crédito)
  sale:        { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
  // Saldo del cliente DESPUÉS de aplicar este movimiento (para historial)
  saldoDespues:{ type: Number, required: true, min: 0 },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('CreditMovement', creditMovementSchema);

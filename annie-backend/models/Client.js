const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  phone:    { type: String, trim: true },
  address:  { type: String, trim: true },
  notes:    { type: String, trim: true },

  // ── Datos fiscales (para facturación / crédito) ──────────────────
  tipoPersona: { type: String, enum: ['fisica', 'moral', ''], default: '' },
  rfc:         { type: String, trim: true, uppercase: true, default: '' },
  razonSocial: { type: String, trim: true }, // usado normalmente en persona moral

  // ── Crédito / mayoreo ────────────────────────────────────────────
  esMayoreo:     { type: Boolean, default: false },
  limiteCredito: { type: Number, default: 0, min: 0 },
  // saldo = crédito utilizado (lo que el cliente debe). Se gestiona SOLO
  // a través de los movimientos de crédito (cargos y abonos).
  saldo:         { type: Number, default: 0, min: 0 },

  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Crédito disponible calculado (no se persiste)
clientSchema.virtual('creditoDisponible').get(function () {
  return Math.max(0, (this.limiteCredito || 0) - (this.saldo || 0));
});

clientSchema.set('toJSON',   { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);

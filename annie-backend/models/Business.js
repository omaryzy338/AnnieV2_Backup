const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug:     { type: String, required: true, unique: true },
  address:  { type: String, trim: true },
  phone:    { type: String, trim: true },
  category: { type: String, trim: true },
  description: { type: String, trim: true },
  logo:     { type: String, trim: true },
  country:  { type: String, trim: true },
  state:    { type: String, trim: true },
  city:     { type: String, trim: true },
  // RFC del negocio (para poder facturar). Si el dueño no da uno al
  // registrarse se le asigna el RFC genérico oficial del SAT para público
  // en general ("XAXX010101000"); mientras tenga ese RFC genérico, no puede
  // facturar de verdad y por lo tanto no puede dar crédito a clientes.
  rfc:      { type: String, trim: true, uppercase: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);

const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  folio:    { type: Number, index: true }, // consecutivo por negocio (owner)
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // opcional
  quantity: { type: Number, required: true, min: 1 },
  price:        { type: Number, required: true },
  discount:     { type: Number, default: 0 },
  discountType: { type: String, enum: ['porcentaje', 'fijo'], default: 'porcentaje' },
  total:        { type: Number, required: true },
  saleDate:     { type: Date, default: null },
  paymentMethod:{ type: String, enum: ['efectivo', 'credito'], default: 'efectivo' },
  amountPaid:   { type: Number, default: null }, // con cuánto paga (efectivo)
  change:       { type: Number, default: 0 },    // cambio entregado
  // Quién registró la venta (el dueño o uno de sus empleados). El nombre se
  // copia al momento de vender para que el historial lo conserve aunque
  // después se elimine al empleado.
  vendedor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vendedorNombre: { type: String, trim: true, default: '' },
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

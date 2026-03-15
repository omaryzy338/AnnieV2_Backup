const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // opcional
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },   // precio unitario al momento de venta
  discount: { type: Number, default: 0 },       // descuento aplicado
  total:    { type: Number, required: true },   // total ya calculado
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);

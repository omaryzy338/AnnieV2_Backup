const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, default: 0, min: 0 },
  discount:    { type: Number, default: 0, min: 0, max: 100 }, // porcentaje 0-100
  category:    { type: String, trim: true },
  brand:       { type: String, trim: true },
  unit:        { type: String, default: 'piezas', trim: true },
  image:       { type: String, trim: true },
  cost:        { type: Number, default: 0, min: 0 },  // precio de costo
  // false = eliminado por el usuario pero con ventas registradas: se oculta
  // de las listas y no se puede vender, pero sus tickets conservan el nombre
  activo:      { type: Boolean, default: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

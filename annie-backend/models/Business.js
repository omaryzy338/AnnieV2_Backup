const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug:     { type: String, required: true, unique: true },
  address:  { type: String, trim: true },
  phone:    { type: String, trim: true },
  category: { type: String, trim: true },
  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);

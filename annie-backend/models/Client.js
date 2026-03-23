const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  phone:    { type: String, trim: true },
  address:  { type: String, trim: true },
  notes:    { type: String, trim: true },
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);

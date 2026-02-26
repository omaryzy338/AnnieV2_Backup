const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: { type: String },
  phone: { type: String }
});

module.exports = mongoose.model('Business', businessSchema);

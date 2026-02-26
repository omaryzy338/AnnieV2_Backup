const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ]
});

module.exports = mongoose.model('Menu', menuSchema);

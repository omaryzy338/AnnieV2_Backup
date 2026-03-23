const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  birthDate: { type: Date },
  country:   { type: String, trim: true },
  state:     { type: String, trim: true },
  city:      { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
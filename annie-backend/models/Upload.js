const mongoose = require('mongoose');

// Las imágenes se guardan en MongoDB en vez de en disco porque en entornos
// serverless (Vercel) el sistema de archivos es de solo lectura y además
// efímero: cualquier archivo escrito desaparece al terminar la petición.
// Se sirven de vuelta desde GET /uploads/:id (ver server.js).
const uploadSchema = new mongoose.Schema({
  data:        { type: Buffer, required: true },
  contentType: { type: String, required: true },
  filename:    { type: String, trim: true },
  size:        { type: Number },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Upload', uploadSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  birthDate: { type: Date },
  country:   { type: String, trim: true },
  state:     { type: String, trim: true },
  city:      { type: String, trim: true },

  // ── Rol dentro del negocio ───────────────────────────────────────
  // "dueno" = quien registró el negocio; "empleado" = cuenta creada por el
  // dueño, que trabaja con los datos de SU negocio. Los usuarios antiguos no
  // tienen este campo: el código siempre los trata como dueños.
  rol:    { type: String, enum: ['dueno', 'empleado'], default: 'dueno' },
  // Solo empleados: el usuario dueño del negocio donde trabajan
  dueno:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  // false = el dueño desactivó al empleado (no puede iniciar sesión)
  activo: { type: Boolean, default: true },
  // Solo empleados: sube cada vez que el dueño lo desactiva o le cambia la
  // contraseña. Va dentro del token, así las sesiones abiertas antes del
  // cambio dejan de servir (aunque después se le vuelva a activar).
  versionSesion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
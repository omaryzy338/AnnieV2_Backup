const bcrypt = require('bcryptjs');

// Reglas de email y contraseña compartidas por el registro, el login y el
// alta de empleados, para que todos validen exactamente igual.
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mínimo 8 chars, al menos 1 mayúscula, 1 número y 1 carácter especial
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const MENSAJE_PASSWORD =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%...)';

// Hashea una contraseña (bcrypt con 12 rondas, igual para dueños y empleados)
async function hashearPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

module.exports = { emailRegex, passwordRegex, MENSAJE_PASSWORD, hashearPassword };

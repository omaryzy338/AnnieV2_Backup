const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { esEmpleado } = require('../utils/roles');

// Verifica el token y deja en la request:
//  - req.user:    los datos del token (la persona que hace la petición)
//  - req.esDueno: true si es el dueño del negocio, false si es un empleado
//  - req.ownerId: el dueño cuyos datos se usan (para un empleado, su dueño)
async function authMiddleware(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No hay token." });
  }

  let verified;
  try {
    verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
  } catch (err) {
    // 401 para que los clientes (web y móvil) cierren la sesión vencida
    return res.status(401).json({ message: "Sesión inválida o vencida. Inicia sesión de nuevo." });
  }
  req.user = verified; // Guardamos el usuario en la request

  // Los tokens anteriores a los roles no traen "rol": son de dueños
  const empleado = esEmpleado(verified);

  if (empleado) {
    // El dueño puede desactivar o eliminar a un empleado en cualquier momento,
    // así que se revisa en cada petición para cortar su acceso de inmediato
    // (con 401, para que la web y el celular cierren su sesión).
    try {
      const actual = mongoose.Types.ObjectId.isValid(verified.id)
        ? await User.findById(verified.id).select('rol dueno activo versionSesion').lean()
        : null;
      const vigente = actual && esEmpleado(actual) && actual.activo !== false &&
        actual.dueno && String(actual.dueno) === String(verified.ownerId);
      if (!vigente) {
        return res.status(401).json({ message: 'Tu acceso como empleado fue desactivado. Pídele al dueño que lo active.' });
      }
      // Sesión abierta antes de que el dueño le cambiara la contraseña o lo
      // desactivara (aunque después lo haya vuelto a activar)
      if ((actual.versionSesion || 0) !== (verified.sv || 0)) {
        return res.status(401).json({ message: 'Tu sesión terminó porque el dueño cambió tu acceso. Inicia sesión de nuevo.' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al verificar la sesión' });
    }
  }

  req.esDueno = !empleado;
  req.ownerId = empleado ? verified.ownerId : verified.id;
  next(); // Continuamos a la ruta
}

// Para las rutas que solo puede usar el dueño (va después de authMiddleware)
function soloDueno(req, res, next) {
  if (!req.esDueno) {
    return res.status(403).json({ message: 'Solo el dueño del negocio puede hacer esto.' });
  }
  next();
}

module.exports = authMiddleware;
module.exports.soloDueno = soloDueno;

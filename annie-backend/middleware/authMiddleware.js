const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No hay token." });
  }

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = verified; // Guardamos el usuario en la request
    next(); // Continuamos a la ruta
  } catch (err) {
    // 401 para que los clientes (web y móvil) cierren la sesión vencida
    res.status(401).json({ message: "Sesión inválida o vencida. Inicia sesión de nuevo." });
  }
}

module.exports = authMiddleware;

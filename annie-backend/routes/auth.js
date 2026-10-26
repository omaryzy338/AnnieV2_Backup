const express = require('express');
const router = express.Router();
const { responderError } = require('../utils/errores');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const { validarRFC, GENERIC_RFC } = require('../utils/rfc');
const { emailRegex, passwordRegex, MENSAJE_PASSWORD, hashearPassword } = require('../utils/credenciales');
const { esEmpleado, rolDe } = require('../utils/roles');

// Duración de la sesión: 8 h en la web; 30 días en la app móvil (el token
// se guarda cifrado en el dispositivo con SecureStore).
const duracionToken = (body) => (body && body.client === 'mobile' ? '30d' : '8h');

// Sin JWT_SECRET no se pueden crear sesiones: se valida ANTES de guardar nada
// para no dejar usuarios registrados que luego no pueden entrar.
const sinClaveJWT = (res) => {
  if (process.env.JWT_SECRET) return false;
  console.error('❌ Falta la variable de entorno JWT_SECRET');
  res.status(500).json({ message: 'El servidor no está configurado (falta JWT_SECRET). Avisa al administrador.' });
  return true;
};

// ── REGISTRO ─────────────────────────────────────────────────
// Quien se registra siempre es el dueño de un negocio nuevo (los empleados
// los da de alta el dueño en /employees).
router.post('/register', async (req, res) => {
  try {
    if (sinClaveJWT(res)) return;
    const { name, lastName, email, password, businessName, address, phone, category, description, rfc } = req.body || {};

    // Campos obligatorios
    if (!name || !lastName || !email || !password || !businessName)
      return res.status(400).json({ message: 'Faltan campos obligatorios: name, lastName, email, password, businessName' });

    // Validar email
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'El email no tiene un formato válido' });

    // Validar contraseña segura
    if (!passwordRegex.test(password))
      return res.status(400).json({ message: MENSAJE_PASSWORD });

    // RFC del negocio: opcional. Si no lo dan, se asigna el genérico del SAT
    // (con ese RFC no se puede facturar, así que tampoco se puede dar crédito
    // a clientes hasta que se registre un RFC real desde Mi Negocio).
    let businessRfc = GENERIC_RFC;
    if (rfc && rfc.trim()) {
      const v = validarRFC(rfc);
      if (!v.ok) return res.status(400).json({ message: v.message });
      businessRfc = v.rfc;
    }

    // Comprobar si ya existe
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ message: 'Ya existe una cuenta con ese email' });

    // Hashear contraseña
    const hashed = await hashearPassword(password);

    user = new User({ name, lastName, email, password: hashed, rol: 'dueno' });
    await user.save();

    // Crear negocio asociado
    const slug = businessName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '-' + user._id.toString().slice(-4);

    const business = new Business({ name: businessName, owner: user._id, slug, address, phone, category, description, rfc: businessRfc });
    try {
      await business.save();
    } catch (err) {
      // No dejar un usuario sin negocio si falla la creación del negocio
      await User.deleteOne({ _id: user._id }).catch(() => {});
      throw err;
    }

    const payload = {
      id: user._id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      businessId: business._id,
      businessName: business.name,
      slug: business.slug,
      rol: 'dueno'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: duracionToken(req.body) });

    res.status(201).json({ token, user: payload });
  } catch (err) {
    // Dos registros simultáneos con el mismo email: el índice único lo detecta
    if (err?.code === 11000) return res.status(400).json({ message: 'Ya existe una cuenta con ese email' });
    responderError(res, err, 'Error del servidor');
  }
});

// ── LOGIN ───────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    if (sinClaveJWT(res)) return;
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'El email no tiene un formato válido' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas' });

    // Un empleado entra al negocio de su dueño, siempre que siga activo (se
    // revisa después de la contraseña para no revelar el estado de la cuenta)
    const empleado = esEmpleado(user);
    if (empleado && (user.activo === false || !user.dueno))
      return res.status(403).json({ message: 'Tu cuenta de empleado está desactivada. Pídele al dueño que la active.' });

    const business = await Business.findOne({ owner: empleado ? user.dueno : user._id });

    const payload = {
      id: user._id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      businessId: business ? business._id : null,
      businessName: business ? business.name : null,
      slug: business ? business.slug : null,
      rol: rolDe(user),
      // Dueño cuyos datos usa el empleado (lo revisa authMiddleware)
      ...(empleado ? { ownerId: user.dueno } : {})
    };
    // El token del empleado lleva además la versión de su sesión, para que
    // deje de servir si el dueño lo desactiva o le cambia la contraseña
    const datosToken = empleado ? { ...payload, sv: user.versionSesion || 0 } : payload;
    const token = jwt.sign(datosToken, process.env.JWT_SECRET, { expiresIn: duracionToken(req.body) });

    res.json({ token, user: payload });
  } catch (err) {
    responderError(res, err, 'Error del servidor');
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { responderError, validarId } = require('../utils/errores');
const authMiddleware = require('../middleware/authMiddleware');
const { soloDueno } = authMiddleware;
const User = require('../models/User');
const { emailRegex, passwordRegex, MENSAJE_PASSWORD, hashearPassword } = require('../utils/credenciales');

// Un id mal formado responde 404 (no 500)
router.param('id', validarId('Empleado no encontrado'));

// Todas las rutas: solo el dueño administra a sus empleados
router.use(authMiddleware, soloDueno);

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

// Lo que se responde de un empleado (nunca la contraseña)
const aRespuesta = (u) => ({
  _id: u._id,
  name: u.name,
  lastName: u.lastName,
  email: u.email,
  rol: 'empleado',
  activo: u.activo !== false,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

// Solo los empleados de ESTE dueño (nunca otros dueños ni empleados ajenos)
const deEsteDueno = (req) => ({ _id: req.params.id, dueno: req.ownerId, rol: 'empleado' });

// ── GET /employees — empleados del negocio (los más nuevos primero) ──
router.get('/', async (req, res) => {
  try {
    const empleados = await User.find({ dueno: req.ownerId, rol: 'empleado' })
      .select('-password')
      .sort({ createdAt: -1, _id: -1 });
    res.json(empleados.map(aRespuesta));
  } catch (err) {
    responderError(res, err, 'Error al obtener empleados');
  }
});

// ── POST /employees — dar de alta un empleado ────────────────────
router.post('/', async (req, res) => {
  try {
    const name = texto(req.body.name);
    const lastName = texto(req.body.lastName);
    const email = texto(req.body.email).toLowerCase();
    const { password } = req.body;

    if (!name || !lastName || !email || !password)
      return res.status(400).json({ message: 'Faltan campos obligatorios: name, lastName, email, password' });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'El email no tiene un formato válido' });

    // Misma regla de contraseña segura que en el registro
    if (typeof password !== 'string' || !passwordRegex.test(password))
      return res.status(400).json({ message: MENSAJE_PASSWORD });

    // El email es único entre TODAS las cuentas (dueños y empleados)
    if (await User.exists({ email }))
      return res.status(400).json({ message: 'Ya existe una cuenta con ese email' });

    const empleado = await User.create({
      name,
      lastName,
      email,
      password: await hashearPassword(password),
      rol: 'empleado',
      dueno: req.ownerId,
      activo: true,
    });

    res.status(201).json(aRespuesta(empleado));
  } catch (err) {
    // Dos altas simultáneas con el mismo email: el índice único lo detecta
    if (err?.code === 11000) return res.status(400).json({ message: 'Ya existe una cuenta con ese email' });
    responderError(res, err, 'Error al crear empleado');
  }
});

// ── PUT /employees/:id — editar, activar/desactivar o cambiar contraseña ──
// Desactivar a un empleado le corta el acceso de inmediato: su sesión abierta
// deja de servir (ver authMiddleware) y ya no puede iniciar sesión.
router.put('/:id', async (req, res) => {
  try {
    const empleado = await User.findOne(deEsteDueno(req));
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

    const { name, lastName, activo, password } = req.body;

    if (name !== undefined) {
      if (!texto(name)) return res.status(400).json({ message: 'El nombre es obligatorio' });
      empleado.name = texto(name);
    }
    if (lastName !== undefined) {
      if (!texto(lastName)) return res.status(400).json({ message: 'El apellido es obligatorio' });
      empleado.lastName = texto(lastName);
    }

    // Desactivarlo o cambiarle la contraseña cierra las sesiones que tenga
    // abiertas (ver versionSesion en models/User.js)
    let cerrarSesiones = false;

    // activo acepta booleano o texto ("true"/"false"), como esMayoreo en clientes
    if (activo !== undefined) {
      if (activo === true || activo === 'true') empleado.activo = true;
      else if (activo === false || activo === 'false') {
        if (empleado.activo !== false) cerrarSesiones = true;
        empleado.activo = false;
      } else return res.status(400).json({ message: 'El campo "activo" debe ser true o false' });
    }

    // Contraseña opcional: vacía = no se cambia
    if (password !== undefined && password !== null && password !== '') {
      if (typeof password !== 'string' || !passwordRegex.test(password))
        return res.status(400).json({ message: MENSAJE_PASSWORD });
      empleado.password = await hashearPassword(password);
      cerrarSesiones = true;
    }

    if (cerrarSesiones) empleado.versionSesion = (empleado.versionSesion || 0) + 1;

    await empleado.save();
    res.json(aRespuesta(empleado));
  } catch (err) {
    responderError(res, err, 'Error al actualizar empleado');
  }
});

// ── DELETE /employees/:id — eliminar empleado ─────────────────────
// Su sesión deja de servir de inmediato. Las ventas que registró se conservan
// con su nombre (vendedorNombre).
router.delete('/:id', async (req, res) => {
  try {
    const empleado = await User.findOneAndDelete(deEsteDueno(req));
    if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
    res.json({ message: 'Empleado eliminado' });
  } catch (err) {
    responderError(res, err, 'Error al eliminar empleado');
  }
});

module.exports = router;

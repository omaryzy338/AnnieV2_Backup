// Roles de los usuarios: "dueno" (quien registró el negocio) y "empleado"
// (cuenta creada por el dueño). Los usuarios y tokens anteriores a los roles
// no tienen el campo "rol": siempre se tratan como dueños.
const esEmpleado = (usuario) => usuario?.rol === 'empleado';
const rolDe = (usuario) => (esEmpleado(usuario) ? 'empleado' : 'dueno');

module.exports = { esEmpleado, rolDe };

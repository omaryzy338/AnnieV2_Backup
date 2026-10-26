// Sesión guardada en el navegador ("token" y "user" en localStorage) y el rol
// de quien la inició: el dueño del negocio o uno de sus empleados.
// Los usuarios y las sesiones sin rol son dueños: así quedan todas las
// cuentas y sesiones creadas antes de que existieran los empleados.

export const ROL_DUENO = "dueno";
export const ROL_EMPLEADO = "empleado";

/** Usuario guardado al iniciar sesión ({} si no hay o está dañado). */
export const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

/** true si es el dueño del negocio (sin rol también cuenta como dueño). */
export const esDueno = (user) => !user?.rol || user.rol === ROL_DUENO;

/** Rol para mostrar: "Dueño" o "Empleado". */
export const nombreRol = (user) => (esDueno(user) ? "Dueño" : "Empleado");

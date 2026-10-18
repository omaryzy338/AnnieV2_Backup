// Validación de RFC en el navegador. Mismas reglas que el backend
// (annie-backend/utils/rfc.js) y mismos mensajes que la app móvil
// (annie-mobile/src/lib/validacion.ts), para avisar antes de enviar.

// Persona física: 4 letras + fecha (6 dígitos) + homoclave (3) = 13
export const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
// Persona moral: 3 letras + fecha (6 dígitos) + homoclave (3) = 12
export const RFC_MORAL = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

// RFC genérico del SAT para "público en general": con él no se puede facturar
export const GENERIC_RFC = "XAXX010101000";

/** Mayúsculas y sin espacios ni guiones. */
export const limpiarRFC = (rfc) => String(rfc || "").toUpperCase().replace(/[\s-]/g, "");

/**
 * Valida un RFC. Con tipo ("fisica" | "moral") se exige ese formato; sin
 * tipo se acepta física o moral. Regresa el mensaje de error, o null si es
 * válido.
 */
export function validarRFC(rfc, tipo) {
  const clean = limpiarRFC(rfc);
  if (!clean) return "El RFC está vacío";
  if (tipo === "fisica")
    return RFC_FISICA.test(clean) ? null : "RFC de persona física inválido (13 caracteres, ej. XAXX010101000)";
  if (tipo === "moral")
    return RFC_MORAL.test(clean) ? null : "RFC de persona moral inválido (12 caracteres, ej. ABC010101XY9)";
  if (RFC_FISICA.test(clean) || RFC_MORAL.test(clean)) return null;
  return "El RFC no tiene un formato válido (física=13, moral=12 caracteres)";
}

/** Un negocio sin RFC real (vacío o el genérico del SAT) no puede dar crédito. */
export const sinRFCReal = (business) =>
  !business || !!business.rfcGenerico || !limpiarRFC(business.rfc) || limpiarRFC(business.rfc) === GENERIC_RFC;

// Validación de RFC mexicano
// Persona física: 4 letras + 6 dígitos (fecha) + 3 caracteres de homoclave = 13
// Persona moral:  3 letras + 6 dígitos (fecha) + 3 caracteres de homoclave = 12
const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
const RFC_MORAL  = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

// Normaliza: quita espacios/guiones y pasa a mayúsculas
function limpiarRFC(rfc) {
  return String(rfc || '').toUpperCase().replace(/[\s-]/g, '');
}

// Deduce el tipo de persona por longitud (13 = física, 12 = moral)
function tipoPorLongitud(rfc) {
  const clean = limpiarRFC(rfc);
  if (clean.length === 13) return 'fisica';
  if (clean.length === 12) return 'moral';
  return '';
}

// Valida el RFC. Si se pasa tipoPersona ('fisica' | 'moral') se exige ese
// formato concreto; si no, se acepta cualquiera de los dos.
// Devuelve { ok, rfc (limpio), tipo, message }
function validarRFC(rfc, tipoPersona) {
  const clean = limpiarRFC(rfc);

  if (!clean) {
    return { ok: false, rfc: '', tipo: '', message: 'El RFC está vacío' };
  }

  if (tipoPersona === 'fisica') {
    return {
      ok: RFC_FISICA.test(clean),
      rfc: clean,
      tipo: 'fisica',
      message: RFC_FISICA.test(clean)
        ? ''
        : 'El RFC de persona física debe tener 13 caracteres con formato válido (ej. XAXX010101000)',
    };
  }

  if (tipoPersona === 'moral') {
    return {
      ok: RFC_MORAL.test(clean),
      rfc: clean,
      tipo: 'moral',
      message: RFC_MORAL.test(clean)
        ? ''
        : 'El RFC de persona moral debe tener 12 caracteres con formato válido (ej. ABC010101XYZ)',
    };
  }

  // Sin tipo declarado: aceptar física o moral y deducir el tipo
  if (RFC_FISICA.test(clean)) return { ok: true, rfc: clean, tipo: 'fisica', message: '' };
  if (RFC_MORAL.test(clean))  return { ok: true, rfc: clean, tipo: 'moral',  message: '' };

  return {
    ok: false,
    rfc: clean,
    tipo: '',
    message: 'El RFC no tiene un formato válido (física=13, moral=12 caracteres)',
  };
}

module.exports = { validarRFC, limpiarRFC, tipoPorLongitud, RFC_FISICA, RFC_MORAL };

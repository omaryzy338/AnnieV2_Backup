// Validaciones de formularios. Las reglas son las mismas que aplica el
// backend (annie-backend/routes/auth.js y utils/rfc.js), para avisar antes de
// enviar y con el mismo mensaje.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mínimo 8 caracteres, una mayúscula, un número y un carácter especial
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const MENSAJE_PASSWORD =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%...)';

export const reglasPassword = (pwd: string) => [
  { ok: pwd.length >= 8, texto: 'Mínimo 8 caracteres' },
  { ok: /[A-Z]/.test(pwd), texto: 'Una mayúscula' },
  { ok: /\d/.test(pwd), texto: 'Un número' },
  { ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd), texto: 'Un carácter especial (!@#$%...)' },
];

const RFC_FISICA = /^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;
const RFC_MORAL = /^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/;

export const GENERIC_RFC = 'XAXX010101000';

export const limpiarRFC = (rfc: string) => String(rfc || '').toUpperCase().replace(/[\s-]/g, '');

/** Valida un RFC. Con tipo se exige ese formato; sin tipo se acepta física o moral. */
export function validarRFC(rfc: string, tipo?: 'fisica' | 'moral' | ''): string | null {
  const clean = limpiarRFC(rfc);
  if (!clean) return 'El RFC está vacío';
  if (tipo === 'fisica')
    return RFC_FISICA.test(clean) ? null : 'RFC de persona física inválido (13 caracteres, ej. XAXX010101000)';
  if (tipo === 'moral')
    return RFC_MORAL.test(clean) ? null : 'RFC de persona moral inválido (12 caracteres, ej. ABC010101XY9)';
  if (RFC_FISICA.test(clean) || RFC_MORAL.test(clean)) return null;
  return 'El RFC no tiene un formato válido (física=13, moral=12 caracteres)';
}

/** Un negocio sin RFC real (vacío o el genérico del SAT) no puede dar crédito. */
export const sinRFCReal = (business?: { rfc?: string; rfcGenerico?: boolean } | null) =>
  !business || !!business.rfcGenerico || !limpiarRFC(business.rfc ?? '') || limpiarRFC(business.rfc ?? '') === GENERIC_RFC;

// ── Registro ─────────────────────────────────────────────────────
export type CamposRegistro = {
  name: string;
  lastName: string;
  businessName: string;
  rfc: string;
  email: string;
  password: string;
  confirmar: string;
};

export const CAMPOS_REGISTRO_VACIOS: CamposRegistro = { name: '', lastName: '', businessName: '', rfc: '', email: '', password: '', confirmar: '' };

export function validarRegistro(c: CamposRegistro): Partial<Record<keyof CamposRegistro, string>> {
  const e: Partial<Record<keyof CamposRegistro, string>> = {};
  if (!c.name.trim()) e.name = 'Escribe tu nombre';
  if (!c.lastName.trim()) e.lastName = 'Escribe tu apellido';
  if (!c.businessName.trim()) e.businessName = 'Escribe el nombre de tu negocio';
  if (!c.email.trim()) e.email = 'Escribe tu correo';
  else if (!EMAIL_REGEX.test(c.email.trim())) e.email = 'El correo no tiene un formato válido';
  if (!PASSWORD_REGEX.test(c.password)) e.password = MENSAJE_PASSWORD;
  if (c.confirmar !== c.password) e.confirmar = 'Las contraseñas no coinciden';
  if (c.rfc.trim()) {
    const err = validarRFC(c.rfc);
    if (err) e.rfc = err;
  }
  return e;
}

export const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de Mexico', 'Coahuila', 'Colima', 'Durango', 'Estado de Mexico', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Oaxaca', 'Puebla', 'Queretaro',
  'Quintana Roo', 'San Luis Potosi', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatan', 'Zacatecas',
];

export const CATEGORIAS_PRODUCTO = [
  'Bebidas', 'Snacks', 'Alimentos', 'Dulces y chocolates', 'Lácteos', 'Panadería', 'Limpieza',
  'Higiene personal', 'Papelería', 'Electrónica', 'Ferretería', 'Juguetes', 'Ropa y accesorios', 'Servicios',
];

export const UNIDADES = [
  { valor: '', texto: 'Sin unidad' },
  { valor: 'piezas', texto: 'Piezas' },
  { valor: 'kg', texto: 'Kilogramos' },
  { valor: 'g', texto: 'Gramos' },
];

/** Umbral de stock bajo usado en toda la app (igual que en la web). */
export const STOCK_BAJO = 5;
export const STOCK_MEDIO = 15;

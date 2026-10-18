// Formatos de dinero, folios y fechas (siempre en la zona horaria local del
// teléfono, como en la web).

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$1,234.50" */
export const money = (n: number | null | undefined) => `$${moneyFormatter.format(Number(n) || 0)}`;

/** Folio a 6 dígitos ("000012"), o "—" si la venta aún no tiene. */
export const folioTxt = (f?: number | null) => (f ? String(f).padStart(6, '0') : '—');

export const fullName = (p?: { name?: string; lastName?: string } | null) =>
  p ? `${p.name ?? ''} ${p.lastName ?? ''}`.trim() : '';

export const initials = (p?: { name?: string; lastName?: string } | null) =>
  ((p?.name ?? '?').charAt(0) + (p?.lastName ?? '').charAt(0)).toUpperCase();

/** Fecha local YYYY-MM-DD (toISOString usa UTC y de noche ya marca el día siguiente). */
export const isoLocalDate = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const hora12 = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${d.getHours() < 12 ? 'a.m.' : 'p.m.'}`;
};

/** "08 oct 2026, 5:42 p.m." */
export const formatDateTime = (iso: string | Date) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${hora12(d)}`;
};

/** "08 oct, 5:42 p.m." (con año solo si no es el año actual). Para listas. */
export const formatDateTimeCorto = (iso: string | Date, ahora = new Date()) => {
  const d = new Date(iso);
  const anio = d.getFullYear() !== ahora.getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}${anio}, ${hora12(d)}`;
};

/** "08 oct 2026" */
export const formatDate = (iso: string | Date) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

/** "08 oct" */
export const formatShortDate = (iso: string | Date) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
};

/** Fecha guardada como "YYYY-MM-DD" a medianoche UTC (ej. nacimiento): se lee en UTC. */
export const formatDateOnlyUTC = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

export const monthName = (monthIndex: number) => MESES_LARGOS[((monthIndex % 12) + 12) % 12];

export const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n === 1 ? singular : pluralForm}`;

/** Convierte texto de un input numérico ("1,234.5", "12.") a número; NaN si no es válido. */
export const parseAmount = (txt: string) => {
  const limpio = txt.replace(/[\s,$]/g, '');
  if (!limpio) return NaN;
  return Number(limpio);
};

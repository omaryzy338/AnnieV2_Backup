// Formatos de dinero, folios, fechas y nombres que se usan en todo el panel.
// Es el equivalente web de annie-mobile/src/lib/format.ts: las fechas siempre
// se muestran en la zona horaria local del dispositivo.

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$1,234.50" (los negativos como "-$12.00") */
export const money = (n) => {
  // Se redondea antes (y "|| 0" quita el -0) para que -0.001 no salga como "-$0.00"
  const v = Math.round((Number(n) || 0) * 100) / 100 || 0;
  return v < 0 ? `-$${moneyFormatter.format(-v)}` : `$${moneyFormatter.format(v)}`;
};

/** Folio a 6 dígitos ("000012"), o "—" si la venta aún no tiene. */
export const folioTxt = (f) => (f ? String(f).padStart(6, "0") : "—");

/** Fecha local YYYY-MM-DD (toISOString usa UTC y de noche ya marca el día siguiente). */
export const isoLocalDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Fecha y hora: "17 oct 2026, 08:12 p.m." (acepta ISO o Date) */
export const formatFecha = (iso) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });

/** Día y mes corto: "17 oct" (para listas compactas y gráficas) */
export const formatFechaCorta = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

/** Día, mes corto y año: "17 oct 2026" */
export const formatFechaDia = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

/** "María Pérez" a partir de { name, lastName } */
export const fullName = (p) => (p ? `${p.name || ""} ${p.lastName || ""}`.trim() : "");

/** Iniciales para avatares: "MP" (o "?" si no hay nombre) */
export const initials = (p) =>
  ((p?.name || "?").charAt(0) + (p?.lastName || "").charAt(0)).toUpperCase();

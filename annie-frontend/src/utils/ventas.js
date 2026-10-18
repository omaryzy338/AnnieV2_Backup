// Reglas de una venta. Deben coincidir con annie-backend/routes/sales.js (y
// con annie-mobile/src/lib/ventas.ts): el descuento en % se aplica al
// importe de la línea, el descuento fijo ($) se aplica una sola vez a la
// venta completa y el total nunca es negativo.
import { isoLocalDate } from "./format";

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Total de la venta, redondeado a centavos. */
export function calcularTotal(price, quantity, discount, discountType) {
  const precio = Number(price);
  const cantidad = Number(quantity);
  if (!(precio >= 0) || !(cantidad > 0)) return 0;
  const importe = precio * cantidad;
  const desc = Number(discount) || 0;
  const total = discountType === "fijo" ? importe - desc : importe - (importe * desc) / 100;
  return round2(Math.max(0, total));
}

/** Crédito que le queda a un cliente de mayoreo. */
export const creditoDisponible = (c) =>
  round2(Math.max(0, (c?.limiteCredito || 0) - (c?.saldo || 0)));

/**
 * Fecha y hora real de la venta (Date, en hora local). Las ventas antiguas
 * guardaban solo el día (a las 12:00:00 UTC exactas); para esas se usa la
 * hora de registro (createdAt).
 */
export function fechaVenta(v) {
  if (!v.saleDate) return new Date(v.createdAt);
  const d = new Date(v.saleDate);
  const soloDia =
    d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  if (!soloDia) return d;
  const c = new Date(v.createdAt);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), c.getHours(), c.getMinutes());
}

/**
 * Fecha que se manda al registrar la venta: el día elegido ("YYYY-MM-DD")
 * con la hora local actual, en ISO completo para que el backend conserve la
 * hora real. Si el campo de fecha quedó vacío se usa el momento actual.
 */
export function fechaParaEnviar(dia, ahora = new Date()) {
  if (!dia || dia === isoLocalDate(ahora)) return ahora.toISOString();
  const [y, m, d] = dia.split("-").map(Number);
  return new Date(y, m - 1, d, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()).toISOString();
}

export const metodoTxt = (m) => (m === "credito" ? "Crédito" : "Efectivo");

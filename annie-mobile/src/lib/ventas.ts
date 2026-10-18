// Reglas de una venta. Deben coincidir con annie-backend/routes/sales.js:
// el descuento en % se aplica al importe, el descuento fijo ($) se aplica una
// sola vez a la venta completa y el total nunca es negativo.
import type { Client, DiscountType, Sale } from './types';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcularTotal(price: number, quantity: number, discount: number, discountType: DiscountType) {
  if (!(price >= 0) || !(quantity > 0)) return 0;
  const importe = price * quantity;
  const desc = Number(discount) || 0;
  const total = discountType === 'fijo' ? importe - desc : importe - (importe * desc) / 100;
  return round2(Math.max(0, total));
}

/** Cambio a entregar; negativo si el pago no alcanza. */
export const calcularCambio = (total: number, pagaCon: number) => round2(pagaCon - total);

/** Crédito que le queda a un cliente de mayoreo. */
export const creditoDisponible = (c?: Pick<Client, 'limiteCredito' | 'saldo'> | null) =>
  round2(Math.max(0, (c?.limiteCredito ?? 0) - (c?.saldo ?? 0)));

/** Porcentaje del límite usado (0-100); 100 si debe sin tener límite. */
export const porcentajeCreditoUsado = (c: Pick<Client, 'limiteCredito' | 'saldo'>) => {
  const limite = c.limiteCredito ?? 0;
  const saldo = c.saldo ?? 0;
  if (limite > 0) return Math.min(100, (saldo / limite) * 100);
  return saldo > 0 ? 100 : 0;
};

/**
 * Fecha y hora real de la venta. Las ventas antiguas guardaban solo el día
 * (a las 12:00:00 UTC exactas); para esas se usa la hora de registro.
 */
export function fechaVenta(v: Pick<Sale, 'saleDate' | 'createdAt'>): Date {
  if (!v.saleDate) return new Date(v.createdAt);
  const d = new Date(v.saleDate);
  const soloDia =
    d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  if (!soloDia) return d;
  const c = new Date(v.createdAt);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), c.getHours(), c.getMinutes());
}

/**
 * Fecha que se manda al registrar la venta: el día elegido con la hora actual
 * (ISO completo, para que el backend conserve la hora real).
 */
export function fechaParaEnviar(dia: Date, ahora: Date = new Date()) {
  const mismoDia =
    dia.getFullYear() === ahora.getFullYear() && dia.getMonth() === ahora.getMonth() && dia.getDate() === ahora.getDate();
  if (mismoDia) return ahora.toISOString();
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()).toISOString();
}

export const metodoTxt = (m?: string) => (m === 'credito' ? 'Crédito' : 'Efectivo');

/** Billetes sugeridos para "paga con": los primeros que cubren el total. */
export function billetesSugeridos(total: number) {
  if (!(total > 0)) return [];
  const opciones = [20, 50, 100, 200, 500, 1000];
  return opciones.filter((b) => b > total).slice(0, 3);
}

export type Periodo = 'hoy' | 'semana' | 'mes' | 'todo';

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function filtrarPorPeriodo<T extends Pick<Sale, 'saleDate' | 'createdAt'>>(ventas: T[], periodo: Periodo, ahora = new Date()) {
  return ventas.filter((v) => {
    const f = fechaVenta(v);
    if (periodo === 'hoy') return mismoDia(f, ahora);
    if (periodo === 'semana') {
      const desde = new Date(ahora);
      desde.setDate(ahora.getDate() - 7);
      return f >= desde;
    }
    if (periodo === 'mes') return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
    return true;
  });
}

/** Busca por folio exacto (con o sin ceros a la izquierda), producto o cliente. */
export function buscarVentas(ventas: Sale[], texto: string) {
  const q = texto.trim().toLowerCase();
  if (!q) return ventas;
  const folio = /^\d+$/.test(q) ? Number(q) : null;
  return ventas.filter(
    (v) =>
      (folio !== null && v.folio === folio) ||
      (v.product?.name ?? '').toLowerCase().includes(q) ||
      `${v.client?.name ?? ''} ${v.client?.lastName ?? ''}`.toLowerCase().includes(q)
  );
}

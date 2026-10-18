// Cálculos de las pantallas de Inicio y Reportes, a partir de las ventas,
// productos y clientes que regresa la API (mismas fórmulas que la web).
import { colors } from '@/theme';

import { DIAS_CORTOS, folioTxt, formatDateTime, fullName, isoLocalDate } from './format';
import type { Product, Sale } from './types';
import { STOCK_BAJO, STOCK_MEDIO } from './validacion';
import { fechaVenta, metodoTxt, round2 } from './ventas';

export type Punto = { clave: string; etiqueta: string; valor: number };

/** Total vendido por día en los últimos `dias` días (incluye hoy). */
export function ventasPorDia(ventas: Sale[], dias: number, ahora = new Date()): Punto[] {
  const puntos: Punto[] = [];
  const indice = new Map<string, Punto>();
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i);
    const p = {
      clave: isoLocalDate(d),
      etiqueta: dias <= 7 ? DIAS_CORTOS[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`,
      valor: 0,
    };
    puntos.push(p);
    indice.set(p.clave, p);
  }
  for (const v of ventas) {
    const p = indice.get(isoLocalDate(fechaVenta(v)));
    if (p) p.valor = round2(p.valor + v.total);
  }
  return puntos;
}

const enMes = (d: Date, year: number, month: number) => d.getFullYear() === year && d.getMonth() === month;

export function resumenMes(ventas: Sale[], ahora = new Date()) {
  const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const delMes = ventas.filter((v) => enMes(fechaVenta(v), ahora.getFullYear(), ahora.getMonth()));
  const delAnterior = ventas.filter((v) => enMes(fechaVenta(v), anterior.getFullYear(), anterior.getMonth()));
  const totalMes = round2(delMes.reduce((a, v) => a + v.total, 0));
  const totalMesAnterior = round2(delAnterior.reduce((a, v) => a + v.total, 0));
  return {
    ventasMes: delMes,
    totalMes,
    totalMesAnterior,
    transacciones: delMes.length,
    ticketPromedio: delMes.length ? round2(totalMes / delMes.length) : 0,
    cambioPct: totalMesAnterior > 0 ? round2(((totalMes - totalMesAnterior) / totalMesAnterior) * 100) : null,
  };
}

export const totalDelDia = (ventas: Sale[], ahora = new Date()) =>
  round2(ventas.filter((v) => isoLocalDate(fechaVenta(v)) === isoLocalDate(ahora)).reduce((a, v) => a + v.total, 0));

export type TopProducto = { id: string; nombre: string; unidades: number; total: number; unidad: string };

/** Productos agrupados por id, ordenados por unidades vendidas. */
export function topProductos(ventas: Sale[], limite = 5): TopProducto[] {
  const mapa = new Map<string, TopProducto>();
  for (const v of ventas) {
    if (!v.product) continue;
    const actual = mapa.get(v.product._id) ?? {
      id: v.product._id,
      nombre: v.product.name,
      unidades: 0,
      total: 0,
      unidad: v.product.unit || 'uds.',
    };
    actual.unidades += v.quantity;
    actual.total = round2(actual.total + v.total);
    mapa.set(v.product._id, actual);
  }
  return [...mapa.values()].sort((a, b) => b.unidades - a.unidades || b.total - a.total).slice(0, limite);
}

/** Total vendido por categoría del producto (las ventas sin categoría van a "Sin categoría"). */
export function ventasPorCategoria(ventas: Sale[]) {
  const mapa = new Map<string, number>();
  for (const v of ventas) {
    const cat = v.product?.category?.trim() || 'Sin categoría';
    mapa.set(cat, round2((mapa.get(cat) ?? 0) + v.total));
  }
  const total = [...mapa.values()].reduce((a, b) => a + b, 0);
  return [...mapa.entries()]
    .map(([nombre, valor]) => ({ nombre, valor, pct: total > 0 ? (valor / total) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);
}

export function ventasPorDiaSemana(ventas: Sale[]): Punto[] {
  const totales = [0, 0, 0, 0, 0, 0, 0];
  for (const v of ventas) totales[fechaVenta(v).getDay()] += v.total;
  return totales.map((valor, i) => ({ clave: String(i), etiqueta: DIAS_CORTOS[i], valor: round2(valor) }));
}

export function topClientes(ventas: Sale[], limite = 5) {
  const mapa = new Map<string, { id: string; nombre: string; compras: number; total: number }>();
  for (const v of ventas) {
    if (!v.client) continue;
    const actual = mapa.get(v.client._id) ?? { id: v.client._id, nombre: fullName(v.client) || 'Sin nombre', compras: 0, total: 0 };
    actual.compras += 1;
    actual.total = round2(actual.total + v.total);
    mapa.set(v.client._id, actual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, limite);
}

/**
 * Ganancia neta: total vendido menos costo, solo de ventas cuyo producto tiene
 * costo registrado. Regresa null si ningún producto tiene costo.
 */
export function gananciaNeta(ventas: Sale[], productos: Product[]) {
  const costos = new Map(productos.filter((p) => (p.cost ?? 0) > 0).map((p) => [p._id, p.cost as number]));
  if (costos.size === 0) return null;
  let ganancia = 0;
  for (const v of ventas) {
    const costo = v.product ? costos.get(v.product._id) : undefined;
    if (costo !== undefined) ganancia += v.total - costo * v.quantity;
  }
  return round2(ganancia);
}

export const valorInventario = (productos: Product[]) =>
  round2(productos.reduce((a, p) => a + p.price * (p.quantity || 0), 0));

/** Rojo si el stock es bajo, naranja si es medio, verde si es suficiente. */
export const colorStock = (q: number) => (q < STOCK_BAJO ? colors.danger : q < STOCK_MEDIO ? colors.warning : colors.success);

export const productosStockBajo = (productos: Product[]) =>
  productos.filter((p) => (p.quantity ?? 0) < STOCK_BAJO).sort((a, b) => a.quantity - b.quantity);

/** Margen de ganancia de un producto en % sobre el precio, o null sin costo. */
export const margen = (p: Pick<Product, 'price' | 'cost'>) =>
  p.cost && p.cost > 0 && p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : null;

const csvCelda = (valor: string | number) => {
  const s = String(valor ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV de ventas (con BOM para que Excel respete los acentos). */
export function ventasCSV(ventas: Sale[]) {
  const encabezado = ['Folio', 'Fecha', 'Producto', 'Cantidad', 'Precio', 'Descuento', 'Total', 'Método de pago', 'Paga con', 'Cambio', 'Cliente'];
  const filas = ventas.map((v) => [
    folioTxt(v.folio),
    formatDateTime(fechaVenta(v)),
    v.product?.name ?? 'Producto eliminado',
    v.quantity,
    v.price.toFixed(2),
    v.discount > 0 ? (v.discountType === 'fijo' ? `$${v.discount}` : `${v.discount}%`) : '',
    v.total.toFixed(2),
    metodoTxt(v.paymentMethod),
    v.paymentMethod === 'credito' ? '' : (v.amountPaid ?? v.total).toFixed(2),
    v.paymentMethod === 'credito' ? '' : (v.change ?? 0).toFixed(2),
    fullName(v.client) || 'Sin cliente',
  ]);
  return '﻿' + [encabezado, ...filas].map((f) => f.map(csvCelda).join(',')).join('\r\n');
}

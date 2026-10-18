import type { Sale } from '@/lib/types';
import {
  billetesSugeridos,
  buscarVentas,
  calcularCambio,
  calcularTotal,
  creditoDisponible,
  fechaParaEnviar,
  fechaVenta,
  filtrarPorPeriodo,
  porcentajeCreditoUsado,
} from '@/lib/ventas';

const venta = (extra: Partial<Sale>): Sale => ({
  _id: Math.random().toString(36).slice(2),
  folio: 1,
  product: { _id: 'p1', name: 'Refresco', price: 20 },
  client: null,
  quantity: 1,
  price: 20,
  discount: 0,
  discountType: 'porcentaje',
  total: 20,
  saleDate: null,
  paymentMethod: 'efectivo',
  amountPaid: 20,
  change: 0,
  createdAt: new Date().toISOString(),
  ...extra,
});

describe('calcularTotal (igual que el backend)', () => {
  it('aplica el porcentaje al importe', () => {
    expect(calcularTotal(20, 3, 10, 'porcentaje')).toBe(54);
  });
  it('aplica el descuento fijo una sola vez a la venta', () => {
    expect(calcularTotal(10, 2, 5, 'fijo')).toBe(15);
  });
  it('nunca es negativo', () => {
    expect(calcularTotal(10, 1, 50, 'fijo')).toBe(0);
    expect(calcularTotal(10, 1, 150, 'porcentaje')).toBe(0);
  });
  it('redondea a centavos', () => {
    expect(calcularTotal(19.99, 3, 0, 'porcentaje')).toBe(59.97);
    expect(calcularTotal(33.33, 1, 15, 'porcentaje')).toBe(28.33);
  });
  it('sin producto o cantidad regresa 0', () => {
    expect(calcularTotal(10, 0, 0, 'porcentaje')).toBe(0);
  });
});

describe('cambio y crédito', () => {
  it('calcula el cambio y lo marca negativo si falta dinero', () => {
    expect(calcularCambio(40, 50)).toBe(10);
    expect(calcularCambio(40, 30)).toBe(-10);
    expect(calcularCambio(0.3, 0.5)).toBe(0.2);
  });
  it('crédito disponible y porcentaje usado', () => {
    expect(creditoDisponible({ limiteCredito: 500, saldo: 120 })).toBe(380);
    expect(creditoDisponible({ limiteCredito: 100, saldo: 150 })).toBe(0);
    expect(creditoDisponible(null)).toBe(0);
    expect(porcentajeCreditoUsado({ limiteCredito: 200, saldo: 50 })).toBe(25);
    expect(porcentajeCreditoUsado({ limiteCredito: 0, saldo: 10 })).toBe(100);
  });
  it('sugiere billetes mayores al total', () => {
    expect(billetesSugeridos(37)).toEqual([50, 100, 200]);
    expect(billetesSugeridos(950)).toEqual([1000]);
    expect(billetesSugeridos(0)).toEqual([]);
  });
});

describe('fechas de venta', () => {
  it('usa la hora real cuando la venta tiene fecha con hora', () => {
    const iso = new Date(2026, 9, 8, 17, 42).toISOString();
    expect(fechaVenta({ saleDate: iso, createdAt: iso }).getHours()).toBe(17);
  });
  it('ventas antiguas (solo día a las 12:00 UTC) toman la hora de registro', () => {
    const creada = new Date(2026, 9, 8, 9, 15);
    const f = fechaVenta({ saleDate: '2026-10-08T12:00:00.000Z', createdAt: creada.toISOString() });
    expect(f.getDate()).toBe(8);
    expect(f.getHours()).toBe(9);
    expect(f.getMinutes()).toBe(15);
  });
  it('fechaParaEnviar conserva el día elegido con la hora actual', () => {
    const ahora = new Date(2026, 9, 8, 20, 30, 5);
    const ayer = new Date(2026, 9, 7);
    const enviada = new Date(fechaParaEnviar(ayer, ahora));
    expect(enviada.getDate()).toBe(7);
    expect(enviada.getHours()).toBe(20);
    expect(fechaParaEnviar(new Date(2026, 9, 8), ahora)).toBe(ahora.toISOString());
  });
});

describe('filtros y búsqueda', () => {
  const ahora = new Date(2026, 9, 15, 12);
  const hoy = venta({ saleDate: new Date(2026, 9, 15, 9).toISOString(), folio: 12 });
  const semana = venta({ saleDate: new Date(2026, 9, 11, 9).toISOString(), folio: 7, product: { _id: 'p2', name: 'Galletas', price: 15 } });
  const mesPasado = venta({ saleDate: new Date(2026, 8, 30, 9).toISOString(), folio: 3, client: { _id: 'c1', name: 'Ana', lastName: 'López' } });
  const todas = [hoy, semana, mesPasado];

  it('filtra por período', () => {
    expect(filtrarPorPeriodo(todas, 'hoy', ahora)).toEqual([hoy]);
    expect(filtrarPorPeriodo(todas, 'semana', ahora)).toEqual([hoy, semana]);
    expect(filtrarPorPeriodo(todas, 'mes', ahora)).toEqual([hoy, semana]);
    expect(filtrarPorPeriodo(todas, 'todo', ahora)).toHaveLength(3);
  });
  it('busca por folio exacto (con o sin ceros), producto y cliente', () => {
    expect(buscarVentas(todas, '000012')).toEqual([hoy]);
    expect(buscarVentas(todas, '7')).toEqual([semana]);
    expect(buscarVentas(todas, 'galle')).toEqual([semana]);
    expect(buscarVentas(todas, 'ana lópez')).toEqual([mesPasado]);
    expect(buscarVentas(todas, '')).toHaveLength(3);
  });
});

import { leerPayload, tokenVencido } from '@/lib/jwt';
import {
  gananciaNeta,
  resumenMes,
  topClientes,
  topProductos,
  ventasCSV,
  ventasPorCategoria,
  ventasPorDia,
  ventasPorDiaSemana,
} from '@/lib/reportes';
import { ticketHTML } from '@/lib/ticket';
import type { Product, Sale } from '@/lib/types';

const v = (fecha: Date, total: number, extra: Partial<Sale> = {}): Sale => ({
  _id: Math.random().toString(36).slice(2),
  folio: 1,
  product: { _id: 'p1', name: 'Refresco', price: total, category: 'Bebidas', unit: 'piezas' },
  client: null,
  quantity: 1,
  price: total,
  discount: 0,
  discountType: 'porcentaje',
  total,
  saleDate: fecha.toISOString(),
  paymentMethod: 'efectivo',
  amountPaid: total,
  change: 0,
  createdAt: fecha.toISOString(),
  ...extra,
});

const ahora = new Date(2026, 9, 15, 18);

describe('reportes', () => {
  it('ventas por día: solo los días de la ventana (no el mismo día de otro año)', () => {
    const ventas = [v(new Date(2026, 9, 15, 10), 100), v(new Date(2026, 9, 14, 10), 50), v(new Date(2025, 9, 15, 10), 999)];
    const puntos = ventasPorDia(ventas, 7, ahora);
    expect(puntos).toHaveLength(7);
    expect(puntos[6]).toMatchObject({ clave: '2026-10-15', valor: 100 });
    expect(puntos[5].valor).toBe(50);
    expect(puntos.reduce((a, p) => a + p.valor, 0)).toBe(150);
  });

  it('resumen del mes con comparación contra el mes anterior', () => {
    const r = resumenMes([v(new Date(2026, 9, 2), 300), v(new Date(2026, 9, 3), 100), v(new Date(2026, 8, 10), 200)], ahora);
    expect(r.totalMes).toBe(400);
    expect(r.totalMesAnterior).toBe(200);
    expect(r.cambioPct).toBe(100);
    expect(r.transacciones).toBe(2);
    expect(r.ticketPromedio).toBe(200);
    expect(resumenMes([], ahora).cambioPct).toBeNull();
  });

  it('top productos agrupa por id y ordena por unidades', () => {
    const ventas = [
      v(ahora, 40, { quantity: 2 }),
      v(ahora, 20, { quantity: 1 }),
      v(ahora, 90, { quantity: 1, product: { _id: 'p2', name: 'Pastel', price: 90 } }),
      v(ahora, 10, { product: null }),
    ];
    const top = topProductos(ventas);
    expect(top[0]).toMatchObject({ id: 'p1', unidades: 3, total: 60 });
    expect(top[1]).toMatchObject({ id: 'p2', unidades: 1 });
    expect(top).toHaveLength(2);
  });

  it('categorías, días de la semana y clientes', () => {
    const ventas = [
      v(new Date(2026, 9, 12), 30, { client: { _id: 'c1', name: 'Ana', lastName: 'López' } }),
      v(new Date(2026, 9, 12), 70, { product: { _id: 'p3', name: 'Jabón', price: 70 }, client: { _id: 'c1', name: 'Ana', lastName: 'López' } }),
    ];
    const cats = ventasPorCategoria(ventas);
    expect(cats.map((c) => c.nombre)).toEqual(['Sin categoría', 'Bebidas']);
    expect(cats[0].pct).toBeCloseTo(70);
    const semana = ventasPorDiaSemana(ventas);
    expect(semana[1]).toMatchObject({ etiqueta: 'Lun', valor: 100 });
    expect(topClientes(ventas)[0]).toMatchObject({ nombre: 'Ana López', compras: 2, total: 100 });
  });

  it('ganancia neta solo con productos que tienen costo', () => {
    const productos = [{ _id: 'p1', cost: 12 } as Product, { _id: 'p2', cost: 0 } as Product];
    const ventas = [v(ahora, 36, { quantity: 2 }), v(ahora, 50, { product: { _id: 'p2', name: 'X', price: 50 } })];
    expect(gananciaNeta(ventas, productos)).toBe(12);
    expect(gananciaNeta(ventas, [{ _id: 'p1', cost: 0 } as Product])).toBeNull();
  });

  it('CSV con BOM, comillas escapadas y columnas de pago', () => {
    const csv = ventasCSV([
      v(ahora, 40, { folio: 7, product: { _id: 'p1', name: 'Pan "grande", integral', price: 40 }, amountPaid: 50, change: 10 }),
      v(ahora, 80, { folio: 8, paymentMethod: 'credito', amountPaid: null }),
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const filas = csv.slice(1).split('\r\n');
    expect(filas[0]).toBe('Folio,Fecha,Producto,Cantidad,Precio,Descuento,Total,Método de pago,Paga con,Cambio,Cliente');
    expect(filas[1]).toContain('000007');
    expect(filas[1]).toContain('"Pan ""grande"", integral"');
    expect(filas[1]).toContain('Efectivo,50.00,10.00');
    expect(filas[2]).toContain('Crédito,,');
  });
});

describe('ticket', () => {
  const venta = v(ahora, 40, { folio: 25, quantity: 2, price: 25, discount: 10, discountType: 'fijo', amountPaid: 100, change: 60 });

  it('incluye folio, total, paga con y cambio', () => {
    const html = ticketHTML(venta, { name: 'Abarrotes Doña Mary', rfc: 'GOMA800101AB1', rfcGenerico: false });
    expect(html).toContain('FOLIO 000025');
    expect(html).toContain('Abarrotes Doña Mary');
    expect(html).toContain('RFC: GOMA800101AB1');
    expect(html).toContain('Paga con');
    expect(html).toContain('$100.00');
    expect(html).toContain('Cambio');
    expect(html).toContain('$60.00');
    expect(html).toContain('-$10.00');
  });

  it('ventas a crédito no muestran cambio y el RFC genérico no se imprime', () => {
    const html = ticketHTML({ ...venta, paymentMethod: 'credito' }, { name: 'Tienda', rfc: 'XAXX010101000', rfcGenerico: true });
    expect(html).toContain('Cargado a crédito');
    expect(html).not.toContain('Cambio');
    expect(html).not.toContain('XAXX010101000');
  });

  it('escapa HTML en los nombres', () => {
    const html = ticketHTML({ ...venta, product: { _id: 'x', name: '<script>alert(1)</script>', price: 1 } }, { name: 'A & B' });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
  });
});

describe('sesión (JWT)', () => {
  // base64url del JSON en UTF-8 (como lo genera jsonwebtoken)
  const base64url = (txt: string) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(txt))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const firmar = (payload: object) => `x.${base64url(JSON.stringify(payload))}.y`;

  it('lee el payload con acentos', () => {
    expect(leerPayload(firmar({ name: 'José Núñez' }))?.name).toBe('José Núñez');
    expect(leerPayload('basura')).toBeNull();
  });
  it('detecta tokens vencidos', () => {
    const ahoraS = Math.floor(Date.now() / 1000);
    expect(tokenVencido(firmar({ exp: ahoraS + 3600 }))).toBe(false);
    expect(tokenVencido(firmar({ exp: ahoraS - 10 }))).toBe(true);
    expect(tokenVencido(firmar({}))).toBe(true);
  });
});

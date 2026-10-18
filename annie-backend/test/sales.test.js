const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, detener, nuevaCuenta, RFC_NEGOCIO, RFC_CLIENTE } = require('./helpers');
const { calcularTotal } = require('../routes/sales');

before(iniciar);
after(detener);

async function producto(c, datos = {}) {
  const res = await c.post('/products', { name: 'Refresco', price: 20, quantity: 10, ...datos });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

async function clienteCredito(c, limite = 500) {
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const res = await c.post('/clients', {
    name: 'Juan', lastName: 'Pérez', esMayoreo: true, tipoPersona: 'fisica',
    rfc: RFC_CLIENTE, limiteCredito: limite,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

test('calcularTotal: porcentaje por unidad y descuento fijo sobre el importe', () => {
  assert.equal(calcularTotal(20, 3, 10, 'porcentaje'), 54);
  assert.equal(calcularTotal(10, 2, 5, 'fijo'), 15);
  assert.equal(calcularTotal(10, 1, 50, 'fijo'), 0);
  assert.equal(calcularTotal(19.99, 3, 0, 'porcentaje'), 59.97);
});

test('venta en efectivo: folio, total, pago, cambio y descuento de inventario', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c);

  const res = await c.post('/sales', { productId: p._id, quantity: 2, paymentMethod: 'efectivo', amountPaid: 50 });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const v = res.body.sale;
  assert.equal(v.folio, 1);
  assert.equal(v.total, 40);
  assert.equal(v.amountPaid, 50);
  assert.equal(v.change, 10);
  assert.equal(v.paymentMethod, 'efectivo');
  assert.equal(v.product.name, 'Refresco');
  assert.equal(res.body.inventarioRestante, 8);

  const segunda = await c.post('/sales', { productId: p._id, quantity: 1 });
  assert.equal(segunda.body.sale.folio, 2);
  // Sin "paga con" se asume pago exacto
  assert.equal(segunda.body.sale.amountPaid, 20);
  assert.equal(segunda.body.sale.change, 0);
});

test('los folios son independientes por negocio', async () => {
  const a = await nuevaCuenta();
  const b = await nuevaCuenta();
  const pa = await producto(a);
  const pb = await producto(b);
  await a.post('/sales', { productId: pa._id, quantity: 1 });
  await a.post('/sales', { productId: pa._id, quantity: 1 });
  const vb = await b.post('/sales', { productId: pb._id, quantity: 1 });
  assert.equal(vb.body.sale.folio, 1);
});

test('rechaza pago menor al total, stock insuficiente y cantidades inválidas', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { quantity: 3 });

  const pocoPago = await c.post('/sales', { productId: p._id, quantity: 2, amountPaid: 10 });
  assert.equal(pocoPago.status, 400);
  assert.match(pocoPago.body.message, /menor al total/);

  const sinStock = await c.post('/sales', { productId: p._id, quantity: 4 });
  assert.equal(sinStock.status, 400);
  assert.match(sinStock.body.message, /Stock insuficiente/);

  for (const quantity of [0, -1, 1.5, 'abc']) {
    const r = await c.post('/sales', { productId: p._id, quantity });
    assert.equal(r.status, 400, `quantity=${quantity}`);
  }

  const descuentoMalo = await c.post('/sales', { productId: p._id, quantity: 1, discount: 150 });
  assert.equal(descuentoMalo.status, 400);

  const inv = await c.get(`/products/${p._id}`);
  assert.equal(inv.body.quantity, 3, 'las ventas rechazadas no deben tocar el inventario');
});

test('descuento fijo se aplica una vez al importe de la venta', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { price: 10 });
  const res = await c.post('/sales', { productId: p._id, quantity: 2, discount: 5, discountType: 'fijo' });
  assert.equal(res.status, 201);
  assert.equal(res.body.sale.total, 15);
});

test('crédito: solo clientes con crédito, cargo al saldo y movimiento con folio', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { price: 100, quantity: 20 });

  const normal = await c.post('/clients', { name: 'Ana' });
  const sinCredito = await c.post('/sales', { productId: p._id, quantity: 1, clientId: normal.body._id, paymentMethod: 'credito' });
  assert.equal(sinCredito.status, 400);
  assert.match(sinCredito.body.message, /crédito/);

  const cli = await clienteCredito(c, 500);
  const venta = await c.post('/sales', { productId: p._id, quantity: 3, clientId: cli._id, paymentMethod: 'credito' });
  assert.equal(venta.status, 201, JSON.stringify(venta.body));
  assert.equal(venta.body.sale.paymentMethod, 'credito');
  assert.equal(venta.body.sale.amountPaid, null);

  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.body.client.saldo, 300);
  assert.equal(edo.body.movimientos.length, 1);
  assert.equal(edo.body.movimientos[0].type, 'cargo');
  assert.equal(edo.body.movimientos[0].description, `Venta folio ${venta.body.sale.folio}`);

  const excede = await c.post('/sales', { productId: p._id, quantity: 3, clientId: cli._id, paymentMethod: 'credito' });
  assert.equal(excede.status, 400);
  assert.match(excede.body.message, /Crédito insuficiente/);
  const inv = await c.get(`/products/${p._id}`);
  assert.equal(inv.body.quantity, 17, 'una venta a crédito rechazada no debe tocar el inventario');
});

test('cancelar una venta regresa el inventario y revierte el crédito', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { price: 50, quantity: 10 });
  const cli = await clienteCredito(c, 1000);

  const efectivo = await c.post('/sales', { productId: p._id, quantity: 2 });
  const credito = await c.post('/sales', { productId: p._id, quantity: 4, clientId: cli._id, paymentMethod: 'credito' });
  assert.equal((await c.get(`/products/${p._id}`)).body.quantity, 4);

  assert.equal((await c.delete(`/sales/${efectivo.body.sale._id}`)).status, 200);
  assert.equal((await c.get(`/products/${p._id}`)).body.quantity, 6);

  assert.equal((await c.delete(`/sales/${credito.body.sale._id}`)).status, 200);
  assert.equal((await c.get(`/products/${p._id}`)).body.quantity, 10);
  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.body.client.saldo, 0);
  assert.equal(edo.body.movimientos[0].type, 'abono');
  assert.match(edo.body.movimientos[0].description, /Cancelación de venta folio/);

  const otra = await c.delete(`/sales/${credito.body.sale._id}`);
  assert.equal(otra.status, 404);
});

test('ventas simultáneas: folios únicos y el inventario nunca queda negativo', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { quantity: 5 });

  const intentos = await Promise.all(
    Array.from({ length: 8 }, () => c.post('/sales', { productId: p._id, quantity: 1 }))
  );
  const exitosas = intentos.filter((r) => r.status === 201);
  const fallidas = intentos.filter((r) => r.status !== 201);
  assert.equal(exitosas.length, 5);
  assert.ok(fallidas.every((r) => r.status === 400));

  const folios = exitosas.map((r) => r.body.sale.folio);
  assert.equal(new Set(folios).size, folios.length, `folios repetidos: ${folios}`);
  assert.equal((await c.get(`/products/${p._id}`)).body.quantity, 0);
});

test('GET /sales lista con folio, producto (con unidad) y cliente', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { unit: 'kg', category: 'Abarrotes' });
  const cli = await c.post('/clients', { name: 'Luis', lastName: 'Gómez' });
  await c.post('/sales', { productId: p._id, quantity: 1, clientId: cli.body._id });
  const res = await c.get('/sales');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].folio, 1);
  assert.equal(res.body[0].product.unit, 'kg');
  assert.equal(res.body[0].product.category, 'Abarrotes');
  assert.equal(res.body[0].client.name, 'Luis');
});

test('no se puede vender un producto de otro negocio', async () => {
  const a = await nuevaCuenta();
  const b = await nuevaCuenta();
  const pa = await producto(a);
  const res = await b.post('/sales', { productId: pa._id, quantity: 1 });
  assert.equal(res.status, 404);
});

test('cancelar la misma venta dos veces al mismo tiempo solo regresa el inventario una vez', async () => {
  const c = await nuevaCuenta();
  const p = await producto(c, { price: 30, quantity: 10 });
  const cli = await clienteCredito(c, 1000);
  const venta = await c.post('/sales', { productId: p._id, quantity: 3, clientId: cli._id, paymentMethod: 'credito' });
  assert.equal(venta.status, 201);

  const [r1, r2] = await Promise.all([c.delete(`/sales/${venta.body.sale._id}`), c.delete(`/sales/${venta.body.sale._id}`)]);
  assert.deepEqual([r1.status, r2.status].sort(), [200, 404]);
  assert.equal((await c.get(`/products/${p._id}`)).body.quantity, 10);
  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.body.client.saldo, 0);
  assert.equal(edo.body.movimientos.filter((m) => m.type === 'abono').length, 1);
});

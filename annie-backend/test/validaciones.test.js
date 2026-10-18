const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, detener, nuevaCuenta, request, RFC_NEGOCIO, RFC_CLIENTE } = require('./helpers');

before(iniciar);
after(detener);

async function clienteCredito(c, limite) {
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const res = await c.post('/clients', {
    name: 'Juan', esMayoreo: true, tipoPersona: 'fisica', rfc: RFC_CLIENTE, limiteCredito: limite,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

test('ids mal formados responden 404 (no 500)', async () => {
  const c = await nuevaCuenta();
  const casos = [
    ['get', '/products/no-es-un-id'],
    ['put', '/products/no-es-un-id'],
    ['delete', '/products/no-es-un-id'],
    ['get', '/clients/xyz'],
    ['put', '/clients/xyz'],
    ['delete', '/clients/xyz'],
    ['get', '/credits/xyz/movimientos'],
    ['post', '/credits/xyz/cargo'],
    ['post', '/credits/xyz/abono'],
    ['put', '/credits/xyz/limite'],
    ['delete', '/sales/xyz'],
  ];
  for (const [metodo, ruta] of casos) {
    const res = await c[metodo](ruta, { amount: 10 });
    assert.equal(res.status, 404, `${metodo.toUpperCase()} ${ruta} -> ${res.status}`);
  }
  const venta = await c.post('/sales', { productId: 'abc', quantity: 1 });
  assert.equal(venta.status, 404);
});

test('peticiones sin cuerpo JSON responden 400 (no 500)', async () => {
  const c = await nuevaCuenta();
  const p = (await c.post('/products', { name: 'X', price: 1 })).body;
  const sinCuerpo = (metodo, ruta) => request()[metodo](ruta).set('Authorization', `Bearer ${c.token}`);
  assert.equal((await sinCuerpo('post', '/products')).status, 400);
  assert.equal((await sinCuerpo('post', '/clients')).status, 400);
  assert.equal((await sinCuerpo('put', '/profile/user')).status, 400);
  assert.equal((await sinCuerpo('post', '/sales')).status, 400);
  const editar = await sinCuerpo('put', `/products/${p._id}`);
  assert.ok(editar.status < 500, `PUT sin cuerpo -> ${editar.status}`);
});

test('productos: datos inválidos dan 400 con mensaje en español', async () => {
  const c = await nuevaCuenta();
  const casos = [
    [{ name: 'X', price: 10, quantity: -5 }, /stock no puede ser negativo/],
    [{ name: 'X', price: 'abc' }, /precio debe ser un número/],
    [{ name: 'X', price: 10, cost: 'mucho' }, /costo debe ser un número/],
    [{ name: '   ', price: 10 }, /nombre del producto es obligatorio/],
    [{ name: 'X' }, /precio es obligatorio/],
    [{ name: 'X', price: 10, discount: 150 }, /descuento no puede ser mayor a 100/],
  ];
  for (const [body, mensaje] of casos) {
    const res = await c.post('/products', body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.match(res.body.message, mensaje);
  }
  const p = (await c.post('/products', { name: 'Pan', price: '12.5', quantity: '3', cost: '' })).body;
  assert.equal(p.price, 12.5);
  assert.equal(p.quantity, 3);

  const vacio = await c.put(`/products/${p._id}`, { name: '' });
  assert.equal(vacio.status, 400);
  const negativo = await c.put(`/products/${p._id}`, { quantity: -1 });
  assert.equal(negativo.status, 400);
  const parcial = await c.put(`/products/${p._id}`, { price: 15 });
  assert.equal(parcial.status, 200);
  assert.equal(parcial.body.name, 'Pan', 'editar solo el precio no debe borrar el nombre');
});

test('clientes y perfil: datos inválidos dan 400', async () => {
  const c = await nuevaCuenta();
  const cli = (await c.post('/clients', { name: 'Ana' })).body;
  assert.equal((await c.put(`/clients/${cli._id}`, { name: '' })).status, 400);
  const fecha = await c.put('/profile/user', { name: 'A', lastName: 'B', birthDate: 'no-es-fecha' });
  assert.equal(fecha.status, 400);
  assert.match(fecha.body.message, /fecha/i);
  assert.equal((await c.put('/profile/business', { name: '' })).status, 400);
});

test('cargos simultáneos no pasan el límite y el saldo cuadra con el historial', async () => {
  const c = await nuevaCuenta();
  const cli = await clienteCredito(c, 100);
  const intentos = await Promise.all(Array.from({ length: 5 }, () => c.post(`/credits/${cli._id}/cargo`, { amount: 60 })));
  assert.equal(intentos.filter((r) => r.status === 201).length, 1);
  assert.ok(intentos.filter((r) => r.status !== 201).every((r) => r.status === 400));

  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.body.client.saldo, 60);
  assert.equal(edo.body.movimientos.reduce((a, m) => a + (m.type === 'cargo' ? m.amount : -m.amount), 0), 60);
});

test('abonos simultáneos no dejan el saldo en negativo', async () => {
  const c = await nuevaCuenta();
  const cli = await clienteCredito(c, 500);
  await c.post(`/credits/${cli._id}/cargo`, { amount: 100 });
  const intentos = await Promise.all(Array.from({ length: 4 }, () => c.post(`/credits/${cli._id}/abono`, { amount: 60 })));
  assert.equal(intentos.filter((r) => r.status === 201).length, 1);
  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.body.client.saldo, 40);
});

test('eliminar un producto con ventas lo oculta pero los tickets conservan su nombre', async () => {
  const c = await nuevaCuenta();
  const p = (await c.post('/products', { name: 'Galletas', price: 10, quantity: 5 })).body;
  await c.post('/sales', { productId: p._id, quantity: 1 });

  assert.equal((await c.delete(`/products/${p._id}`)).status, 200);
  assert.equal((await c.get('/products')).body.length, 0);
  assert.equal((await c.get(`/products/${p._id}`)).status, 404);
  assert.equal((await c.post('/sales', { productId: p._id, quantity: 1 })).status, 404);
  assert.equal((await c.delete(`/products/${p._id}`)).status, 404);

  const ventas = (await c.get('/sales')).body;
  assert.equal(ventas[0].product.name, 'Galletas');
});

test('eliminar un cliente con historial lo oculta pero conserva ventas y estado de cuenta', async () => {
  const c = await nuevaCuenta();
  const p = (await c.post('/products', { name: 'Refresco', price: 20, quantity: 10 })).body;
  const cli = await clienteCredito(c, 300);
  await c.post('/sales', { productId: p._id, quantity: 1, clientId: cli._id, paymentMethod: 'credito' });
  await c.post(`/credits/${cli._id}/abono`, { amount: 20 });

  assert.equal((await c.delete(`/clients/${cli._id}`)).status, 200);
  assert.equal((await c.get('/clients')).body.length, 0);
  assert.equal((await c.get('/credits')).body.length, 0);
  assert.equal((await c.get('/sales')).body[0].client.name, 'Juan');
  const edo = await c.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.status, 200);
  assert.equal(edo.body.movimientos.length, 2);
  // Un cliente eliminado ya no puede recibir ventas ni cargos
  assert.equal((await c.post('/sales', { productId: p._id, quantity: 1, clientId: cli._id })).status, 404);
  assert.equal((await c.post(`/credits/${cli._id}/cargo`, { amount: 5 })).status, 404);
});

test('un cliente sin historial se elimina por completo', async () => {
  const c = await nuevaCuenta();
  const cli = (await c.post('/clients', { name: 'Temporal' })).body;
  assert.equal((await c.delete(`/clients/${cli._id}`)).status, 200);
  assert.equal((await c.get(`/credits/${cli._id}/movimientos`)).status, 404);
});

test('una imagen falsa (texto con extensión .png) se rechaza', async () => {
  const c = await nuevaCuenta();
  const falsa = await c.upload('/products/upload-image', 'image', Buffer.from('<html><script>alert(1)</script></html>'), 'foto.png');
  assert.equal(falsa.status, 400);
  assert.match(falsa.body.message, /no es una imagen válida/);
  const logo = await c.upload('/profile/business/logo', 'logo', Buffer.from('GIF89a........'), 'logo.png');
  assert.equal(logo.status, 400);
});

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, detener, nuevaCuenta, request, RFC_NEGOCIO } = require('./helpers');

before(iniciar);
after(detener);

// PNG de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test('CRUD de productos con validaciones', async () => {
  const c = await nuevaCuenta();
  const sinNombre = await c.post('/products', { price: 10 });
  assert.equal(sinNombre.status, 400);
  const negativo = await c.post('/products', { name: 'X', price: -1 });
  assert.equal(negativo.status, 400);

  const creado = await c.post('/products', { name: 'Leche', price: 24, cost: 18, quantity: 30, unit: 'piezas', category: 'Lácteos' });
  assert.equal(creado.status, 201);

  const editado = await c.put(`/products/${creado.body._id}`, { name: 'Leche 1L', price: 25 });
  assert.equal(editado.status, 200);
  assert.equal(editado.body.name, 'Leche 1L');

  assert.equal((await c.get('/products')).body.length, 1);
  assert.equal((await c.delete(`/products/${creado.body._id}`)).status, 200);
  assert.equal((await c.get('/products')).body.length, 0);
});

test('subir imagen de producto y servirla públicamente', async () => {
  const c = await nuevaCuenta();
  const res = await c.upload('/products/upload-image', 'image', PNG, 'foto.png');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.match(res.body.url, /^\/uploads\/[a-f0-9]{24}$/);

  const img = await request().get(res.body.url);
  assert.equal(img.status, 200);
  assert.equal(img.headers['content-type'], 'image/png');
});

test('archivo con extensión no permitida responde 400 (no 500)', async () => {
  const c = await nuevaCuenta();
  const prod = await c.upload('/products/upload-image', 'image', Buffer.from('hola'), 'nota.txt');
  assert.equal(prod.status, 400);
  assert.match(prod.body.message, /Solo se permiten imágenes/);
  const logo = await c.upload('/profile/business/logo', 'logo', Buffer.from('hola'), 'foto.heic');
  assert.equal(logo.status, 400);
});

test('imagen de producto mayor a 5 MB indica el límite correcto', async () => {
  const c = await nuevaCuenta();
  const grande = Buffer.alloc(5 * 1024 * 1024 + 10);
  const res = await c.upload('/products/upload-image', 'image', grande, 'grande.png');
  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'El archivo debe pesar menos de 5MB');
});

test('perfil: actualizar negocio con RFC válido, inválido y vacío', async () => {
  const c = await nuevaCuenta();
  const ok = await c.put('/profile/business', { name: 'Mi Tienda', rfc: RFC_NEGOCIO, city: 'Puebla' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.rfc, RFC_NEGOCIO);
  assert.equal(ok.body.rfcGenerico, false);

  const malo = await c.put('/profile/business', { name: 'Mi Tienda', rfc: 'NOVALIDO' });
  assert.equal(malo.status, 400);

  const vacio = await c.put('/profile/business', { name: 'Mi Tienda', rfc: '' });
  assert.equal(vacio.body.rfcGenerico, true);

  const usuario = await c.put('/profile/user', { name: 'Nuevo', lastName: 'Nombre', city: 'Puebla' });
  assert.equal(usuario.status, 200);
  assert.equal(usuario.body.name, 'Nuevo');
  assert.equal(usuario.body.password, undefined, 'nunca regresar la contraseña');
});

test('subir logo del negocio', async () => {
  const c = await nuevaCuenta();
  const res = await c.upload('/profile/business/logo', 'logo', PNG, 'logo.png');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.match(res.body.logo, /^\/uploads\//);
  const perfil = await c.get('/profile');
  assert.equal(perfil.body.business.logo, res.body.logo);
});

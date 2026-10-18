const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { iniciar, detener, nuevaCuenta, request } = require('./helpers');

before(iniciar);
after(detener);

test('registro rechaza contraseña débil', async () => {
  const res = await request().post('/auth/register').send({
    name: 'A', lastName: 'B', email: 'debil@annie.test', password: 'abc', businessName: 'X',
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /contraseña/i);
});

test('registro sin RFC asigna el genérico y el perfil lo marca como genérico', async () => {
  const c = await nuevaCuenta();
  const res = await c.get('/profile');
  assert.equal(res.status, 200);
  assert.equal(res.body.business.rfc, 'XAXX010101000');
  assert.equal(res.body.business.rfcGenerico, true);
});

test('registro con email repetido falla', async () => {
  const c = await nuevaCuenta();
  const res = await request().post('/auth/register').send({
    name: 'A', lastName: 'B', email: c.email, password: 'Segura123!', businessName: 'Otra',
  });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Ya existe/);
});

test('login correcto e incorrecto', async () => {
  const c = await nuevaCuenta();
  const ok = await request().post('/auth/login').send({ email: c.email, password: c.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.email, c.email);

  const mal = await request().post('/auth/login').send({ email: c.email, password: 'Otra123!!' });
  assert.equal(mal.status, 401);
  assert.equal(mal.body.message, 'Credenciales inválidas');
});

test('la app móvil recibe una sesión de 30 días; la web de 8 horas', async () => {
  const c = await nuevaCuenta();
  const web = await request().post('/auth/login').send({ email: c.email, password: c.password });
  const movil = await request().post('/auth/login').send({ email: c.email, password: c.password, client: 'mobile' });
  const durWeb = jwt.decode(web.body.token);
  const durMovil = jwt.decode(movil.body.token);
  assert.equal(durWeb.exp - durWeb.iat, 8 * 3600);
  assert.equal(durMovil.exp - durMovil.iat, 30 * 24 * 3600);
});

test('token inválido o ausente responde 401', async () => {
  const sinToken = await request().get('/products');
  assert.equal(sinToken.status, 401);
  const invalido = await request().get('/products').set('Authorization', 'Bearer no-es-un-token');
  assert.equal(invalido.status, 401);
  const vencido = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET, { expiresIn: -10 });
  const res = await request().get('/products').set('Authorization', `Bearer ${vencido}`);
  assert.equal(res.status, 401);
});

test('sin JWT_SECRET el registro falla ANTES de guardar al usuario', async () => {
  const secreto = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    const email = `sinclave_${Date.now()}@annie.test`;
    const res = await request().post('/auth/register').send({
      name: 'A', lastName: 'B', email, password: 'Segura123!', businessName: 'X',
    });
    assert.equal(res.status, 500);
    assert.match(res.body.message, /JWT_SECRET/);
    process.env.JWT_SECRET = secreto;
    // Al corregir la configuración, la misma persona sí puede registrarse
    const otra = await request().post('/auth/register').send({
      name: 'A', lastName: 'B', email, password: 'Segura123!', businessName: 'X',
    });
    assert.equal(otra.status, 201);
  } finally {
    process.env.JWT_SECRET = secreto;
  }
});

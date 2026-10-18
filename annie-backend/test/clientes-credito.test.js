const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, detener, nuevaCuenta, RFC_NEGOCIO, RFC_CLIENTE } = require('./helpers');

before(iniciar);
after(detener);

const datosCredito = (limite = 300) => ({
  name: 'Juan', lastName: 'Pérez', esMayoreo: true, tipoPersona: 'fisica', rfc: RFC_CLIENTE, limiteCredito: limite,
});

test('sin RFC real del negocio no se puede activar el crédito', async () => {
  const c = await nuevaCuenta();
  const res = await c.post('/clients', datosCredito());
  assert.equal(res.status, 400);
  assert.match(res.body.message, /RFC de tu negocio/);
});

test('cliente de crédito: RFC obligatorio y válido', async () => {
  const c = await nuevaCuenta();
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });

  const sinRfc = await c.post('/clients', { ...datosCredito(), rfc: '' });
  assert.equal(sinRfc.status, 400);
  const malo = await c.post('/clients', { ...datosCredito(), rfc: 'ABC' });
  assert.equal(malo.status, 400);
  const ok = await c.post('/clients', datosCredito());
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.saldo, 0);
  assert.equal(ok.body.creditoDisponible, 300);
});

test('cargos, abonos y sus límites', async () => {
  const c = await nuevaCuenta();
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const cli = (await c.post('/clients', datosCredito(300))).body;

  const cargo = await c.post(`/credits/${cli._id}/cargo`, { amount: 120.555 });
  assert.equal(cargo.status, 201);
  assert.equal(cargo.body.saldo, 120.56);

  const excede = await c.post(`/credits/${cli._id}/cargo`, { amount: 200 });
  assert.equal(excede.status, 400);

  const abonoGrande = await c.post(`/credits/${cli._id}/abono`, { amount: 500 });
  assert.equal(abonoGrande.status, 400);

  const abono = await c.post(`/credits/${cli._id}/abono`, { amount: 20.56 });
  assert.equal(abono.status, 201);
  assert.equal(abono.body.saldo, 100);

  const resumen = await c.get('/credits/resumen');
  assert.equal(resumen.body.totalPorCobrar, 100);
  assert.equal(resumen.body.clientesCredito, 1);
});

test('no se puede bajar el límite por debajo del saldo ni borrar con deuda', async () => {
  const c = await nuevaCuenta();
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const cli = (await c.post('/clients', datosCredito(300))).body;
  await c.post(`/credits/${cli._id}/cargo`, { amount: 150 });

  const bajar = await c.put(`/clients/${cli._id}`, { limiteCredito: 100 });
  assert.equal(bajar.status, 400);
  assert.match(bajar.body.message, /no puede ser menor al saldo/);

  const quitar = await c.put(`/clients/${cli._id}`, { esMayoreo: false });
  assert.equal(quitar.status, 400);

  const borrar = await c.delete(`/clients/${cli._id}`);
  assert.equal(borrar.status, 400);
  assert.match(borrar.body.message, /saldo pendiente/);
});

test('editar un cliente de crédito existente funciona aunque el negocio ya no tenga RFC', async () => {
  const c = await nuevaCuenta();
  await c.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const cli = (await c.post('/clients', datosCredito())).body;

  // El dueño borra el RFC del negocio: queda el genérico
  const negocio = await c.put('/profile/business', { name: 'Tienda', rfc: '' });
  assert.equal(negocio.body.rfc, 'XAXX010101000');
  assert.equal(negocio.body.rfcGenerico, true);

  // La web manda esMayoreo: true en cada edición; cambiar el teléfono debe funcionar
  const editar = await c.put(`/clients/${cli._id}`, { ...datosCredito(), phone: '5551234567' });
  assert.equal(editar.status, 200, JSON.stringify(editar.body));
  assert.equal(editar.body.phone, '5551234567');
});

test('clientes de otro negocio no son visibles', async () => {
  const a = await nuevaCuenta();
  const b = await nuevaCuenta();
  const cli = (await a.post('/clients', { name: 'Privado' })).body;
  assert.equal((await b.get(`/clients/${cli._id}`)).status, 404);
  assert.equal((await b.get('/clients')).body.length, 0);
});

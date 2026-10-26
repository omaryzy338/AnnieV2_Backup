const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {
  iniciar, detener, nuevaCuenta, nuevoEmpleado, conToken, request, RFC_NEGOCIO, RFC_CLIENTE,
} = require('./helpers');
const User = require('../models/User');

before(iniciar);
after(detener);

const SOLO_DUENO = 'Solo el dueño del negocio puede hacer esto.';
const SIN_ACCESO = 'Tu acceso como empleado fue desactivado. Pídele al dueño que lo active.';
const SESION_CERRADA = 'Tu sesión terminó porque el dueño cambió tu acceso. Inicia sesión de nuevo.';
const DESACTIVADA = 'Tu cuenta de empleado está desactivada. Pídele al dueño que la active.';
const MENSAJE_PASSWORD =
  'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%...)';

// PNG de 1x1 pixel
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const login = (email, password, extra = {}) => request().post('/auth/login').send({ email, password, ...extra });
const emailUnico = (nombre) => `${nombre}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@annie.test`;

async function producto(c, datos = {}) {
  const res = await c.post('/products', { name: 'Refresco', price: 20, cost: 12, quantity: 10, ...datos });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

async function clienteCredito(dueno, limite = 500) {
  await dueno.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const res = await dueno.post('/clients', {
    name: 'Juan', lastName: 'Pérez', esMayoreo: true, tipoPersona: 'fisica', rfc: RFC_CLIENTE, limiteCredito: limite,
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
}

test('el dueño da de alta empleados: validaciones, email repetido y contraseña débil', async () => {
  const dueno = await nuevaCuenta();
  const base = { name: 'Luis', lastName: 'Ramírez', email: emailUnico('luis'), password: 'Empleado123!' };

  const faltan = await dueno.post('/employees', { name: 'Luis' });
  assert.equal(faltan.status, 400);
  assert.equal(faltan.body.message, 'Faltan campos obligatorios: name, lastName, email, password');
  assert.equal((await dueno.post('/employees', { ...base, lastName: '   ' })).status, 400);

  const emailMalo = await dueno.post('/employees', { ...base, email: 'no-es-un-email' });
  assert.equal(emailMalo.status, 400);
  assert.equal(emailMalo.body.message, 'El email no tiene un formato válido');

  // Misma regla y mismo mensaje que el registro de dueños
  const debil = await dueno.post('/employees', { ...base, password: 'sinmayuscula1!' });
  assert.equal(debil.status, 400);
  assert.equal(debil.body.message, MENSAJE_PASSWORD);
  const registroDebil = await request().post('/auth/register').send({
    name: 'A', lastName: 'B', email: emailUnico('debil'), password: 'abc', businessName: 'X',
  });
  assert.equal(registroDebil.body.message, MENSAJE_PASSWORD);

  // rol y dueno del cuerpo se ignoran: siempre es empleado de quien lo crea
  const creado = await dueno.post('/employees', {
    ...base, email: base.email.toUpperCase(), rol: 'dueno', dueno: '507f1f77bcf86cd799439011', activo: false,
  });
  assert.equal(creado.status, 201, JSON.stringify(creado.body));
  assert.deepEqual(
    Object.keys(creado.body).sort(),
    ['_id', 'activo', 'createdAt', 'email', 'lastName', 'name', 'rol', 'updatedAt']
  );
  assert.equal(creado.body.email, base.email);
  assert.equal(creado.body.rol, 'empleado');
  assert.equal(creado.body.activo, true);

  const enBase = await User.findById(creado.body._id);
  assert.equal(enBase.rol, 'empleado');
  assert.equal(String(enBase.dueno), dueno.user.id);
  assert.notEqual(enBase.password, base.password, 'la contraseña se guarda hasheada');

  const repetido = await dueno.post('/employees', base);
  assert.equal(repetido.status, 400);
  assert.equal(repetido.body.message, 'Ya existe una cuenta con ese email');
  const deDueno = await dueno.post('/employees', { ...base, email: dueno.email });
  assert.equal(deDueno.status, 400);
  assert.equal(deDueno.body.message, 'Ya existe una cuenta con ese email');
  // Tampoco se puede registrar un negocio con el email de un empleado
  const registro = await request().post('/auth/register').send({ ...base, businessName: 'Otra' });
  assert.equal(registro.status, 400);
  assert.match(registro.body.message, /Ya existe/);

  // Lista: los más nuevos primero y nunca la contraseña
  const segundo = await dueno.post('/employees', { ...base, name: 'Ana', email: emailUnico('ana') });
  assert.equal(segundo.status, 201);
  const lista = await dueno.get('/employees');
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.body.map((e) => e.name), ['Ana', 'Luis']);
  assert.ok(lista.body.every((e) => e.password === undefined && e.rol === 'empleado' && e.activo === true));
});

test('dos altas simultáneas con el mismo email: solo una se crea', async () => {
  const dueno = await nuevaCuenta();
  await User.init(); // el índice único de email ya debe existir
  const body = { name: 'Doble', lastName: 'Alta', email: emailUnico('doble'), password: 'Empleado123!' };
  const [r1, r2] = await Promise.all([dueno.post('/employees', body), dueno.post('/employees', body)]);
  assert.deepEqual([r1.status, r2.status].sort(), [201, 400]);
  assert.equal((r1.status === 400 ? r1 : r2).body.message, 'Ya existe una cuenta con ese email');
  assert.equal((await dueno.get('/employees')).body.length, 1);
});

test('el empleado inicia sesión con rol "empleado" y los datos del negocio de su dueño', async () => {
  const dueno = await nuevaCuenta();
  assert.equal(dueno.user.rol, 'dueno');

  const emp = await nuevoEmpleado(dueno, { name: 'Carla', lastName: 'Soto' });
  assert.deepEqual(
    Object.keys(emp.user).sort(),
    ['businessId', 'businessName', 'email', 'id', 'lastName', 'name', 'ownerId', 'rol', 'slug']
  );
  assert.equal(emp.user.rol, 'empleado');
  assert.equal(emp.user.id, emp.empleado._id);
  assert.equal(emp.user.name, 'Carla');
  assert.equal(emp.user.ownerId, dueno.user.id);
  assert.equal(emp.user.businessId, dueno.user.businessId);
  assert.equal(emp.user.businessName, dueno.user.businessName);
  assert.equal(emp.user.slug, dueno.user.slug);

  const token = jwt.decode(emp.token);
  assert.equal(token.rol, 'empleado');
  assert.equal(token.ownerId, dueno.user.id);
  // La versión de sesión solo viaja en el token (no en los datos del usuario)
  assert.equal(token.sv, 0);

  // Misma duración de sesión que los dueños (30 días en la app móvil)
  const movil = jwt.decode((await login(emp.email, emp.password, { client: 'mobile' })).body.token);
  assert.equal(movil.exp - movil.iat, 30 * 24 * 3600);

  // El dueño sigue entrando como dueño
  const deDueno = await login(dueno.email, dueno.password);
  assert.equal(deDueno.body.user.rol, 'dueno');
  assert.equal(deDueno.body.user.ownerId, undefined);

  // Perfil: sus propios datos (con rol) y el negocio de su dueño
  const perfil = await emp.get('/profile');
  assert.equal(perfil.status, 200);
  assert.equal(perfil.body.user.rol, 'empleado');
  assert.equal(perfil.body.user.email, emp.email);
  assert.equal(perfil.body.user.password, undefined);
  assert.equal(perfil.body.business._id, dueno.user.businessId);
  assert.equal((await dueno.get('/profile')).body.user.rol, 'dueno');

  // Edita sus propios datos, sin poder cambiarse el rol ni el negocio
  const editar = await emp.put('/profile/user', { name: 'Carla María', lastName: 'Soto', rol: 'dueno', dueno: null });
  assert.equal(editar.status, 200, JSON.stringify(editar.body));
  assert.equal(editar.body._id, emp.user.id);
  assert.equal(editar.body.name, 'Carla María');
  assert.equal(editar.body.rol, 'empleado');
  const enBase = await User.findById(emp.user.id);
  assert.equal(enBase.rol, 'empleado');
  assert.equal(String(enBase.dueno), dueno.user.id);
  assert.equal((await dueno.get('/profile')).body.user.name, 'Prueba');
});

test('el empleado ve los productos del dueño, pero sin el costo', async () => {
  const dueno = await nuevaCuenta();
  const p = await producto(dueno, { cost: 12 });
  const emp = await nuevoEmpleado(dueno);

  const lista = await emp.get('/products');
  assert.equal(lista.status, 200);
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0]._id, p._id);
  assert.equal(lista.body[0].price, 20);
  assert.equal(lista.body[0].quantity, 10);
  assert.ok(!('cost' in lista.body[0]), 'el empleado no debe recibir el costo');

  const uno = await emp.get(`/products/${p._id}`);
  assert.equal(uno.status, 200);
  assert.equal(uno.body.name, 'Refresco');
  assert.ok(!('cost' in uno.body), 'el empleado no debe recibir el costo');

  // El dueño sí lo ve
  assert.equal((await dueno.get('/products')).body[0].cost, 12);
  assert.equal((await dueno.get(`/products/${p._id}`)).body.cost, 12);
});

test('el empleado vende con los folios del negocio y cada venta guarda quién la registró', async () => {
  const dueno = await nuevaCuenta();
  const p = await producto(dueno);
  const emp = await nuevoEmpleado(dueno, { name: 'Pedro', lastName: 'López' });

  const v1 = await dueno.post('/sales', { productId: p._id, quantity: 1 });
  assert.equal(v1.status, 201, JSON.stringify(v1.body));
  assert.equal(v1.body.sale.folio, 1);
  assert.equal(v1.body.sale.vendedor, dueno.user.id);
  assert.equal(v1.body.sale.vendedorNombre, 'Prueba Annie');

  const v2 = await emp.post('/sales', { productId: p._id, quantity: 2 });
  assert.equal(v2.status, 201, JSON.stringify(v2.body));
  assert.equal(v2.body.sale.folio, 2);
  assert.equal(v2.body.sale.vendedor, emp.user.id);
  assert.equal(v2.body.sale.vendedorNombre, 'Pedro López');
  assert.equal(v2.body.inventarioRestante, 7);

  const v3 = await dueno.post('/sales', { productId: p._id, quantity: 1 });
  assert.equal(v3.body.sale.folio, 3);

  // Los dos ven todas las ventas del negocio
  for (const c of [dueno, emp]) {
    const ventas = await c.get('/sales');
    assert.equal(ventas.status, 200);
    assert.deepEqual(ventas.body.map((v) => v.folio), [3, 2, 1]);
    assert.deepEqual(ventas.body.map((v) => v.vendedorNombre), ['Prueba Annie', 'Pedro López', 'Prueba Annie']);
    const resumen = await c.get('/sales/resumen');
    assert.equal(resumen.body.cantidadVentas, 3);
    assert.equal(resumen.body.totalVentas, 80);
  }
  assert.equal((await dueno.get(`/products/${p._id}`)).body.quantity, 6);
});

test('el empleado recibe 403 en todo lo que solo puede hacer el dueño', async () => {
  const dueno = await nuevaCuenta();
  const p = await producto(dueno);
  const cli = await clienteCredito(dueno, 500);
  const venta = (await dueno.post('/sales', { productId: p._id, quantity: 1 })).body.sale;
  const otro = await nuevoEmpleado(dueno);
  const emp = await nuevoEmpleado(dueno);

  const casos = [
    ['post', '/products', { name: 'Nuevo', price: 5 }],
    ['put', `/products/${p._id}`, { name: 'Cambiado', price: 1 }],
    ['delete', `/products/${p._id}`],
    ['delete', `/sales/${venta._id}`],
    ['delete', `/clients/${cli._id}`],
    ['put', `/credits/${cli._id}/limite`, { limiteCredito: 10000 }],
    ['post', `/credits/${cli._id}/cargo`, { amount: 100 }],
    ['put', '/profile/business', { name: 'Otro nombre' }],
    ['get', '/employees'],
    ['post', '/employees', { name: 'X', lastName: 'Y', email: emailUnico('x'), password: 'Empleado123!' }],
    ['put', `/employees/${otro.user.id}`, { activo: false }],
    ['delete', `/employees/${otro.user.id}`],
  ];
  for (const [metodo, ruta, datos] of casos) {
    const res = await emp[metodo](ruta, datos);
    assert.equal(res.status, 403, `${metodo.toUpperCase()} ${ruta} -> ${res.status}`);
    assert.equal(res.body.message, SOLO_DUENO);
  }
  for (const [ruta, campo] of [['/products/upload-image', 'image'], ['/profile/business/logo', 'logo']]) {
    const res = await emp.upload(ruta, campo, PNG, 'foto.png');
    assert.equal(res.status, 403, `POST ${ruta} -> ${res.status}`);
    assert.equal(res.body.message, SOLO_DUENO);
  }

  // Nada cambió
  const prod = await dueno.get(`/products/${p._id}`);
  assert.equal(prod.body.name, 'Refresco');
  assert.equal(prod.body.price, 20);
  assert.equal((await dueno.get('/products')).body.length, 1);
  assert.equal((await dueno.get('/sales')).body.length, 1);
  const cliente = await dueno.get(`/clients/${cli._id}`);
  assert.equal(cliente.status, 200);
  assert.equal(cliente.body.limiteCredito, 500);
  assert.equal(cliente.body.saldo, 0);
  const negocio = (await dueno.get('/profile')).body.business;
  assert.equal(negocio.name, 'Tienda');
  assert.equal(negocio.logo, undefined);
  const empleados = (await dueno.get('/employees')).body;
  assert.equal(empleados.length, 2);
  assert.ok(empleados.every((e) => e.activo));
});

test('el empleado da de alta y edita clientes, pero los datos fiscales y de crédito se ignoran', async () => {
  const dueno = await nuevaCuenta();
  await dueno.put('/profile/business', { name: 'Tienda', rfc: RFC_NEGOCIO });
  const emp = await nuevoEmpleado(dueno);

  const nuevo = await emp.post('/clients', {
    name: 'Rosa', lastName: 'Díaz', email: 'ROSA@correo.com', phone: '5551112222', address: 'Centro', notes: 'Frecuente',
    esMayoreo: true, limiteCredito: 5000, rfc: RFC_CLIENTE, tipoPersona: 'fisica', razonSocial: 'Rosa SA',
  });
  assert.equal(nuevo.status, 201, JSON.stringify(nuevo.body));
  assert.equal(nuevo.body.name, 'Rosa');
  assert.equal(nuevo.body.lastName, 'Díaz');
  assert.equal(nuevo.body.email, 'rosa@correo.com');
  assert.equal(nuevo.body.phone, '5551112222');
  assert.equal(nuevo.body.address, 'Centro');
  assert.equal(nuevo.body.notes, 'Frecuente');
  assert.equal(nuevo.body.esMayoreo, false);
  assert.equal(nuevo.body.limiteCredito, 0);
  assert.equal(nuevo.body.rfc, '');
  assert.equal(nuevo.body.tipoPersona, '');
  assert.equal(nuevo.body.razonSocial, undefined);

  // Datos de crédito inválidos tampoco dan error: simplemente no se usan
  const invalidos = await emp.post('/clients', { name: 'Beto', esMayoreo: true, rfc: 'ABC', limiteCredito: -5, tipoPersona: 'otra' });
  assert.equal(invalidos.status, 201, JSON.stringify(invalidos.body));
  assert.equal(invalidos.body.esMayoreo, false);
  // El nombre sigue siendo obligatorio
  assert.equal((await emp.post('/clients', { lastName: 'Sin nombre' })).status, 400);

  // Editar un cliente de crédito: solo cambian los datos básicos
  const cli = (await dueno.post('/clients', {
    name: 'Juan', esMayoreo: true, tipoPersona: 'fisica', rfc: RFC_CLIENTE, limiteCredito: 500, razonSocial: 'Juan Pérez',
  })).body;
  const editado = await emp.put(`/clients/${cli._id}`, {
    phone: '5559998888', esMayoreo: false, limiteCredito: 99999, rfc: '', tipoPersona: 'moral', razonSocial: 'Otra',
  });
  assert.equal(editado.status, 200, JSON.stringify(editado.body));
  assert.equal(editado.body.phone, '5559998888');
  assert.equal(editado.body.esMayoreo, true);
  assert.equal(editado.body.limiteCredito, 500);
  assert.equal(editado.body.rfc, RFC_CLIENTE);
  assert.equal(editado.body.tipoPersona, 'fisica');
  assert.equal(editado.body.razonSocial, 'Juan Pérez');

  // El dueño sí puede cambiar el crédito
  const editaDueno = await dueno.put(`/clients/${cli._id}`, { limiteCredito: 800 });
  assert.equal(editaDueno.status, 200);
  assert.equal(editaDueno.body.limiteCredito, 800);

  // El empleado ve todos los clientes del negocio
  assert.equal((await emp.get('/clients')).body.length, 3);
  assert.equal((await emp.get(`/clients/${cli._id}`)).body.name, 'Juan');
});

test('el empleado consulta créditos y registra abonos', async () => {
  const dueno = await nuevaCuenta();
  const cli = await clienteCredito(dueno, 500);
  assert.equal((await dueno.post(`/credits/${cli._id}/cargo`, { amount: 200 })).status, 201);
  const emp = await nuevoEmpleado(dueno);

  const abono = await emp.post(`/credits/${cli._id}/abono`, { amount: 50, description: 'Pago en mostrador' });
  assert.equal(abono.status, 201, JSON.stringify(abono.body));
  assert.equal(abono.body.saldo, 150);

  const lista = await emp.get('/credits');
  assert.equal(lista.status, 200);
  assert.equal(lista.body.length, 1);
  assert.equal(lista.body[0].saldo, 150);
  assert.equal((await emp.get('/credits/resumen')).body.totalPorCobrar, 150);

  const edo = await emp.get(`/credits/${cli._id}/movimientos`);
  assert.equal(edo.status, 200);
  assert.deepEqual(edo.body.movimientos.map((m) => m.type), ['abono', 'cargo']);
  assert.equal((await dueno.get(`/credits/${cli._id}/movimientos`)).body.client.saldo, 150);
});

test('desactivar a un empleado corta su sesión y no lo deja entrar; reactivarlo le devuelve el acceso', async () => {
  const dueno = await nuevaCuenta();
  const emp = await nuevoEmpleado(dueno);
  const ruta = `/employees/${emp.user.id}`;
  assert.equal((await emp.get('/products')).status, 200);

  const off = await dueno.put(ruta, { activo: false });
  assert.equal(off.status, 200, JSON.stringify(off.body));
  assert.equal(off.body.activo, false);
  assert.equal((await dueno.get('/employees')).body[0].activo, false);

  // Su sesión abierta deja de servir (401: la web y el celular la cierran)
  const bloqueado = await emp.get('/products');
  assert.equal(bloqueado.status, 401);
  assert.equal(bloqueado.body.message, SIN_ACCESO);
  assert.equal((await emp.get('/profile')).status, 401);

  // Con la contraseña correcta: 403; con una incorrecta, el 401 de siempre
  const entrar = await login(emp.email, emp.password);
  assert.equal(entrar.status, 403);
  assert.equal(entrar.body.message, DESACTIVADA);
  assert.equal(entrar.body.token, undefined);
  const mal = await login(emp.email, 'Otra123!!');
  assert.equal(mal.status, 401);
  assert.equal(mal.body.message, 'Credenciales inválidas');

  // Reactivar (también acepta "true" como texto)
  const on = await dueno.put(ruta, { activo: 'true' });
  assert.equal(on.status, 200);
  assert.equal(on.body.activo, true);
  const otraVez = await login(emp.email, emp.password);
  assert.equal(otraVez.status, 200);
  assert.equal(otraVez.body.user.rol, 'empleado');
  assert.equal((await conToken(otraVez.body.token).get('/products')).status, 200);

  // La sesión que tenía abierta antes de desactivarlo NO revive al reactivarlo
  const vieja = await emp.get('/products');
  assert.equal(vieja.status, 401);
  assert.equal(vieja.body.message, SESION_CERRADA);

  // "false" como texto también desactiva; otros valores son inválidos
  assert.equal((await dueno.put(ruta, { activo: 'false' })).body.activo, false);
  assert.equal((await dueno.put(ruta, { activo: 'quizas' })).status, 400);
});

test('editar empleado: nombre, apellido y contraseña', async () => {
  const dueno = await nuevaCuenta();
  const emp = await nuevoEmpleado(dueno, { name: 'Mario', lastName: 'Ruiz' });
  const ruta = `/employees/${emp.user.id}`;

  assert.equal((await dueno.put(ruta, { name: '' })).status, 400);
  assert.equal((await dueno.put(ruta, { lastName: '   ' })).status, 400);

  const nombre = await dueno.put(ruta, { name: ' Mario Alberto ', email: 'otro@annie.test' });
  assert.equal(nombre.status, 200, JSON.stringify(nombre.body));
  assert.equal(nombre.body.name, 'Mario Alberto');
  assert.equal(nombre.body.lastName, 'Ruiz');
  assert.equal(nombre.body.email, emp.email, 'el email no se cambia');
  assert.equal(nombre.body.rol, 'empleado');
  assert.equal(nombre.body.password, undefined);
  // Cambiarle el nombre no cierra su sesión
  assert.equal((await emp.get('/products')).status, 200);

  const debil = await dueno.put(ruta, { password: 'corta' });
  assert.equal(debil.status, 400);
  assert.equal(debil.body.message, MENSAJE_PASSWORD);

  // Contraseña vacía = no se cambia
  assert.equal((await dueno.put(ruta, { password: '' })).status, 200);
  assert.equal((await login(emp.email, emp.password)).status, 200);

  // Contraseña vacía tampoco cierra la sesión
  assert.equal((await emp.get('/products')).status, 200);

  assert.equal((await dueno.put(ruta, { password: 'NuevaClave1!' })).status, 200);
  assert.equal((await login(emp.email, emp.password)).status, 401);
  const nueva = await login(emp.email, 'NuevaClave1!');
  assert.equal(nueva.status, 200);
  assert.equal(nueva.body.user.name, 'Mario Alberto');

  // Cambiar la contraseña cierra la sesión que tenía abierta (p. ej. si se la
  // robaron); con la nueva contraseña entra normal
  const abierta = await emp.get('/products');
  assert.equal(abierta.status, 401);
  assert.equal(abierta.body.message, SESION_CERRADA);
  assert.equal((await conToken(nueva.body.token).get('/products')).status, 200);
});

test('eliminar a un empleado invalida su sesión y sus ventas conservan su nombre', async () => {
  const dueno = await nuevaCuenta();
  const p = await producto(dueno);
  const emp = await nuevoEmpleado(dueno, { name: 'Sofía', lastName: 'Luna' });
  assert.equal((await emp.post('/sales', { productId: p._id, quantity: 1 })).status, 201);

  const borrar = await dueno.delete(`/employees/${emp.user.id}`);
  assert.equal(borrar.status, 200);
  assert.deepEqual(borrar.body, { message: 'Empleado eliminado' });

  const res = await emp.get('/products');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, SIN_ACCESO);
  assert.equal((await login(emp.email, emp.password)).status, 401);

  const ventas = (await dueno.get('/sales')).body;
  assert.equal(ventas.length, 1);
  assert.equal(ventas[0].vendedorNombre, 'Sofía Luna');

  const otraVez = await dueno.delete(`/employees/${emp.user.id}`);
  assert.equal(otraVez.status, 404);
  assert.equal(otraVez.body.message, 'Empleado no encontrado');
  assert.deepEqual((await dueno.get('/employees')).body, []);
});

test('un dueño no puede ver ni modificar a los empleados de otro negocio', async () => {
  const a = await nuevaCuenta();
  const b = await nuevaCuenta();
  const empA = await nuevoEmpleado(a);
  const pb = await producto(b);

  assert.deepEqual((await b.get('/employees')).body, []);
  const casos = [
    ['put', `/employees/${empA.user.id}`, { activo: false }],
    ['delete', `/employees/${empA.user.id}`],
    // Un dueño no es empleado de nadie: ni el otro dueño ni él mismo
    ['put', `/employees/${a.user.id}`, { activo: false }],
    ['delete', `/employees/${b.user.id}`],
    ['put', '/employees/no-es-un-id', { name: 'X' }],
  ];
  for (const [metodo, ruta, datos] of casos) {
    const res = await b[metodo](ruta, datos);
    assert.equal(res.status, 404, `${metodo.toUpperCase()} ${ruta} -> ${res.status}`);
    assert.equal(res.body.message, 'Empleado no encontrado');
  }
  assert.equal((await a.put(`/employees/${a.user.id}`, { activo: false })).status, 404);

  // El empleado de A sigue activo y solo ve los datos de A
  assert.equal((await a.get('/employees')).body[0].activo, true);
  assert.equal((await empA.get('/products')).body.length, 0);
  assert.equal((await empA.get(`/products/${pb._id}`)).status, 404);
  assert.equal((await empA.post('/sales', { productId: pb._id, quantity: 1 })).status, 404);
});

test('el token de un empleado deja de servir si ya no corresponde a su negocio', async () => {
  const a = await nuevaCuenta();
  const b = await nuevaCuenta();
  const emp = await nuevoEmpleado(a);

  // Un token que dice "empleado" para alguien que no lo es tampoco sirve
  const falso = conToken(jwt.sign({ ...b.user, rol: 'empleado', ownerId: a.user.id }, process.env.JWT_SECRET));
  assert.equal((await falso.get('/products')).status, 401);

  // Si el empleado ahora pertenece a otro dueño, su token anterior se rechaza
  await User.updateOne({ _id: emp.user.id }, { dueno: b.user.id });
  const res = await emp.get('/products');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, SIN_ACCESO);
  const entrar = await login(emp.email, emp.password);
  assert.equal(entrar.status, 200);
  assert.equal(entrar.body.user.ownerId, b.user.id);
  assert.equal(entrar.body.user.businessId, b.user.businessId);
});

test('los usuarios y tokens anteriores a los roles siguen funcionando como dueños', async () => {
  const c = await nuevaCuenta();
  // Usuario "antiguo": sin rol, dueno ni activo en la base
  const _id = new mongoose.Types.ObjectId(c.user.id);
  await User.collection.updateOne({ _id }, { $unset: { rol: '', dueno: '', activo: '' } });
  const crudo = await User.collection.findOne({ _id });
  assert.equal(crudo.rol, undefined);

  // Token con la forma antigua (sin rol)
  const datosAntiguos = { ...c.user };
  delete datosAntiguos.rol;
  const viejo = conToken(jwt.sign(datosAntiguos, process.env.JWT_SECRET, { expiresIn: '8h' }));

  const p = await viejo.post('/products', { name: 'Pan', price: 10, cost: 6, quantity: 5 });
  assert.equal(p.status, 201, JSON.stringify(p.body));
  assert.equal((await viejo.get('/products')).body[0].cost, 6);
  const venta = await viejo.post('/sales', { productId: p.body._id, quantity: 1 });
  assert.equal(venta.status, 201);
  assert.equal(venta.body.sale.vendedorNombre, 'Prueba Annie');
  assert.equal((await viejo.delete(`/sales/${venta.body.sale._id}`)).status, 200);
  assert.equal((await viejo.put('/profile/business', { name: 'Tienda Antigua' })).status, 200);
  const alta = await viejo.post('/employees', { name: 'E', lastName: 'A', email: emailUnico('antiguo'), password: 'Empleado123!' });
  assert.equal(alta.status, 201, JSON.stringify(alta.body));
  assert.equal((await viejo.get('/employees')).body.length, 1);

  const perfil = await viejo.get('/profile');
  assert.equal(perfil.body.user.rol, 'dueno');
  assert.equal(perfil.body.business.name, 'Tienda Antigua');

  // Al iniciar sesión recibe rol "dueno" y su propio negocio
  const entrar = await login(c.email, c.password);
  assert.equal(entrar.status, 200);
  assert.equal(entrar.body.user.rol, 'dueno');
  assert.equal(entrar.body.user.businessId, c.user.businessId);
  assert.equal(entrar.body.user.ownerId, undefined);
});

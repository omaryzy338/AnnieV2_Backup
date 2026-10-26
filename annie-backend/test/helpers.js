// Utilidades compartidas por las pruebas. Por defecto levantan un MongoDB en
// memoria (nunca tocan la base real). Con `npm run test:nube` usan el
// servidor de DB_URI (.env, p. ej. Atlas) pero en una base TEMPORAL que se
// borra al terminar, así se prueba la conexión real sin tocar los datos.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const request = require('supertest');

const enNube = process.env.npm_lifecycle_event === 'test:nube' || process.env.PRUEBAS_NUBE === '1';

let mongod;
let app;

function uriDeLaNube() {
  const archivo = path.join(__dirname, '..', '.env');
  const env = fs.existsSync(archivo) ? require('dotenv').parse(fs.readFileSync(archivo)) : {};
  const uri = process.env.DB_URI_PRUEBAS || env.DB_URI;
  if (!uri) throw new Error('test:nube necesita DB_URI en annie-backend/.env');
  return uri;
}

async function iniciar() {
  if (enNube) {
    process.env.DB_URI = uriDeLaNube();
    // Base temporal única por archivo de pruebas
    process.env.DB_NAME = `annie_test_${process.pid}_${Date.now().toString(36)}`;
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    process.env.DB_URI = mongod.getUri('annie_test');
  }
  app = require('../server');
  await require('../config/db')();
  return app;
}

async function detener() {
  if (enNube && mongoose.connection.db?.databaseName?.startsWith('annie_test_')) {
    try {
      await mongoose.connection.db.dropDatabase();
    } catch {
      // Si el usuario no puede borrar bases, se vacían las colecciones
      const cols = await mongoose.connection.db.listCollections().toArray();
      for (const c of cols) await mongoose.connection.db.dropCollection(c.name).catch(() => {});
    }
  }
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

let contador = 0;

// Cliente HTTP que manda el token dado en cada petición
function conToken(token) {
  const auth = (r) => r.set('Authorization', `Bearer ${token}`);
  return {
    token,
    get:    (url)       => auth(request(app).get(url)),
    post:   (url, data) => auth(request(app).post(url)).send(data),
    put:    (url, data) => auth(request(app).put(url)).send(data),
    delete: (url)       => auth(request(app).delete(url)),
    upload: (url, field, buffer, filename) => auth(request(app).post(url)).attach(field, buffer, filename),
  };
}

// Registra un usuario nuevo y regresa un cliente HTTP autenticado
async function nuevaCuenta(extra = {}) {
  contador += 1;
  const body = {
    name: 'Prueba',
    lastName: 'Annie',
    email: `prueba${contador}_${Date.now()}@annie.test`,
    password: 'Segura123!',
    businessName: `Tienda ${contador}`,
    ...extra,
  };
  const res = await request(app).post('/auth/register').send(body);
  if (res.status !== 201) throw new Error(`Registro falló: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    ...conToken(res.body.token),
    user: res.body.user,
    email: body.email,
    password: body.password,
  };
}

// El dueño (cuenta de nuevaCuenta) da de alta a un empleado y este inicia
// sesión. Regresa el cliente HTTP del empleado, con `empleado` = la respuesta
// de POST /employees.
async function nuevoEmpleado(dueno, extra = {}) {
  contador += 1;
  const body = {
    name: 'Empleado',
    lastName: `Número ${contador}`,
    email: `empleado${contador}_${Date.now()}@annie.test`,
    password: 'Empleado123!',
    ...extra,
  };
  const alta = await dueno.post('/employees', body);
  if (alta.status !== 201) throw new Error(`Alta de empleado falló: ${alta.status} ${JSON.stringify(alta.body)}`);
  const login = await request(app).post('/auth/login').send({ email: body.email, password: body.password });
  if (login.status !== 200) throw new Error(`Login de empleado falló: ${login.status} ${JSON.stringify(login.body)}`);
  return {
    ...conToken(login.body.token),
    user: login.body.user,
    empleado: alta.body,
    email: body.email,
    password: body.password,
  };
}

// RFC válidos de ejemplo (formato correcto según utils/rfc.js)
const RFC_NEGOCIO = 'GOMA800101AB1';
const RFC_CLIENTE = 'PEJU900215XY2';

module.exports = {
  iniciar, detener, nuevaCuenta, nuevoEmpleado, conToken,
  request: () => request(app), RFC_NEGOCIO, RFC_CLIENTE,
};

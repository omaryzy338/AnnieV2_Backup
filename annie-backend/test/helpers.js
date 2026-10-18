// Utilidades compartidas por las pruebas: levanta un MongoDB en memoria
// (nunca toca la base real) y carga la app de Express apuntando a él.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongod;
let app;

async function iniciar() {
  mongod = await MongoMemoryServer.create();
  process.env.DB_URI = mongod.getUri('annie_test');
  app = require('../server');
  await require('../config/db')();
  return app;
}

async function detener() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

let contador = 0;

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
  const token = res.body.token;
  const auth = (r) => r.set('Authorization', `Bearer ${token}`);
  return {
    token,
    user: res.body.user,
    email: body.email,
    password: body.password,
    get:    (url)       => auth(request(app).get(url)),
    post:   (url, data) => auth(request(app).post(url)).send(data),
    put:    (url, data) => auth(request(app).put(url)).send(data),
    delete: (url)       => auth(request(app).delete(url)),
    upload: (url, field, buffer, filename) => auth(request(app).post(url)).attach(field, buffer, filename),
  };
}

// RFC válidos de ejemplo (formato correcto según utils/rfc.js)
const RFC_NEGOCIO = 'GOMA800101AB1';
const RFC_CLIENTE = 'PEJU900215XY2';

module.exports = { iniciar, detener, nuevaCuenta, request: () => request(app), RFC_NEGOCIO, RFC_CLIENTE };

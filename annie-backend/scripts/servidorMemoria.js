// Levanta el backend con una base de datos MongoDB EN MEMORIA (se borra al
// cerrar). Sirve para probar la app web o móvil sin instalar MongoDB ni tocar
// la base de datos real.
//
// Uso:
//   npm run dev:memoria                 (puerto 5000)
//   PORT=5055 npm run dev:memoria
//
// Para tener datos de ejemplo, en otra terminal:
//   npm run seed:demo                   (o API_URL=http://localhost:5055 npm run seed:demo)

const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test'; // evita cargar .env (que apunta a la base real)
  process.env.DB_URI = mongod.getUri('annie_memoria');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-local-solo-para-pruebas';

  const app = require('../server');
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Backend de Annie (base en memoria) en http://localhost:${port}`);
  });

  const cerrar = async () => {
    server.close();
    await require('mongoose').disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
})();

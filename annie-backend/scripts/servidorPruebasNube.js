// Levanta el backend conectado a tu MongoDB en la nube (DB_URI del .env), pero
// en una base SEPARADA para pruebas ("annie_pruebas" por defecto), así puedes
// probar la web y la app móvil contra Atlas sin tocar los datos reales.
//
// Uso:
//   npm run dev:nube-pruebas                 (puerto 5000, base annie_pruebas)
//   DB_NAME=otra_base PORT=5055 npm run dev:nube-pruebas
//
// Datos de ejemplo en esa base:  npm run seed:demo  (en otra terminal)

process.env.DB_NAME = process.env.DB_NAME || 'annie_pruebas';

const app = require('../server');
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) {
  // Clave temporal solo para esta sesión de pruebas
  process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
  console.warn('⚠️  No hay JWT_SECRET en .env: se usa una clave temporal (las sesiones se pierden al reiniciar).');
}
if (!process.env.DB_URI) {
  console.error('❌ No hay DB_URI. Crea annie-backend/.env con la cadena de conexión de Atlas.');
  process.exit(1);
}
if (!/pruebas|test/i.test(process.env.DB_NAME)) {
  console.warn(`⚠️  La base "${process.env.DB_NAME}" no parece de pruebas. Asegúrate de no estar usando la base real.`);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend de Annie contra la nube (base "${process.env.DB_NAME}") en http://localhost:${port}`);
});

// Diagnóstico de la conexión a MongoDB (Atlas o local) usando DB_URI del
// archivo .env. SOLO LEE: hace ping, muestra el servidor (sin usuario ni
// contraseña), las bases disponibles y cuántos documentos tiene cada colección.
//
// Uso:  npm run probar:conexion
//       DB_NAME=annie_pruebas npm run probar:conexion   (revisar otra base)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { aplicarDNS } = require('../utils/dns');

// Explicación en español de los errores más comunes al conectar con Atlas
function explicar(err) {
  const m = `${err?.message ?? ''} ${err?.cause?.message ?? ''}`;
  if (/bad auth|Authentication failed|auth error/i.test(m))
    return 'Usuario o contraseña incorrectos. Revisa el usuario de la base en Atlas → Database Access y que la contraseña en DB_URI no tenga caracteres sin codificar (@, :, / se escriben %40, %3A, %2F).';
  if (/querySrv (ETIMEOUT|ECONNREFUSED)/i.test(m))
    return 'Node.js no pudo consultar el DNS (común en Windows). Agrega en .env la línea DNS_SERVERS=8.8.8.8,1.1.1.1 y vuelve a intentar.';
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(m))
    return 'No se encontró el servidor. Revisa que el host del clúster en DB_URI esté bien escrito y que tengas internet.';
  if (/whitelist|not authorized.*IP|IP.*not.*allowed|ReplicaSetNoPrimary|Server selection timed out|ECONNREFUSED|ETIMEDOUT/i.test(m))
    return 'Atlas no respondió. Lo más común: tu IP no está permitida. En Atlas → Network Access agrega tu IP actual (o 0.0.0.0/0 para Render).';
  return 'Error no reconocido; revisa el mensaje de arriba.';
}

// Muestra solo el host del clúster, nunca el usuario ni la contraseña
const hostSeguro = (uri) => {
  const m = String(uri).match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)/);
  return m ? m[1] : '(desconocido)';
};

(async () => {
  const uri = process.env.DB_URI;
  if (!uri) {
    console.error('❌ No hay DB_URI. Crea annie-backend/.env (copia .env.example) y pon la cadena de conexión de Atlas.');
    process.exit(1);
  }
  const atlas = uri.startsWith('mongodb+srv') || uri.includes('.mongodb.net');
  console.log(`Servidor: ${hostSeguro(uri)} ${atlas ? '(☁️  Atlas)' : '(local)'}`);

  aplicarDNS();
  const inicio = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, ...(process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {}) });
  } catch (err) {
    console.error(`❌ No se pudo conectar: ${err.message}`);
    console.error(`👉 ${explicar(err)}`);
    process.exit(1);
  }
  const db = mongoose.connection.db;
  await db.admin().ping();
  console.log(`✅ Conectado en ${Date.now() - inicio} ms. Base en uso: "${db.databaseName}"`);

  try {
    const { databases } = await db.admin().listDatabases({ nameOnly: true });
    console.log(`Bases en el servidor: ${databases.map((d) => d.name).join(', ')}`);
  } catch {
    console.log('(El usuario no tiene permiso para listar las bases; no es un problema.)');
  }

  const colecciones = await db.listCollections().toArray();
  if (!colecciones.length) console.log('La base está vacía (sin colecciones).');
  for (const c of colecciones.sort((a, b) => a.name.localeCompare(b.name))) {
    const n = await db.collection(c.name).estimatedDocumentCount();
    console.log(`  · ${c.name}: ${n} documento${n === 1 ? '' : 's'}`);
  }

  await mongoose.disconnect();
})();

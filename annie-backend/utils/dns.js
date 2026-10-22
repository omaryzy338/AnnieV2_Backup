const dns = require('dns');

// En algunas computadoras con Windows, Node.js no logra resolver la dirección
// "mongodb+srv://" de Atlas (error "querySrv ETIMEOUT" o "ECONNREFUSED")
// porque usa un DNS local que no responde ese tipo de consulta. Con
// DNS_SERVERS en .env (p. ej. "8.8.8.8,1.1.1.1") se le indica a Node qué DNS
// usar. Es opcional: en Render no hace falta.
function aplicarDNS() {
  const servidores = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servidores.length) dns.setServers(servidores);
}

module.exports = { aplicarDNS };

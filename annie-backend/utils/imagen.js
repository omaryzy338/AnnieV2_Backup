// Detecta el tipo REAL de una imagen por sus primeros bytes (no por el nombre
// del archivo, que el cliente puede inventar). Regresa el MIME o null.
function detectarTipoImagen(buffer) {
  if (!buffer || buffer.length < 12) return null;
  const b = buffer;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (b.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
  return null;
}

module.exports = { detectarTipoImagen };

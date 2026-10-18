// Lectura del payload de un JWT (sin verificar la firma: eso lo hace el
// backend). Solo se usa para saber si la sesión guardada ya venció.

function base64UrlDecode(segmento: string) {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segmento.length / 4) * 4, '=');
  const binario = globalThis.atob(base64);
  // Decodificar UTF-8 (nombres con acentos) sin depender de TextDecoder
  return decodeURIComponent(
    Array.from(binario, (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
  );
}

export function leerPayload(token: string): Record<string, any> | null {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    return JSON.parse(base64UrlDecode(partes[1]));
  } catch {
    return null;
  }
}

/** true si el token no se puede leer o ya venció (con 1 minuto de margen). */
export function tokenVencido(token: string, ahoraMs = Date.now()) {
  const payload = leerPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= ahoraMs + 60_000;
}

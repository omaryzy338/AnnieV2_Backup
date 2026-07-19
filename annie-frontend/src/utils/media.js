// Resuelve la URL completa de un archivo servido por el backend (imágenes de
// productos, logos, etc). Si ya es una URL absoluta (http...) se regresa tal
// cual; si es una ruta relativa (/uploads/...) se le antepone la URL base de
// la API, tomada de REACT_APP_API_URL (nunca hardcodeada a localhost).
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export function resolveMediaUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

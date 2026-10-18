// Cliente HTTP de la API de Annie (el mismo backend que usa la web).
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Dirección del servidor por defecto:
 * 1. EXPO_PUBLIC_API_URL (archivo .env), p. ej. la URL del backend en Render.
 * 2. En desarrollo, la misma computadora que corre Expo, puerto 5000
 *    (así el celular con Expo Go encuentra el backend local en tu red Wi-Fi).
 */
export function urlPorDefecto(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return normalizarUrl(env);
  if (__DEV__) {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    return `http://${host || 'localhost'}:5000`;
  }
  return '';
}

/** Agrega http(s):// si falta y quita la diagonal final. */
export function normalizarUrl(url: string) {
  let u = url.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) {
    const esLocal = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u);
    u = `${esLocal ? 'http' : 'https'}://${u}`;
  }
  return u.replace(/\/+$/, '');
}

let baseUrl = urlPorDefecto();
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const getApiBaseUrl = () => baseUrl;
export const setApiBaseUrl = (url: string) => {
  baseUrl = normalizarUrl(url);
};
export const setAuthToken = (t: string | null) => {
  token = t;
};
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

/** URL completa de una imagen guardada en el backend ("/uploads/<id>") o externa. */
export function resolveMediaUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('file:')) return path;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Render (plan gratuito) "duerme" el servidor: la primera petición puede
// tardar hasta ~50 s mientras despierta.
const TIMEOUT_MS = 60_000;

type Opciones = { timeoutMs?: number; signal?: AbortSignal };

async function request<T>(method: string, path: string, body?: unknown, opciones: Opciones = {}): Promise<T> {
  if (!baseUrl) {
    throw new ApiError('Configura la dirección del servidor en "Servidor".', 0);
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  const esForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !esForm) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opciones.timeoutMs ?? TIMEOUT_MS);
  opciones.signal?.addEventListener('abort', () => controller.abort());

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : esForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted && !opciones.signal?.aborted) {
      throw new ApiError(
        'El servidor tardó demasiado en responder. Si no se ha usado en un rato puede estar despertando: intenta de nuevo en unos segundos.',
        0
      );
    }
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0);
  } finally {
    clearTimeout(timer);
  }

  const texto = await res.text();
  let data: any = null;
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
    const mensaje =
      data?.message ||
      (res.status >= 500 ? 'Ocurrió un error en el servidor. Intenta de nuevo.' : `Error ${res.status}`);
    throw new ApiError(mensaje, res.status);
  }
  return data as T;
}

export type ArchivoLocal = { uri: string; name: string; type: string };

async function formDataConArchivo(campo: string, archivo: ArchivoLocal) {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(archivo.uri)).blob();
    form.append(campo, blob, archivo.name);
  } else {
    // React Native acepta { uri, name, type } como parte de un FormData
    form.append(campo, archivo as unknown as Blob);
  }
  return form;
}

export const api = {
  get: <T>(path: string, opciones?: Opciones) => request<T>('GET', path, undefined, opciones),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: async <T>(path: string, campo: string, archivo: ArchivoLocal) =>
    request<T>('POST', path, await formDataConArchivo(campo, archivo)),
};

/** Verifica que una dirección responda como la API de Annie. */
export async function probarServidor(url: string): Promise<{ ok: boolean; mensaje: string }> {
  const destino = normalizarUrl(url);
  if (!destino) return { ok: false, mensaje: 'Escribe la dirección del servidor.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${destino}/`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.status === 'ok') return { ok: true, mensaje: 'Conexión correcta con el servidor de Annie.' };
    return { ok: false, mensaje: 'El servidor respondió, pero no parece ser la API de Annie.' };
  } catch {
    return {
      ok: false,
      mensaje: controller.signal.aborted
        ? 'El servidor no respondió a tiempo.'
        : 'No se pudo conectar. Revisa la dirección y que el celular tenga internet (o esté en la misma red Wi-Fi).',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Mensaje legible de cualquier error. */
export const mensajeError = (err: unknown, porDefecto = 'Ocurrió un error inesperado.') =>
  err instanceof Error && err.message ? err.message : porDefecto;

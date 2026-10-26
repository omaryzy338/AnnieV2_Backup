// Utilidades para pruebas de pantallas: proveedores (React Query + sesión),
// una sesión guardada (dueño o empleado) y un backend falso que responde según
// método y ruta.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useState, type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/auth';
import { setApiBaseUrl } from '@/lib/api';
import type { SessionUser } from '@/lib/types';

// Como en la app (_layout.tsx), la pantalla se muestra ya que se restauró la
// sesión guardada: así el rol (dueño o empleado) ya se conoce al renderizarla
function TrasRestaurarSesion({ children }: { children: ReactNode }) {
  const { estado } = useAuth();
  return estado === 'cargando' ? null : <>{children}</>;
}

/**
 * esperarSesion: no muestra la pantalla hasta restaurar la sesión guardada
 * (para probar lo que ve el dueño o el empleado; ver sesionGuardada).
 */
export function Proveedores({ children, esperarSesion = false }: { children: ReactNode; esperarSesion?: boolean }) {
  const [queryClient] = useState(
    // gcTime: Infinity evita timers de limpieza de React Query que siguen vivos al terminar la prueba
    () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{esperarSesion ? <TrasRestaurarSesion>{children}</TrasRestaurarSesion> : children}</AuthProvider>
    </QueryClientProvider>
  );
}

/** JWT de prueba que no vence ({"exp": 9999999999}); la firma la revisa el backend. */
export const TOKEN_PRUEBA = 'x.eyJleHAiOjk5OTk5OTk5OTl9.y';

export const usuarioPrueba = (extra: Partial<SessionUser> = {}): SessionUser => ({
  id: 'u1',
  name: 'Ana',
  lastName: 'López',
  email: 'ana@correo.com',
  businessId: 'b1',
  businessName: 'Tienda Ana',
  slug: 'tienda-ana',
  ...extra,
});

/** Deja guardada (solo) esta sesión para que AuthProvider la restaure al montar. */
export async function sesionGuardada(user: Partial<SessionUser> = {}, token = TOKEN_PRUEBA) {
  (SecureStore as any).__limpiar();
  await SecureStore.setItemAsync('annie.token', token);
  await SecureStore.setItemAsync('annie.user', JSON.stringify(usuarioPrueba(user)));
}

type Manejador = (body: any) => { status?: number; body: unknown };

/** Instala un fetch falso. Las rutas son "MÉTODO /ruta", p. ej. "POST /sales". */
export function backendFalso(rutas: Record<string, Manejador | unknown>) {
  setApiBaseUrl('http://api.test');
  const llamadas: { metodo: string; ruta: string; body: any }[] = [];
  const fetchMock = jest.fn(async (url: string, init: RequestInit = {}) => {
    const metodo = (init.method ?? 'GET').toUpperCase();
    // La sesión puede cambiar la URL base; se responde según la ruta
    const ruta = url.replace(/^https?:\/\/[^/]+/, '');
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    llamadas.push({ metodo, ruta, body });
    const def = rutas[`${metodo} ${ruta}`];
    const r = typeof def === 'function' ? (def as Manejador)(body) : def === undefined ? { status: 404, body: { message: `Sin ruta ${metodo} ${ruta}` } } : { body: def };
    const status = r.status ?? 200;
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body) } as Response;
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return { llamadas, fetchMock };
}

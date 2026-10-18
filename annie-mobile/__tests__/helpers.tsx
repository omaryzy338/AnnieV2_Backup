// Utilidades para pruebas de pantallas: proveedores (React Query + sesión) y
// un backend falso que responde según método y ruta.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/context/auth';
import { setApiBaseUrl } from '@/lib/api';

export function Proveedores({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
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

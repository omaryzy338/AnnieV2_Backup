// Sesión del usuario: inicio de sesión, registro, cierre de sesión y
// restauración de la sesión guardada al abrir la app.
import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { aviso } from '@/components/ui/dialogs';
import { api, setApiBaseUrl, setAuthToken, setUnauthorizedHandler, urlPorDefecto } from '@/lib/api';
import { tokenVencido } from '@/lib/jwt';
import { useProfile } from '@/lib/queries';
import { rolDeSesion } from '@/lib/roles';
import { KEYS, storage } from '@/lib/storage';
import type { SessionUser } from '@/lib/types';

type Estado = 'cargando' | 'fuera' | 'dentro';

export type DatosRegistro = {
  name: string;
  lastName: string;
  businessName: string;
  email: string;
  password: string;
  rfc?: string;
};

type AuthContextValue = {
  estado: Estado;
  user: SessionUser | null;
  /** true si la sesión es del dueño del negocio (las sesiones sin rol son del dueño). */
  esDueno: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  actualizarUsuario: (cambios: Partial<SessionUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type RespuestaAuth = { token: string; user: SessionUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<Estado>('cargando');
  const [user, setUser] = useState<SessionUser | null>(null);
  // El token también trae el rol: es el respaldo si el usuario guardado no lo tiene
  const [token, setToken] = useState<string | null>(null);
  const cerrando = useRef(false);

  const limpiarSesion = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setEstado('fuera');
    queryClient.clear();
    await Promise.all([storage.remove(KEYS.token), storage.remove(KEYS.user)]);
  }, [queryClient]);

  // Restaurar la sesión guardada
  useEffect(() => {
    (async () => {
      try {
        const [urlGuardada, tokenGuardado, userTxt] = await Promise.all([
          storage.get(KEYS.apiUrl),
          storage.get(KEYS.token),
          storage.get(KEYS.user),
        ]);
        setApiBaseUrl(urlGuardada || urlPorDefecto());
        if (tokenGuardado && userTxt && !tokenVencido(tokenGuardado)) {
          setAuthToken(tokenGuardado);
          setToken(tokenGuardado);
          setUser(JSON.parse(userTxt));
          setEstado('dentro');
        } else {
          if (tokenGuardado) await Promise.all([storage.remove(KEYS.token), storage.remove(KEYS.user)]);
          setEstado('fuera');
        }
      } catch {
        setEstado('fuera');
      }
    })();
  }, []);

  // Si el backend responde 401 (sesión vencida o inválida, o un empleado al que
  // el dueño desactivó) se cierra la sesión y se muestra el motivo
  useEffect(() => {
    setUnauthorizedHandler((mensaje) => {
      if (cerrando.current) return;
      cerrando.current = true;
      limpiarSesion().finally(() => {
        cerrando.current = false;
        if (mensaje) aviso('Sesión cerrada', mensaje);
        else aviso('Sesión vencida', 'Tu sesión expiró. Inicia sesión de nuevo.');
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [limpiarSesion]);

  const guardarSesion = useCallback(async ({ token: t, user: u }: RespuestaAuth) => {
    await Promise.all([storage.set(KEYS.token, t), storage.set(KEYS.user, JSON.stringify(u))]);
    setAuthToken(t);
    setToken(t);
    setUser(u);
    setEstado('dentro');
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<RespuestaAuth>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        client: 'mobile',
      });
      await guardarSesion(res);
    },
    [guardarSesion]
  );

  const registrarse = useCallback(
    async (datos: DatosRegistro) => {
      const res = await api.post<RespuestaAuth>('/auth/register', {
        ...datos,
        email: datos.email.trim().toLowerCase(),
        rfc: datos.rfc?.trim() || undefined,
        client: 'mobile',
      });
      await guardarSesion(res);
    },
    [guardarSesion]
  );

  const actualizarUsuario = useCallback(
    async (cambios: Partial<SessionUser>) => {
      if (!user) return;
      const nuevo = { ...user, ...cambios };
      setUser(nuevo);
      await storage.set(KEYS.user, JSON.stringify(nuevo));
    },
    [user]
  );

  // El perfil trae el rol vigente. Si la sesión guardada no lo tiene (se inició
  // antes de que existieran los roles) o es otro, se guarda para la próxima vez
  const rolPerfil = useProfile({ enabled: estado === 'dentro' }).data?.user?.rol;
  useEffect(() => {
    if (user && rolPerfil && user.rol !== rolPerfil) {
      storage.set(KEYS.user, JSON.stringify({ ...user, rol: rolPerfil })).catch(() => {});
    }
  }, [user, rolPerfil]);

  const esDueno = !!user && rolDeSesion({ rol: rolPerfil ?? user.rol }, token) === 'dueno';

  const value = useMemo(
    () => ({ estado, user, esDueno, iniciarSesion, registrarse, cerrarSesion: limpiarSesion, actualizarUsuario }),
    [estado, user, esDueno, iniciarSesion, registrarse, limpiarSesion, actualizarUsuario]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

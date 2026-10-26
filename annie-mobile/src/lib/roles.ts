// Roles del negocio: el dueño administra todo y el empleado vende y atiende
// clientes. Los permisos los aplica el backend (al empleado le responde 403);
// la app solo oculta lo que el empleado no puede hacer.
import { leerPayload } from './jwt';
import type { Rol } from './types';

/**
 * Rol de la sesión: el del usuario guardado o, si no lo trae, el del token.
 * Las sesiones de antes de que existieran los roles no traen ninguno: son del dueño.
 */
export function rolDeSesion(user?: { rol?: string | null } | null, token?: string | null): Rol {
  const rol = user?.rol || (token ? leerPayload(token)?.rol : undefined);
  return rol === 'empleado' ? 'empleado' : 'dueno';
}

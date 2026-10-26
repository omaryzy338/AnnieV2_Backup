import { render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Alert, Text } from 'react-native';

import { useAuth } from '@/context/auth';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

// base64url del JSON en UTF-8 (como lo genera jsonwebtoken)
const base64url = (txt: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(txt))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const firmar = (payload: object) => `x.${base64url(JSON.stringify(payload))}.y`;

const perfil = (rol?: 'dueno' | 'empleado') => ({
  user: { _id: 'u1', name: 'Ana', lastName: 'López', email: 'ana@correo.com', ...(rol ? { rol } : {}) },
  business: { _id: 'b1', name: 'Tienda Ana', slug: 'tienda-ana' },
});

/** Muestra el estado de la sesión y, ya dentro, el rol. */
function Sesion() {
  const { estado, esDueno } = useAuth();
  return <Text>{estado === 'dentro' ? (esDueno ? 'dueño' : 'empleado') : estado}</Text>;
}

const montar = () =>
  render(
    <Proveedores>
      <Sesion />
    </Proveedores>
  );

// Los avisos usan Alert nativo
let alerta: jest.SpyInstance;
beforeEach(() => {
  alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => alerta.mockRestore());

test('una sesión guardada sin rol (de antes de los roles) es del dueño y se completa con el rol del perfil', async () => {
  await sesionGuardada({});
  (SecureStore.setItemAsync as jest.Mock).mockClear();
  backendFalso({ 'GET /profile': perfil('dueno') });
  await montar();

  expect(await screen.findByText('dueño')).toBeOnTheScreen();
  await waitFor(() =>
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('annie.user', expect.stringContaining('"rol":"dueno"'))
  );
});

test('si el usuario guardado no trae el rol, se toma el del token', async () => {
  await sesionGuardada({}, firmar({ exp: 9999999999, rol: 'empleado' }));
  backendFalso({}); // sin perfil: solo queda el token
  await montar();

  expect(await screen.findByText('empleado')).toBeOnTheScreen();
});

test('el rol del perfil manda sobre el guardado', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backendFalso({ 'GET /profile': perfil('empleado') });
  await montar();

  expect(await screen.findByText('empleado')).toBeOnTheScreen();
});

test('un empleado desactivado sale de la sesión con el motivo que da el backend', async () => {
  const motivo = 'Tu acceso como empleado fue desactivado. Pídele al dueño que lo active.';
  await sesionGuardada({ rol: 'empleado' });
  backendFalso({ 'GET /profile': () => ({ status: 401, body: { message: motivo } }) });
  await montar();

  await waitFor(() => expect(alerta).toHaveBeenCalledWith('Sesión cerrada', motivo));
  expect(screen.getByText('fuera')).toBeOnTheScreen();
  expect(await SecureStore.getItemAsync('annie.token')).toBeNull();
  expect(await SecureStore.getItemAsync('annie.user')).toBeNull();
});

test('un 401 sin motivo muestra el aviso de sesión vencida', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backendFalso({ 'GET /profile': () => ({ status: 401, body: {} }) });
  await montar();

  await waitFor(() => expect(alerta).toHaveBeenCalledWith('Sesión vencida', 'Tu sesión expiró. Inicia sesión de nuevo.'));
});

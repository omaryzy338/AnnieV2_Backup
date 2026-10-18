import { screen, userEvent, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderRouter } from 'expo-router/testing-library';

import LoginScreen from '@/app/login';

import { backendFalso, Proveedores } from '../helpers';

const pantalla = () => (
  <Proveedores>
    <LoginScreen />
  </Proveedores>
);

beforeEach(() => {
  (SecureStore as any).__limpiar();
});

test('pide correo y contraseña antes de llamar al servidor', async () => {
  const { fetchMock } = backendFalso({});
  const user = userEvent.setup();
  await renderRouter({ login: pantalla }, { initialUrl: '/login' });

  await user.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
  expect(await screen.findByText('Escribe tu correo y tu contraseña.')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('muestra el mensaje del backend si la contraseña es incorrecta', async () => {
  backendFalso({ 'POST /auth/login': () => ({ status: 401, body: { message: 'Credenciales inválidas' } }) });
  const user = userEvent.setup();
  await renderRouter({ login: pantalla }, { initialUrl: '/login' });

  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Mala123!');
  await user.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

  expect(await screen.findByText('Credenciales inválidas')).toBeOnTheScreen();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalledWith('annie.token', expect.anything());
});

test('inicia sesión como app móvil y guarda la sesión cifrada', async () => {
  const { llamadas } = backendFalso({
    'POST /auth/login': {
      token: 'x.eyJleHAiOjk5OTk5OTk5OTl9.y',
      user: { id: 'u1', name: 'Ana', lastName: 'López', email: 'ana@correo.com', businessId: 'b1', businessName: 'Tienda', slug: 't' },
    },
  });
  const user = userEvent.setup();
  await renderRouter({ login: pantalla }, { initialUrl: '/login' });

  await user.type(screen.getByLabelText('Correo electrónico'), '  Ana@Correo.com ');
  await user.type(screen.getByLabelText('Contraseña'), 'Segura123!');
  await user.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

  await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith('annie.token', 'x.eyJleHAiOjk5OTk5OTk5OTl9.y'));
  const login = llamadas.find((l) => l.ruta === '/auth/login');
  expect(login?.body).toEqual({ email: 'ana@correo.com', password: 'Segura123!', client: 'mobile' });
});

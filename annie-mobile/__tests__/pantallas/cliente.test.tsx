import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import ClienteScreen from '@/app/cliente/[id]';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

const perfil = {
  user: { _id: 'u2', name: 'Luis', lastName: 'Pérez', email: 'luis@correo.com', rol: 'empleado' },
  business: { _id: 'b1', name: 'Tienda Ana', slug: 't', rfc: 'GOMA800101AB1', rfcGenerico: false },
};
const deCredito = {
  _id: 'c1', name: 'Juan', lastName: 'Pérez', esMayoreo: true, tipoPersona: 'fisica', rfc: 'GOMA800101AB1',
  limiteCredito: 500, saldo: 120, createdAt: '2026-10-01T10:00:00Z',
};

// Se entra desde otra pantalla para que "guardar" pueda regresar
async function abrir(params: { id: string; credito?: string }) {
  await renderRouter(
    {
      index: () => <Text>Inicio</Text>,
      'cliente/[id]': () => (
        <Proveedores esperarSesion>
          <ClienteScreen />
        </Proveedores>
      ),
    },
    { initialUrl: '/' }
  );
  await act(() => router.push({ pathname: '/cliente/[id]', params }));
}

beforeEach(async () => {
  await sesionGuardada({ rol: 'empleado' });
});

test('el empleado da de alta clientes solo con datos de contacto, aunque llegue desde Créditos', async () => {
  const { llamadas } = backendFalso({
    'GET /clients': [],
    'GET /sales': [],
    'GET /profile': perfil,
    'POST /clients': (body: any) => ({ status: 201, body: { _id: 'c9', ...body, createdAt: '' } }),
  });
  const user = userEvent.setup();
  await abrir({ id: 'nuevo', credito: '1' });

  await user.type(await screen.findByLabelText('Nombre'), 'María');
  await user.type(screen.getByLabelText('Teléfono'), '555 000 1111');
  expect(screen.queryByLabelText('Cliente de mayoreo con crédito')).toBeNull();
  expect(screen.queryByLabelText('RFC')).toBeNull();
  expect(screen.queryByLabelText('Límite de crédito')).toBeNull();
  await user.press(screen.getByRole('button', { name: 'Registrar cliente' }));

  await waitFor(() =>
    expect(llamadas.find((l) => l.metodo === 'POST')?.body).toEqual({ name: 'María', lastName: '', email: '', phone: '555 000 1111' })
  );
  expect(await screen.findByText('Inicio')).toBeOnTheScreen();
});

test('el empleado edita un cliente de crédito sin tocar su crédito y no lo puede eliminar', async () => {
  const { llamadas } = backendFalso({
    'GET /clients': [deCredito],
    'GET /sales': [],
    'GET /profile': perfil,
    'PUT /clients/c1': (body: any) => ({ body: { ...deCredito, ...body } }),
  });
  const user = userEvent.setup();
  await abrir({ id: 'c1' });

  expect(await screen.findByDisplayValue('Juan')).toBeOnTheScreen();
  // Puede ver cuánto debe e ir a registrar un abono
  expect(screen.getByRole('button', { name: 'Estado de cuenta / registrar pago' })).toBeOnTheScreen();
  expect(screen.queryByLabelText('Cliente de mayoreo con crédito')).toBeNull();
  expect(screen.queryByLabelText('RFC')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Eliminar cliente' })).toBeNull();

  await user.type(screen.getByLabelText('Teléfono'), '5551234567');
  await user.press(screen.getByRole('button', { name: 'Guardar cambios' }));

  await waitFor(() =>
    expect(llamadas.find((l) => l.metodo === 'PUT')?.body).toEqual({ name: 'Juan', lastName: 'Pérez', email: '', phone: '5551234567' })
  );
});

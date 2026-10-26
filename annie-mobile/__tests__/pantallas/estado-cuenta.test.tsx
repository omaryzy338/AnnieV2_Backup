import { screen, userEvent, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import EstadoCuentaScreen from '@/app/creditos/[id]';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

const cliente = {
  _id: 'c1', name: 'Juan', lastName: 'Pérez', esMayoreo: true, tipoPersona: 'fisica', rfc: 'GOMA800101AB1',
  limiteCredito: 500, saldo: 120, createdAt: '2026-10-01T10:00:00Z',
};

const montar = () =>
  renderRouter(
    {
      'creditos/[id]': () => (
        <Proveedores esperarSesion>
          <EstadoCuentaScreen />
        </Proveedores>
      ),
    },
    { initialUrl: '/creditos/c1' }
  );

test('el empleado solo registra abonos: sin cargos ni editar al cliente', async () => {
  await sesionGuardada({ rol: 'empleado' });
  const { llamadas } = backendFalso({
    'GET /credits/c1/movimientos': { client: cliente, movimientos: [] },
    'POST /credits/c1/abono': (body: any) => ({ status: 201, body: { message: 'Abono registrado', saldo: 120 - body.amount } }),
  });
  const user = userEvent.setup();
  await montar();

  expect(await screen.findByRole('button', { name: 'Registrar abono' })).toBeOnTheScreen();
  expect(screen.queryByRole('tab', { name: 'Cargo (compra)' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Editar cliente' })).toBeNull();

  await user.type(screen.getByLabelText('Monto'), '50');
  await user.press(screen.getByRole('button', { name: 'Registrar abono' }));

  await waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')).toMatchObject({ ruta: '/credits/c1/abono', body: { amount: 50 } }));
  expect(await screen.findByText('Abono registrado. Nuevo saldo: $70.00')).toBeOnTheScreen();
});

test('si el cliente no debe nada, el empleado no tiene movimientos que registrar', async () => {
  await sesionGuardada({ rol: 'empleado' });
  backendFalso({ 'GET /credits/c1/movimientos': { client: { ...cliente, saldo: 0 }, movimientos: [] } });
  await montar();

  expect(await screen.findByText('Este cliente no tiene saldo pendiente: no hay abonos por registrar.')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Registrar abono' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Registrar cargo' })).toBeNull();
});

test('el dueño puede registrar cargos y editar al cliente', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backendFalso({ 'GET /credits/c1/movimientos': { client: cliente, movimientos: [] } });
  await montar();

  expect(await screen.findByRole('tab', { name: 'Cargo (compra)' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Editar cliente' })).toBeOnTheScreen();
});

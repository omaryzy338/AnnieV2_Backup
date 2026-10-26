import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import MasScreen from '@/app/(tabs)/mas';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

function backend(rol: 'dueno' | 'empleado') {
  return backendFalso({
    'GET /profile': {
      user: { _id: 'u1', name: 'Ana', lastName: 'López', email: 'ana@correo.com', rol },
      business: { _id: 'b1', name: 'Tienda Ana', slug: 'tienda-ana' },
    },
    'GET /credits/resumen': { clientesCredito: 1, conDeuda: 1, sobreLimite: 0, totalPorCobrar: 70, limiteTotal: 100, disponibleTotal: 30 },
  });
}

const montar = () =>
  renderRouter(
    {
      mas: () => (
        <Proveedores esperarSesion>
          <MasScreen />
        </Proveedores>
      ),
    },
    { initialUrl: '/mas' }
  );

test('el dueño ve Empleados, Reportes y Mi negocio', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backend('dueno');
  await montar();

  expect(await screen.findByText('Dueño')).toBeOnTheScreen();
  for (const opcion of ['Créditos (mayoreo)', 'Reportes', 'Mi negocio', 'Empleados', 'Servidor']) {
    expect(screen.getByRole('button', { name: opcion })).toBeOnTheScreen();
  }
  expect(screen.getByText('Cuentas para tu personal')).toBeOnTheScreen();
});

test('el empleado solo ve Créditos y Servidor (sin Empleados, Reportes ni Mi negocio)', async () => {
  const { llamadas } = backend('empleado');
  await sesionGuardada({ rol: 'empleado', ownerId: 'd1', name: 'Luis', lastName: 'Pérez', email: 'luis@correo.com' });
  await montar();

  expect(await screen.findByText('Empleado')).toBeOnTheScreen();
  expect(screen.getByText('Luis Pérez')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Créditos (mayoreo)' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Servidor' })).toBeOnTheScreen();
  for (const opcion of ['Reportes', 'Mi negocio', 'Empleados']) {
    expect(screen.queryByRole('button', { name: opcion })).toBeNull();
  }
  // Nada de lo del dueño se pide al servidor
  expect(llamadas.some((l) => l.ruta.startsWith('/employees'))).toBe(false);
});

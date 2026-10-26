import { screen, userEvent } from '@testing-library/react-native';
import * as Print from 'expo-print';
import { renderRouter } from 'expo-router/testing-library';

import VentaDetalleScreen from '@/app/venta/[id]';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

const venta = {
  _id: 's1',
  folio: 12,
  product: { _id: 'p1', name: 'Refresco 600 ml', price: 40, unit: 'piezas' },
  client: null,
  quantity: 2,
  price: 40,
  discount: 0,
  discountType: 'porcentaje',
  total: 80,
  saleDate: '2026-10-20T18:00:00.000Z',
  paymentMethod: 'efectivo',
  amountPaid: 100,
  change: 20,
  vendedorNombre: 'Luis Pérez',
  createdAt: '2026-10-20T18:00:00.000Z',
};

function backend(ventas: object[]) {
  return backendFalso({
    'GET /sales': ventas,
    'GET /profile': { user: { _id: 'u1', name: 'Ana', lastName: 'López', email: 'a@a.com' }, business: { _id: 'b1', name: 'Tienda Ana', slug: 't' } },
  });
}

const montar = () =>
  renderRouter(
    {
      'venta/[id]': () => (
        <Proveedores esperarSesion>
          <VentaDetalleScreen />
        </Proveedores>
      ),
    },
    { initialUrl: '/venta/s1' }
  );

test('el empleado ve quién atendió la venta, pero no puede cancelarla', async () => {
  await sesionGuardada({ rol: 'empleado' });
  backend([venta]);
  const user = userEvent.setup();
  await montar();

  expect(await screen.findByText('Luis Pérez')).toBeOnTheScreen();
  expect(screen.getByText('Atendió')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Cancelar venta' })).toBeNull();

  // El ticket impreso también dice quién atendió
  await user.press(screen.getByRole('button', { name: 'Imprimir' }));
  expect(Print.printAsync).toHaveBeenCalledWith({ html: expect.stringContaining('<span>Atendió</span><strong>Luis Pérez</strong>') });
});

test('el dueño puede cancelar la venta; las ventas antiguas no muestran quién atendió', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backend([{ ...venta, vendedorNombre: undefined }]);
  await montar();

  expect(await screen.findByRole('button', { name: 'Cancelar venta' })).toBeOnTheScreen();
  expect(screen.queryByText('Atendió')).toBeNull();
});

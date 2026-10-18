import { screen, userEvent } from '@testing-library/react-native';
import * as Print from 'expo-print';
import { renderRouter } from 'expo-router/testing-library';

import NuevaVentaScreen from '@/app/venta/nueva';

import { backendFalso, Proveedores } from '../helpers';

const producto = {
  _id: 'p1', name: 'Refresco 600 ml', price: 40, quantity: 5, unit: 'piezas', discount: 0, cost: 25,
  createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
};
const clienteCredito = { _id: 'c1', name: 'Juan', lastName: 'Pérez', esMayoreo: true, limiteCredito: 100, saldo: 70, createdAt: '' };
const clienteNormal = { _id: 'c2', name: 'Ana', lastName: 'López', esMayoreo: false, createdAt: '' };

function backend(onVenta?: (body: any) => void) {
  return backendFalso({
    'GET /products': [producto],
    'GET /clients': [clienteCredito, clienteNormal],
    'GET /profile': { user: { _id: 'u1', name: 'Ana', lastName: 'L', email: 'a@a.com' }, business: { _id: 'b1', name: 'Tienda Ana', slug: 't', rfc: 'GOMA800101AB1', rfcGenerico: false } },
    'POST /sales': (body: any) => {
      onVenta?.(body);
      const total = 40 * body.quantity;
      return {
        status: 201,
        body: {
          message: 'Venta registrada correctamente',
          inventarioRestante: 5 - body.quantity,
          sale: {
            _id: 's1', folio: 12, product: producto, client: null, quantity: body.quantity, price: 40, discount: 0, discountType: 'porcentaje',
            total, saleDate: body.saleDate, paymentMethod: body.paymentMethod,
            amountPaid: body.paymentMethod === 'efectivo' ? body.amountPaid : null,
            change: body.paymentMethod === 'efectivo' ? body.amountPaid - total : 0,
            createdAt: body.saleDate,
          },
        },
      };
    },
  });
}

const montar = () =>
  renderRouter(
    {
      'venta/nueva': () => (
        <Proveedores>
          <NuevaVentaScreen />
        </Proveedores>
      ),
    },
    { initialUrl: '/venta/nueva' }
  );

async function elegirProducto(user: ReturnType<typeof userEvent.setup>) {
  await user.press(await screen.findByRole('button', { name: 'Elegir producto' }));
  await user.press(screen.getByText('Refresco 600 ml'));
}

test('venta en efectivo: calcula el cambio, registra y muestra folio, total, pago y cambio', async () => {
  let enviada: any;
  backend((b) => (enviada = b));
  const user = userEvent.setup();
  await montar();

  await elegirProducto(user);
  await user.press(screen.getByRole('button', { name: 'Aumentar cantidad' }));
  expect(screen.getByTestId('venta-total')).toHaveTextContent('$80.00');

  await user.type(screen.getByLabelText('Paga con'), '100');
  expect(screen.getByTestId('venta-cambio')).toHaveTextContent('Cambio: $20.00');

  await user.press(screen.getByRole('button', { name: 'Cobrar' }));

  expect(await screen.findByText('¡Venta registrada!')).toBeOnTheScreen();
  expect(enviada).toMatchObject({ productId: 'p1', quantity: 2, paymentMethod: 'efectivo', amountPaid: 100, discount: 0 });
  expect(new Date(enviada.saleDate).getTime()).toBeGreaterThan(Date.now() - 60_000);
  expect(screen.getByTestId('ticket-folio')).toHaveTextContent('000012');
  expect(screen.getAllByText('$80.00').length).toBeGreaterThan(0);
  expect(screen.getByText('$100.00')).toBeOnTheScreen();
  expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0);

  await user.press(screen.getByRole('button', { name: 'Imprimir' }));
  expect(Print.printAsync).toHaveBeenCalledWith({ html: expect.stringContaining('FOLIO 000012') });
});

test('no deja cobrar si el pago no alcanza', async () => {
  const { fetchMock } = backend();
  const user = userEvent.setup();
  await montar();

  await elegirProducto(user);
  await user.type(screen.getByLabelText('Paga con'), '30');
  expect(screen.getByTestId('venta-cambio')).toHaveTextContent('Faltan $10.00');
  await user.press(screen.getByRole('button', { name: 'Cobrar' }));

  expect(await screen.findByText('El pago es menor al total. Faltan $10.00.')).toBeOnTheScreen();
  expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
});

test('crédito solo se habilita con un cliente de mayoreo y respeta su disponible', async () => {
  let enviada: any;
  backend((b) => (enviada = b));
  const user = userEvent.setup();
  await montar();

  await elegirProducto(user);
  const credito = screen.getByRole('tab', { name: 'Crédito' });
  expect(credito).toBeDisabled();

  // Cliente sin crédito: sigue deshabilitado
  await user.press(screen.getByRole('button', { name: 'Elegir cliente' }));
  await user.press(screen.getByText('Ana López'));
  expect(screen.getByRole('tab', { name: 'Crédito' })).toBeDisabled();

  // Cliente con crédito (disponible $30): una venta de $40 no alcanza
  await user.press(screen.getByRole('button', { name: 'Cliente: Ana López' }));
  await user.press(screen.getByText('Juan Pérez'));
  await user.press(screen.getByRole('tab', { name: 'Crédito' }));
  await user.press(screen.getByRole('button', { name: 'Cargar a crédito' }));
  expect(await screen.findByText('Crédito insuficiente. Disponible: $30.00.')).toBeOnTheScreen();
  expect(enviada).toBeUndefined();
});

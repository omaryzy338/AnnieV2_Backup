import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import ProductoScreen from '@/app/producto/[id]';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

// Así lo manda el backend a un empleado: sin `cost`
const producto = {
  _id: 'p1',
  name: 'Refresco 600 ml',
  description: 'Botella de vidrio retornable',
  price: 40,
  quantity: 3,
  unit: 'piezas',
  discount: 10,
  category: 'Bebidas',
  brand: 'Coca-Cola',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

const montar = (id: string) =>
  renderRouter(
    {
      'producto/[id]': () => (
        <Proveedores esperarSesion>
          <ProductoScreen />
        </Proveedores>
      ),
    },
    { initialUrl: `/producto/${id}` }
  );

test('el empleado ve el producto sin poder editarlo ni ver su costo', async () => {
  await sesionGuardada({ rol: 'empleado' });
  backendFalso({ 'GET /products': [producto] });
  await montar('p1');

  expect(await screen.findByText('Refresco 600 ml')).toBeOnTheScreen();
  expect(screen.getByText('$40.00')).toBeOnTheScreen();
  expect(screen.getByText('3 piezas')).toBeOnTheScreen();
  expect(screen.getByText('10% de descuento')).toBeOnTheScreen();
  expect(screen.getByText('Bebidas')).toBeOnTheScreen();
  expect(screen.getByText('Coca-Cola')).toBeOnTheScreen();
  expect(screen.getByText('Botella de vidrio retornable')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Vender este producto' })).toBeOnTheScreen();

  // Nada para editar, ni costo ni margen
  for (const boton of ['Guardar cambios', 'Eliminar producto', 'Galería', 'Tomar foto']) {
    expect(screen.queryByRole('button', { name: boton })).toBeNull();
  }
  expect(screen.queryByLabelText('Precio de costo')).toBeNull();
  expect(screen.queryByText(/costo|margen/i)).toBeNull();
});

test('el empleado no puede agregar productos', async () => {
  await sesionGuardada({ rol: 'empleado' });
  backendFalso({ 'GET /products': [producto] });
  await montar('nuevo');

  expect(await screen.findByText('Solo el dueño puede agregar productos')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Volver' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Crear producto' })).toBeNull();
  expect(screen.queryByLabelText('Nombre')).toBeNull();
});

test('el dueño edita el producto y ve su costo y margen', async () => {
  await sesionGuardada({ rol: 'dueno' });
  backendFalso({ 'GET /products': [{ ...producto, cost: 25 }] });
  await montar('p1');

  expect(await screen.findByRole('button', { name: 'Guardar cambios' })).toBeOnTheScreen();
  expect(screen.getByLabelText('Precio de costo')).toHaveDisplayValue('25');
  expect(screen.getByText('Margen de ganancia: 37.5%')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Eliminar producto' })).toBeOnTheScreen();
});

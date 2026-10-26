import { fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import EmpleadoScreen from '@/app/empleados/[id]';
import EmpleadosScreen from '@/app/empleados/index';
import { MENSAJE_PASSWORD } from '@/lib/validacion';

import { backendFalso, Proveedores, sesionGuardada } from '../helpers';

const luis = {
  _id: 'e1', name: 'Luis', lastName: 'Pérez', email: 'luis@correo.com', rol: 'empleado', activo: true,
  createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
};
const marta = { ...luis, _id: 'e2', name: 'Marta', lastName: 'Ruiz', email: 'marta@correo.com', activo: false };

const montar = (url: string) =>
  renderRouter(
    {
      'empleados/index': () => (
        <Proveedores esperarSesion>
          <EmpleadosScreen />
        </Proveedores>
      ),
      'empleados/[id]': () => (
        <Proveedores esperarSesion>
          <EmpleadoScreen />
        </Proveedores>
      ),
    },
    { initialUrl: url }
  );

beforeEach(async () => {
  await sesionGuardada({ rol: 'dueno' });
});

test('lista de empleados con totales, activos e inactivos', async () => {
  backendFalso({ 'GET /employees': [marta, luis] });
  await montar('/empleados');

  expect(await screen.findByText('Luis Pérez')).toBeOnTheScreen();
  expect(screen.getByLabelText('Empleados: 2')).toBeOnTheScreen();
  expect(screen.getByLabelText('Activos: 1')).toBeOnTheScreen();
  expect(screen.getByLabelText('Inactivos: 1')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Luis Pérez, activo' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Marta Ruiz, inactivo' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Agregar empleado' })).toBeOnTheScreen();
  expect(screen.getByText('¿Qué puede hacer un empleado?')).toBeOnTheScreen();
});

test('alta de empleado: valida antes de enviar y manda POST /employees con sus datos', async () => {
  const empleados: object[] = [];
  const { llamadas } = backendFalso({
    'GET /employees': () => ({ body: empleados }),
    'POST /employees': (body: any) => {
      const { password, ...datos } = body;
      const nuevo = { _id: 'e9', ...datos, rol: 'empleado', activo: true, createdAt: '', updatedAt: '' };
      empleados.push(nuevo);
      return { status: 201, body: nuevo };
    },
  });
  const user = userEvent.setup();
  await montar('/empleados/nuevo');

  // Vacío: marca los campos y no llama al servidor
  await user.press(await screen.findByRole('button', { name: 'Crear empleado' }));
  expect(await screen.findByText('Revisa los campos marcados.')).toBeOnTheScreen();
  expect(screen.getByText('Escribe el nombre')).toBeOnTheScreen();
  expect(screen.getByText('Escribe el apellido')).toBeOnTheScreen();
  expect(screen.getByText('Escribe el correo')).toBeOnTheScreen();
  expect(screen.getByText(MENSAJE_PASSWORD)).toBeOnTheScreen();

  await user.type(screen.getByLabelText('Nombre'), 'Luis');
  await user.type(screen.getByLabelText('Apellido'), 'Pérez');
  await user.type(screen.getByLabelText('Correo electrónico'), 'Luis@Correo.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Segura123!');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'Segura12!');
  await user.press(screen.getByRole('button', { name: 'Crear empleado' }));
  expect(await screen.findByText('Las contraseñas no coinciden')).toBeOnTheScreen();
  expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);

  await user.clear(screen.getByLabelText('Confirmar contraseña'));
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'Segura123!');
  await user.press(screen.getByRole('button', { name: 'Crear empleado' }));

  await waitFor(() =>
    expect(llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/employees')?.body).toEqual({
      name: 'Luis',
      lastName: 'Pérez',
      email: 'luis@correo.com',
      password: 'Segura123!',
    })
  );
  // Regresa a la lista, ya con el nuevo empleado
  expect(await screen.findByRole('button', { name: 'Luis Pérez, activo' })).toBeOnTheScreen();
});

test('editar: desactivar el acceso manda PUT sin contraseña; el correo no se puede cambiar', async () => {
  const { llamadas } = backendFalso({
    'GET /employees': [luis],
    'PUT /employees/e1': (body: any) => ({ body: { ...luis, ...body } }),
  });
  const user = userEvent.setup();
  await montar('/empleados/e1');

  expect(await screen.findByDisplayValue('Luis')).toBeOnTheScreen();
  expect(screen.getByLabelText('Correo electrónico')).toHaveProp('editable', false);
  await fireEvent(screen.getByLabelText('Acceso activo'), 'valueChange', false);
  expect(screen.getByText('No puede entrar a la app.')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Guardar cambios' }));

  await waitFor(() =>
    expect(llamadas.find((l) => l.metodo === 'PUT')?.body).toEqual({ name: 'Luis', lastName: 'Pérez', activo: false })
  );
});

test('eliminar avisa que sus ventas conservan su nombre y manda DELETE', async () => {
  // Se confirma el diálogo nativo
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation((_titulo, _mensaje, botones) => {
    botones?.find((b) => b.style === 'destructive')?.onPress?.();
  });
  const { llamadas } = backendFalso({
    'GET /employees': [luis],
    'DELETE /employees/e1': { message: 'Empleado eliminado' },
  });
  const user = userEvent.setup();
  await montar('/empleados/e1');

  await user.press(await screen.findByRole('button', { name: 'Eliminar empleado' }));

  expect(alerta).toHaveBeenCalledWith(
    '¿Eliminar empleado?',
    expect.stringContaining('Las ventas que registró se conservan con su nombre'),
    expect.anything(),
    expect.anything()
  );
  await waitFor(() => expect(llamadas.some((l) => l.metodo === 'DELETE' && l.ruta === '/employees/e1')).toBe(true));
  alerta.mockRestore();
});

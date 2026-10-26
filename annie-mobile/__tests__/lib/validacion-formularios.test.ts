import { folioTxt, isoLocalDate, money, parseAmount, plural } from '@/lib/format';
import {
  camposACliente,
  camposAEmpleado,
  camposAProducto,
  clienteVacio,
  empleadoACampos,
  empleadoVacio,
  productoACampos,
  productoVacio,
  validarCliente,
  validarEmpleado,
  validarMovimiento,
  validarProducto,
  type CamposCliente,
} from '@/lib/formularios';
import type { Empleado, Product } from '@/lib/types';
import {
  CAMPOS_REGISTRO_VACIOS,
  CATEGORIAS_PRODUCTO,
  limpiarRFC,
  MENSAJE_PASSWORD,
  PASSWORD_REGEX,
  sinRFCReal,
  validarRegistro,
  validarRFC,
} from '@/lib/validacion';

describe('formatos', () => {
  it('dinero con separador de miles y 2 decimales', () => {
    expect(money(1234.5)).toBe('$1,234.50');
    expect(money(0)).toBe('$0.00');
    expect(money(undefined)).toBe('$0.00');
  });
  it('folio a 6 dígitos', () => {
    expect(folioTxt(12)).toBe('000012');
    expect(folioTxt(undefined)).toBe('—');
  });
  it('fecha local y montos escritos por el usuario', () => {
    expect(isoLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('$ 20')).toBe(20);
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
    expect(plural(1, 'venta')).toBe('1 venta');
    expect(plural(3, 'venta')).toBe('3 ventas');
  });
});

describe('RFC y contraseña (mismas reglas que el backend)', () => {
  it('valida RFC de persona física y moral', () => {
    expect(validarRFC('GOMA800101AB1')).toBeNull();
    expect(validarRFC('ABC010101XY9')).toBeNull();
    expect(validarRFC('ABC010101XY9', 'fisica')).toMatch(/física/);
    expect(validarRFC('GOMA800101AB1', 'moral')).toMatch(/moral/);
    expect(validarRFC('NOVALIDO')).toMatch(/formato/);
    expect(limpiarRFC(' goma-800101 ab1 ')).toBe('GOMA800101AB1');
  });
  it('detecta negocios sin RFC real', () => {
    expect(sinRFCReal({ rfc: 'XAXX010101000' })).toBe(true);
    expect(sinRFCReal({ rfc: '' })).toBe(true);
    expect(sinRFCReal({ rfc: 'GOMA800101AB1', rfcGenerico: false })).toBe(false);
    expect(sinRFCReal(null)).toBe(true);
  });
  it('contraseña segura', () => {
    expect(PASSWORD_REGEX.test('Segura123!')).toBe(true);
    expect(PASSWORD_REGEX.test('segura123!')).toBe(false);
    expect(PASSWORD_REGEX.test('Segura!!')).toBe(false);
    expect(PASSWORD_REGEX.test('Seg1!')).toBe(false);
  });
  it('registro: marca cada campo con error', () => {
    const e = validarRegistro({ ...CAMPOS_REGISTRO_VACIOS, email: 'malo', password: 'abc', confirmar: 'xyz', rfc: 'X' });
    expect(Object.keys(e).sort()).toEqual(['businessName', 'confirmar', 'email', 'lastName', 'name', 'password', 'rfc']);
    const ok = validarRegistro({
      name: 'Ana', lastName: 'López', businessName: 'Tienda', rfc: '', email: 'ana@correo.com', password: 'Segura123!', confirmar: 'Segura123!',
    });
    expect(ok).toEqual({});
  });
});

describe('formulario de producto', () => {
  const base: Product = {
    _id: '1', name: 'Leche', price: 24, quantity: 10, unit: '', category: '', createdAt: '', updatedAt: '',
  };
  it('un producto sin categoría abre sin categoría (no fuerza "Otro")', () => {
    const c = productoACampos(base, CATEGORIAS_PRODUCTO);
    expect(c.categoria).toBe('');
    expect(validarProducto({ ...c })).toEqual({});
  });
  it('conserva "Sin unidad" al editar', () => {
    expect(productoACampos(base, CATEGORIAS_PRODUCTO).unit).toBe('');
  });
  it('una categoría propia se edita como "Otro"', () => {
    const c = productoACampos({ ...base, category: 'Mascotas' }, CATEGORIAS_PRODUCTO);
    expect(c.categoria).toBe('Otro');
    expect(c.categoriaOtra).toBe('Mascotas');
    expect(camposAProducto(c).category).toBe('Mascotas');
  });
  it('valida obligatorios, números y stock entero', () => {
    const e = validarProducto({ ...productoVacio, price: '-5', quantity: '1.5', categoria: 'Otro' });
    expect(e.name).toBeDefined();
    expect(e.price).toBeDefined();
    expect(e.quantity).toBeDefined();
    expect(e.categoriaOtra).toBeDefined();
  });
  it('arma el cuerpo para la API', () => {
    const datos = camposAProducto({ ...productoVacio, name: ' Pan ', price: '45', cost: '', quantity: '15', categoria: 'Panadería' });
    expect(datos).toMatchObject({ name: 'Pan', price: 45, cost: null, quantity: 15, category: 'Panadería', unit: 'piezas' });
  });
});

describe('formulario de cliente y créditos', () => {
  it('cliente de crédito requiere RFC válido y límite no menor al saldo', () => {
    expect(validarCliente({ ...clienteVacio, name: 'Juan', esMayoreo: true }).rfc).toBeDefined();
    const e = validarCliente({ ...clienteVacio, name: 'Juan', esMayoreo: true, rfc: 'GOMA800101AB1', limiteCredito: '100' }, 150);
    expect(e.limiteCredito).toMatch(/menor/);
    expect(validarCliente({ ...clienteVacio, name: 'Juan', esMayoreo: true, rfc: 'GOMA800101AB1', limiteCredito: '500' }, 150)).toEqual({});
  });
  it('persona física no manda razón social; sin crédito no manda datos fiscales', () => {
    const fisica = camposACliente({ ...clienteVacio, name: 'Juan', esMayoreo: true, tipoPersona: 'fisica', rfc: 'goma800101ab1', razonSocial: 'Vieja SA', limiteCredito: '300' });
    expect(fisica).toMatchObject({ rfc: 'GOMA800101AB1', razonSocial: '', limiteCredito: 300 });
    expect(camposACliente({ ...clienteVacio, name: 'Ana' })).not.toHaveProperty('rfc');
  });
  it('movimientos: abono no mayor al saldo, cargo no mayor al disponible', () => {
    expect(validarMovimiento('abono', '0', 100, 50)).toMatch(/mayor a 0/);
    expect(validarMovimiento('abono', '150', 100, 50)).toMatch(/abono/);
    expect(validarMovimiento('cargo', '60', 100, 50)).toMatch(/cargo/);
    expect(validarMovimiento('abono', '100', 100, 50)).toBeNull();
  });
});

describe('cliente capturado por un empleado (solo datos de contacto)', () => {
  const deCredito: CamposCliente = {
    ...clienteVacio,
    name: ' Juan ',
    lastName: 'Pérez',
    email: 'juan@correo.com',
    phone: '555 123 4567',
    esMayoreo: true,
    tipoPersona: 'moral',
    rfc: 'ABC010101XY9',
    razonSocial: 'Juan SA',
    limiteCredito: '1000',
  };

  it('no manda esMayoreo ni datos fiscales o de crédito', () => {
    expect(camposACliente(deCredito, { soloContacto: true })).toEqual({
      name: 'Juan',
      lastName: 'Pérez',
      email: 'juan@correo.com',
      phone: '555 123 4567',
    });
  });

  it('no valida el RFC ni el límite, que el empleado no ve', () => {
    const conDatosMalos = { ...deCredito, rfc: 'MALO', limiteCredito: '-5' };
    expect(validarCliente(conDatosMalos, 500, { soloContacto: true })).toEqual({});
    expect(validarCliente({ ...conDatosMalos, name: '' }, 500, { soloContacto: true })).toEqual({ name: 'El nombre es obligatorio' });
    expect(Object.keys(validarCliente(conDatosMalos, 500)).sort()).toEqual(['limiteCredito', 'rfc']);
  });

  it('el dueño sigue mandando el crédito y los datos fiscales', () => {
    expect(camposACliente(deCredito)).toMatchObject({ esMayoreo: true, tipoPersona: 'moral', rfc: 'ABC010101XY9', razonSocial: 'Juan SA', limiteCredito: 1000 });
  });
});

describe('formulario de empleado', () => {
  const empleado: Empleado = {
    _id: 'e1', name: 'Luis', lastName: 'Pérez', email: 'luis@correo.com', rol: 'empleado', activo: true, createdAt: '', updatedAt: '',
  };

  it('al crear, todos los campos son obligatorios y la contraseña sigue las reglas del registro', () => {
    const e = validarEmpleado({ ...empleadoVacio, email: 'malo', password: 'abc', confirmar: 'xyz' }, true);
    expect(Object.keys(e).sort()).toEqual(['confirmar', 'email', 'lastName', 'name', 'password']);
    expect(e.password).toBe(MENSAJE_PASSWORD);
    expect(e.email).toBe('El correo no tiene un formato válido');
    expect(validarEmpleado(empleadoVacio, true).email).toBe('Escribe el correo');
  });

  it('arma el cuerpo de POST /employees', () => {
    const c = { ...empleadoVacio, name: ' Luis ', lastName: ' Pérez ', email: ' Luis@Correo.com ', password: 'Segura123!', confirmar: 'Segura123!' };
    expect(validarEmpleado(c, true)).toEqual({});
    expect(camposAEmpleado(c, true)).toEqual({ name: 'Luis', lastName: 'Pérez', email: 'luis@correo.com', password: 'Segura123!' });
  });

  it('al editar, la contraseña es opcional y solo se manda si se cambia', () => {
    const c = empleadoACampos(empleado);
    expect(c).toMatchObject({ name: 'Luis', email: 'luis@correo.com', password: '', activo: true });
    expect(validarEmpleado(c, false)).toEqual({});
    expect(camposAEmpleado({ ...c, activo: false }, false)).toEqual({ name: 'Luis', lastName: 'Pérez', activo: false });

    expect(validarEmpleado({ ...c, password: 'corta', confirmar: 'corta' }, false).password).toBe(MENSAJE_PASSWORD);
    expect(validarEmpleado({ ...c, password: 'Nueva123!', confirmar: 'Otra123!' }, false).confirmar).toBe('Las contraseñas no coinciden');
    const conNueva = { ...c, password: 'Nueva123!', confirmar: 'Nueva123!' };
    expect(validarEmpleado(conNueva, false)).toEqual({});
    expect(camposAEmpleado(conNueva, false)).toEqual({ name: 'Luis', lastName: 'Pérez', activo: true, password: 'Nueva123!' });
  });
});

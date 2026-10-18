// Validación y armado de los formularios de producto, cliente y negocio.
// Regresan los errores por campo (vacío = todo bien).
import { parseAmount } from './format';
import type { Client, Product } from './types';
import { limpiarRFC, validarRFC } from './validacion';

export type Errores<K extends string> = Partial<Record<K, string>>;

// ── Producto ─────────────────────────────────────────────────────
export type CamposProducto = {
  name: string;
  brand: string;
  categoria: string; // una de las predefinidas, 'Otro' o ''
  categoriaOtra: string;
  price: string;
  cost: string;
  quantity: string;
  unit: string;
  description: string;
  image: string;
};

export const productoVacio: CamposProducto = {
  name: '',
  brand: '',
  categoria: '',
  categoriaOtra: '',
  price: '',
  cost: '',
  quantity: '',
  unit: 'piezas',
  description: '',
  image: '',
};

export function productoACampos(p: Product, predefinidas: string[]): CamposProducto {
  const cat = p.category ?? '';
  const esPredefinida = !cat || predefinidas.includes(cat);
  return {
    name: p.name,
    brand: p.brand ?? '',
    categoria: esPredefinida ? cat : 'Otro',
    categoriaOtra: esPredefinida ? '' : cat,
    price: String(p.price ?? ''),
    cost: p.cost ? String(p.cost) : '',
    quantity: String(p.quantity ?? 0),
    // Conservar "Sin unidad" ('') tal cual al editar
    unit: p.unit ?? 'piezas',
    description: p.description ?? '',
    image: p.image ?? '',
  };
}

export function validarProducto(c: CamposProducto): Errores<keyof CamposProducto> {
  const e: Errores<keyof CamposProducto> = {};
  if (!c.name.trim()) e.name = 'El nombre es obligatorio';
  const precio = parseAmount(c.price);
  if (!c.price.trim()) e.price = 'El precio es obligatorio';
  else if (Number.isNaN(precio) || precio < 0) e.price = 'Escribe un precio válido (0 o más)';
  if (c.cost.trim()) {
    const costo = parseAmount(c.cost);
    if (Number.isNaN(costo) || costo < 0) e.cost = 'Escribe un costo válido (0 o más)';
  }
  const stock = Number(c.quantity);
  if (!c.quantity.trim()) e.quantity = 'El stock es obligatorio';
  else if (!Number.isInteger(stock) || stock < 0) e.quantity = 'El stock debe ser un número entero (0 o más)';
  if (c.categoria === 'Otro' && !c.categoriaOtra.trim()) e.categoriaOtra = 'Escribe la categoría';
  return e;
}

export const camposAProducto = (c: CamposProducto) => ({
  name: c.name.trim(),
  brand: c.brand.trim(),
  category: c.categoria === 'Otro' ? c.categoriaOtra.trim() : c.categoria,
  price: parseAmount(c.price),
  cost: c.cost.trim() ? parseAmount(c.cost) : null,
  quantity: Number(c.quantity),
  unit: c.unit,
  description: c.description.trim(),
  image: c.image,
});

// ── Cliente ──────────────────────────────────────────────────────
export type CamposCliente = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  esMayoreo: boolean;
  tipoPersona: 'fisica' | 'moral';
  rfc: string;
  razonSocial: string;
  limiteCredito: string;
};

export const clienteVacio: CamposCliente = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  esMayoreo: false,
  tipoPersona: 'fisica',
  rfc: '',
  razonSocial: '',
  limiteCredito: '',
};

export const clienteACampos = (c: Client): CamposCliente => ({
  name: c.name,
  lastName: c.lastName ?? '',
  email: c.email ?? '',
  phone: c.phone ?? '',
  esMayoreo: !!c.esMayoreo,
  tipoPersona: c.tipoPersona === 'moral' ? 'moral' : 'fisica',
  rfc: c.rfc ?? '',
  razonSocial: c.razonSocial ?? '',
  limiteCredito: c.limiteCredito ? String(c.limiteCredito) : '',
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCliente(c: CamposCliente, saldoActual = 0): Errores<keyof CamposCliente> {
  const e: Errores<keyof CamposCliente> = {};
  if (!c.name.trim()) e.name = 'El nombre es obligatorio';
  if (c.email.trim() && !EMAIL.test(c.email.trim())) e.email = 'El correo no tiene un formato válido';
  if (c.esMayoreo) {
    if (!c.rfc.trim()) e.rfc = 'El RFC es obligatorio para clientes de crédito';
    else {
      const err = validarRFC(c.rfc, c.tipoPersona);
      if (err) e.rfc = err;
    }
    const limite = c.limiteCredito.trim() ? parseAmount(c.limiteCredito) : 0;
    if (Number.isNaN(limite) || limite < 0) e.limiteCredito = 'El límite debe ser un número mayor o igual a 0';
    else if (limite < saldoActual) e.limiteCredito = `El límite no puede ser menor a lo que debe ($${saldoActual.toFixed(2)})`;
  }
  return e;
}

export function camposACliente(c: CamposCliente) {
  const base = {
    name: c.name.trim(),
    lastName: c.lastName.trim(),
    email: c.email.trim(),
    phone: c.phone.trim(),
    esMayoreo: c.esMayoreo,
  };
  if (!c.esMayoreo) return base;
  return {
    ...base,
    tipoPersona: c.tipoPersona,
    rfc: limpiarRFC(c.rfc),
    razonSocial: c.tipoPersona === 'moral' ? c.razonSocial.trim() : '',
    limiteCredito: c.limiteCredito.trim() ? parseAmount(c.limiteCredito) : 0,
  };
}

// ── Movimiento de crédito ────────────────────────────────────────
export function validarMovimiento(tipo: 'cargo' | 'abono', montoTxt: string, saldo: number, disponible: number): string | null {
  const monto = parseAmount(montoTxt);
  if (Number.isNaN(monto) || monto <= 0) return 'El monto debe ser mayor a 0';
  if (tipo === 'abono' && monto > saldo + 0.001) return `El abono no puede ser mayor a lo que debe ($${saldo.toFixed(2)})`;
  if (tipo === 'cargo' && monto > disponible + 0.001) return `El cargo excede el crédito disponible ($${disponible.toFixed(2)})`;
  return null;
}

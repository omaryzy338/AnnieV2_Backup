// Consultas y mutaciones de la API con React Query. Cada mutación invalida
// las consultas que dependen de ella (p. ej. una venta cambia el inventario,
// las ventas y, si fue a crédito, el saldo del cliente).
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { api, type ArchivoLocal } from './api';
import type {
  Business,
  Client,
  CreditMovement,
  CreditSummary,
  DiscountType,
  PaymentMethod,
  Product,
  Profile,
  Sale,
  UserProfile,
} from './types';

export const qk = {
  products: ['products'] as const,
  clients: ['clients'] as const,
  sales: ['sales'] as const,
  profile: ['profile'] as const,
  credits: ['credits'] as const,
  creditSummary: ['credits', 'resumen'] as const,
  movimientos: (clientId: string) => ['credits', 'movimientos', clientId] as const,
};

// ── Consultas ────────────────────────────────────────────────────
export const useProducts = () => useQuery({ queryKey: qk.products, queryFn: () => api.get<Product[]>('/products') });
export const useClients = () => useQuery({ queryKey: qk.clients, queryFn: () => api.get<Client[]>('/clients') });
export const useSales = () => useQuery({ queryKey: qk.sales, queryFn: () => api.get<Sale[]>('/sales') });
export const useProfile = () => useQuery({ queryKey: qk.profile, queryFn: () => api.get<Profile>('/profile') });
export const useCreditClients = () => useQuery({ queryKey: qk.credits, queryFn: () => api.get<Client[]>('/credits') });
export const useCreditSummary = () =>
  useQuery({ queryKey: qk.creditSummary, queryFn: () => api.get<CreditSummary>('/credits/resumen') });
export const useMovimientos = (clientId: string) =>
  useQuery({
    queryKey: qk.movimientos(clientId),
    queryFn: () => api.get<{ client: Client; movimientos: CreditMovement[] }>(`/credits/${clientId}/movimientos`),
    enabled: !!clientId,
  });

function useInvalidar() {
  const qc = useQueryClient();
  return (...keys: QueryKey[]) => Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

// ── Ventas ───────────────────────────────────────────────────────
export type NuevaVenta = {
  productId: string;
  quantity: number;
  clientId?: string;
  discount: number;
  discountType: DiscountType;
  saleDate: string;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
};

export function useCrearVenta() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (venta: NuevaVenta) =>
      api.post<{ message: string; sale: Sale; inventarioRestante: number }>('/sales', venta),
    onSuccess: () => invalidar(qk.sales, qk.products, qk.credits, qk.clients),
  });
}

export function useCancelarVenta() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>(`/sales/${id}`),
    onSuccess: () => invalidar(qk.sales, qk.products, qk.credits, qk.clients),
  });
}

// ── Productos ────────────────────────────────────────────────────
export type ProductoForm = {
  name: string;
  brand: string;
  category: string;
  price: number;
  cost: number | null;
  quantity: number;
  unit: string;
  description: string;
  image: string;
};

export function useGuardarProducto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: ProductoForm }) =>
      id ? api.put<Product>(`/products/${id}`, datos) : api.post<Product>('/products', datos),
    onSuccess: () => invalidar(qk.products, qk.sales),
  });
}

export function useEliminarProducto() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => invalidar(qk.products, qk.sales),
  });
}

export const subirImagenProducto = (archivo: ArchivoLocal) =>
  api.upload<{ url: string }>('/products/upload-image', 'image', archivo);

// ── Clientes y créditos ──────────────────────────────────────────
export type ClienteForm = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  esMayoreo: boolean;
  tipoPersona?: 'fisica' | 'moral';
  rfc?: string;
  razonSocial?: string;
  limiteCredito?: number;
};

export function useGuardarCliente() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: ClienteForm }) =>
      id ? api.put<Client>(`/clients/${id}`, datos) : api.post<Client>('/clients', datos),
    onSuccess: () => invalidar(qk.clients, qk.credits, qk.sales),
  });
}

export function useEliminarCliente() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => invalidar(qk.clients, qk.credits, qk.sales),
  });
}

export function useMovimientoCredito() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ clientId, tipo, amount, description }: { clientId: string; tipo: 'cargo' | 'abono'; amount: number; description?: string }) =>
      api.post<{ message: string; saldo: number }>(`/credits/${clientId}/${tipo}`, { amount, description }),
    onSuccess: () => invalidar(qk.credits, qk.clients),
  });
}

// ── Perfil ───────────────────────────────────────────────────────
export type NegocioForm = Pick<Business, 'name' | 'category' | 'state' | 'city' | 'address' | 'phone' | 'rfc' | 'description' | 'country'>;
export type PropietarioForm = Pick<UserProfile, 'name' | 'lastName' | 'birthDate' | 'state' | 'city' | 'country'>;

export function useGuardarNegocio() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (datos: NegocioForm) => api.put<Business>('/profile/business', datos),
    onSuccess: () => invalidar(qk.profile),
  });
}

export function useGuardarPropietario() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (datos: PropietarioForm) => api.put<UserProfile>('/profile/user', datos),
    onSuccess: () => invalidar(qk.profile),
  });
}

export function useSubirLogo() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (archivo: ArchivoLocal) => api.upload<{ logo: string }>('/profile/business/logo', 'logo', archivo),
    onSuccess: () => invalidar(qk.profile),
  });
}

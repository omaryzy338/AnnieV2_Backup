// Tipos de los datos que regresa la API de Annie (annie-backend/models).

export type SessionUser = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  businessId: string | null;
  businessName: string | null;
  slug: string | null;
};

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  discount?: number;
  category?: string;
  brand?: string;
  unit?: string;
  image?: string;
  cost?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TipoPersona = 'fisica' | 'moral' | '';

export type Client = {
  _id: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tipoPersona?: TipoPersona;
  rfc?: string;
  razonSocial?: string;
  esMayoreo?: boolean;
  limiteCredito?: number;
  saldo?: number;
  creditoDisponible?: number;
  createdAt: string;
};

export type PaymentMethod = 'efectivo' | 'credito';
export type DiscountType = 'porcentaje' | 'fijo';

export type Sale = {
  _id: string;
  folio?: number;
  product: Pick<Product, '_id' | 'name' | 'price' | 'image' | 'unit' | 'category'> | null;
  client: Pick<Client, '_id' | 'name' | 'lastName' | 'email'> | null;
  quantity: number;
  price: number;
  discount: number;
  discountType: DiscountType;
  total: number;
  saleDate: string | null;
  paymentMethod?: PaymentMethod;
  amountPaid?: number | null;
  change?: number;
  createdAt: string;
};

export type Business = {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  category?: string;
  description?: string;
  logo?: string;
  country?: string;
  state?: string;
  city?: string;
  rfc?: string;
  rfcGenerico?: boolean;
};

export type UserProfile = {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  birthDate?: string | null;
  country?: string;
  state?: string;
  city?: string;
};

export type Profile = { user: UserProfile; business: Business | null };

export type CreditMovement = {
  _id: string;
  type: 'cargo' | 'abono';
  amount: number;
  description?: string;
  saldoDespues: number;
  createdAt: string;
};

export type CreditSummary = {
  clientesCredito: number;
  conDeuda: number;
  sobreLimite: number;
  totalPorCobrar: number;
  limiteTotal: number;
  disponibleTotal: number;
};

// Siembra una cuenta de demostración completa (negocio, productos con
// imágenes reales, clientes -incluyendo de mayoreo con crédito- y ventas)
// hablando con la API real (no toca la base de datos directamente), para
// que todo pase por las mismas validaciones que usaría un usuario real.
//
// Uso:
//   node scripts/seedDemo.js
//   API_URL=http://localhost:5000 node scripts/seedDemo.js
//
// Se puede sembrar cualquier cuenta pasando estas variables:
//   SEED_EMAIL, SEED_PASSWORD, SEED_BUSINESS, SEED_NAME, SEED_LASTNAME
//
// Es seguro correrlo varias veces: si el email ya existe, inicia sesión con
// esa cuenta en vez de duplicarla.

const API_URL = process.env.API_URL || 'http://localhost:5000';

const DEMO_EMAIL    = process.env.SEED_EMAIL    || 'demo@annie.app';
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo2026!';
const DEMO_BUSINESS = process.env.SEED_BUSINESS || 'Abarrotes Demo Annie';
const DEMO_NAME     = process.env.SEED_NAME     || 'Demo';
const DEMO_LASTNAME = process.env.SEED_LASTNAME || 'Annie';

let token = '';

async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.message || 'error desconocido'}`);
  return data;
}

const PRODUCTOS = [
  {
    name: 'Coca-Cola 600ml', brand: 'Coca-Cola', category: 'Bebidas', unit: 'piezas',
    price: 18, cost: 12, quantity: 60, discount: 0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg/500px-15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg',
    description: 'Refresco de cola 600ml',
  },
  {
    name: 'Papas Sabritas Original 45g', brand: 'Sabritas', category: 'Snacks', unit: 'piezas',
    price: 16, cost: 10, quantity: 90, discount: 0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Opened_bag_of_Ruffles_All_Dressed_potato_chips.jpg/500px-Opened_bag_of_Ruffles_All_Dressed_potato_chips.jpg',
    description: 'Papas fritas sabor original',
  },
  {
    name: "Chocolate Hershey's 40g", brand: "Hershey's", category: 'Dulces y chocolates', unit: 'piezas',
    price: 22, cost: 14, quantity: 45, discount: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/HERSHEY%27S_Chocolate_Bar_Greatest_Milk_Chocolate.jpg/500px-HERSHEY%27S_Chocolate_Bar_Greatest_Milk_Chocolate.jpg',
    description: 'Chocolate de leche',
  },
  {
    name: 'Limpiador Multiusos 1L', brand: 'Pinol', category: 'Limpieza', unit: 'piezas',
    price: 35, cost: 22, quantity: 28, discount: 0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Afwasmiddel_Una_Aldi.JPG/500px-Afwasmiddel_Una_Aldi.JPG',
    description: 'Limpiador líquido multiusos',
  },
  // Estas 4 categorías no tenían una foto de producto limpia y verificable
  // en Wikimedia Commons, así que usan un placeholder de color (con los
  // colores de la app) en vez de arriesgar una imagen rota o irrelevante.
  {
    name: 'Pan Blanco Grande', brand: 'Bimbo', category: 'Panadería', unit: 'piezas',
    price: 45, cost: 30, quantity: 15, discount: 0,
    image: 'https://placehold.co/400x300/f0f2ff/6372ff/png?text=Pan+Blanco',
    description: 'Pan de caja blanco grande',
  },
  {
    name: 'Leche Entera 1L', brand: 'Lala', category: 'Lácteos', unit: 'piezas',
    price: 24, cost: 18, quantity: 32, discount: 0,
    image: 'https://placehold.co/400x300/e3f2fd/1976d2/png?text=Leche+Entera',
    description: 'Leche entera ultrapasteurizada',
  },
  {
    name: 'Pasta Dental 100ml', brand: 'Colgate', category: 'Higiene personal', unit: 'piezas',
    price: 38, cost: 25, quantity: 22, discount: 0,
    image: 'https://placehold.co/400x300/f3e5f5/9c27b0/png?text=Pasta+Dental',
    description: 'Pasta dental anticaries',
  },
  {
    name: 'Cuaderno Profesional 100 hojas', brand: 'Scribe', category: 'Papelería', unit: 'piezas',
    price: 28, cost: 16, quantity: 40, discount: 0,
    image: 'https://placehold.co/400x300/e8eaf6/7986cb/png?text=Cuaderno',
    description: 'Cuaderno profesional cuadriculado',
  },
];

const CLIENTES = [
  { name: 'María', lastName: 'González', email: 'maria.gonzalez@correo.com', phone: '555-101-2020', esMayoreo: false },
  { name: 'Juan', lastName: 'Pérez', email: 'juan.perez@correo.com', phone: '555-303-4040', esMayoreo: false },
  {
    name: 'Abarrotes La Esquina', lastName: 'Juan Ramírez', esMayoreo: true,
    tipoPersona: 'fisica', rfc: 'GOMJ850315MN4', limiteCredito: 5000,
    email: 'abarrotes.esquina@correo.com', phone: '555-405-1122',
  },
  {
    name: 'Distribuidora del Valle SA de CV', lastName: 'Contacto: Laura Vega', esMayoreo: true,
    tipoPersona: 'moral', rfc: 'DVA990615XY3', razonSocial: 'Distribuidora del Valle S.A. de C.V.',
    limiteCredito: 15000, email: 'compras@distvalle.com', phone: '555-606-7788',
  },
  {
    name: 'Minisuper Don Beto', lastName: 'Roberto Salinas', esMayoreo: true,
    tipoPersona: 'fisica', rfc: 'PELR900722QW1', limiteCredito: 3000,
    email: 'donbeto@correo.com', phone: '555-808-9911',
  },
  {
    name: 'Tortillería La Reyna SA de CV', lastName: 'Contacto: Ana Reyna', esMayoreo: true,
    tipoPersona: 'moral', rfc: 'TRE010228AB7', razonSocial: 'Tortillería La Reyna S.A. de C.V.',
    limiteCredito: 8000, email: 'lareyna.tortilleria@correo.com', phone: '555-222-3131',
  },
];

async function main() {
  console.log(`Conectando a ${API_URL}...`);

  console.log('\n1. Creando cuenta de demo...');
  let auth;
  try {
    auth = await api('POST', '/auth/register', {
      name: DEMO_NAME, lastName: DEMO_LASTNAME, email: DEMO_EMAIL, password: DEMO_PASSWORD,
      businessName: DEMO_BUSINESS,
      address: 'Av. Reforma 123, Col. Centro', phone: '555-000-1234',
      category: 'Abarrotes', description: 'Tienda de abarrotes de demostración para Annie',
    });
    console.log(`   Cuenta creada: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } catch (err) {
    if (String(err.message).includes('Ya existe una cuenta')) {
      console.log('   La cuenta demo ya existe, iniciando sesión...');
      auth = await api('POST', '/auth/login', { email: DEMO_EMAIL, password: DEMO_PASSWORD });
    } else {
      throw err;
    }
  }
  token = auth.token;

  console.log('\n2. Completando el perfil del negocio (estado/ciudad/RFC)...');
  await api('PUT', '/profile/business', {
    name: DEMO_BUSINESS, address: 'Av. Reforma 123, Col. Centro',
    phone: '555-000-1234', category: 'Abarrotes',
    description: 'Tienda de abarrotes de demostración para Annie',
    country: 'Mexico', state: 'Jalisco', city: 'Guadalajara',
    // RFC real (no genérico) para que la demo pueda dar de alta clientes de crédito
    rfc: 'GOMJ850315MN4',
  });

  console.log('\n3. Creando productos...');
  const productosCreados = [];
  for (const p of PRODUCTOS) {
    const creado = await api('POST', '/products', p);
    productosCreados.push(creado);
    console.log(`   + ${creado.name}`);
  }

  console.log('\n4. Creando clientes...');
  const clientesCreados = [];
  for (const c of CLIENTES) {
    const creado = await api('POST', '/clients', c);
    clientesCreados.push(creado);
    console.log(`   + ${creado.name}${creado.esMayoreo ? ' (mayoreo)' : ''}`);
  }

  console.log('\n5. Registrando ventas de los últimos 30 días...');
  const clientesRegulares = clientesCreados.filter((c) => !c.esMayoreo);
  let ventasCreadas = 0;
  for (let i = 0; i < 18; i++) {
    const producto = productosCreados[Math.floor(Math.random() * productosCreados.length)];
    const conCliente = Math.random() > 0.4;
    const cliente = conCliente ? clientesRegulares[Math.floor(Math.random() * clientesRegulares.length)] : null;
    const diasAtras = Math.floor(Math.random() * 30);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    const saleDate = fecha.toISOString().split('T')[0];

    try {
      await api('POST', '/sales', {
        productId: producto._id,
        clientId: cliente?._id,
        quantity: 1 + Math.floor(Math.random() * 4),
        saleDate,
      });
      ventasCreadas++;
    } catch (err) {
      // Si un producto se queda sin stock por el aleatorio, simplemente se omite esa venta
      console.log(`   (omitida: ${err.message})`);
    }
  }
  console.log(`   ${ventasCreadas} ventas registradas`);

  console.log('\n6. Registrando movimientos de crédito de ejemplo...');
  const [abarrotes, distribuidora, minisuper, tortilleria] = clientesCreados.filter((c) => c.esMayoreo);

  // Abarrotes La Esquina: un par de compras a crédito
  await api('POST', `/credits/${abarrotes._id}/cargo`, { amount: 1200, description: 'Pedido semanal de mayoreo' });
  await api('POST', `/credits/${abarrotes._id}/cargo`, { amount: 800, description: 'Pedido de refrescos y snacks' });

  // Distribuidora del Valle: compra grande + abono parcial
  await api('POST', `/credits/${distribuidora._id}/cargo`, { amount: 6000, description: 'Pedido mensual grande' });
  await api('POST', `/credits/${distribuidora._id}/abono`, { amount: 2000, description: 'Pago parcial en efectivo' });

  // Minisuper Don Beto: cerca de su límite (para ver la barra en rojo/amarillo)
  await api('POST', `/credits/${minisuper._id}/cargo`, { amount: 2600, description: 'Pedido de temporada' });

  // Tortillería La Reyna: otra compra a crédito
  await api('POST', `/credits/${tortilleria._id}/cargo`, { amount: 3000, description: 'Pedido de insumos' });

  console.log('   Movimientos de crédito de ejemplo registrados');

  console.log('\n✅ Listo. Datos de demostración creados.');
  console.log(`\n   Inicia sesión con:`);
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error('\n❌ Error al sembrar datos:', err.message);
  process.exit(1);
});

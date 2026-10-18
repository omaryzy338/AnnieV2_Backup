import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TicketCard } from '@/components/TicketCard';
import {
  aviso,
  Avatar,
  Banner,
  Button,
  Card,
  Chip,
  DateField,
  ErrorView,
  LoadingView,
  ProductImage,
  Row,
  Screen,
  Segmented,
  SelectModal,
  Stepper,
  Text,
  TextField,
  type Opcion,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { fullName, initials, money, parseAmount } from '@/lib/format';
import { useClients, useCrearVenta, useProducts, useProfile } from '@/lib/queries';
import { compartirTicket, imprimirTicket } from '@/lib/ticketAcciones';
import type { Client, DiscountType, PaymentMethod, Product, Sale } from '@/lib/types';
import { billetesSugeridos, calcularCambio, calcularTotal, creditoDisponible, fechaParaEnviar, round2 } from '@/lib/ventas';
import { colors, radius, spacing } from '@/theme';

export default function NuevaVentaScreen() {
  const params = useLocalSearchParams<{ productId?: string }>();
  const productos = useProducts();
  const clientes = useClients();

  if (productos.isPending || clientes.isPending) return <LoadingView />;
  if (productos.isError || clientes.isError) {
    return (
      <ErrorView
        mensaje={mensajeError(productos.error ?? clientes.error)}
        onRetry={() => {
          productos.refetch();
          clientes.refetch();
        }}
      />
    );
  }
  return <FormularioVenta productos={productos.data} clientes={clientes.data} productIdInicial={params.productId} />;
}

function FormularioVenta({ productos, clientes, productIdInicial }: { productos: Product[]; clientes: Client[]; productIdInicial?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const perfil = useProfile();
  const crearVenta = useCrearVenta();

  // Si se llegó desde un producto ("Vender"), se preselecciona con su descuento
  const inicial = productos.find((p) => p._id === productIdInicial);
  const [productId, setProductId] = useState(inicial?._id ?? '');
  const [cantidad, setCantidad] = useState(1);
  const [clientId, setClientId] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<DiscountType>('porcentaje');
  const [descuentoTxt, setDescuentoTxt] = useState(inicial?.discount ? String(inicial.discount) : '');
  const [otraFecha, setOtraFecha] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [metodo, setMetodo] = useState<PaymentMethod>('efectivo');
  const [pagaConTxt, setPagaConTxt] = useState('');
  const [modal, setModal] = useState<'producto' | 'cliente' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrada, setRegistrada] = useState<Sale | null>(null);

  const producto = productos.find((p) => p._id === productId) ?? null;
  const cliente = clientes.find((c) => c._id === clientId) ?? null;
  const disponible = creditoDisponible(cliente);

  const descuento = descuentoTxt.trim() ? parseAmount(descuentoTxt) : 0;
  const total = producto ? calcularTotal(producto.price, cantidad, Number.isNaN(descuento) ? 0 : descuento, tipoDescuento) : 0;
  const pagaCon = pagaConTxt.trim() ? parseAmount(pagaConTxt) : total;
  const cambio = calcularCambio(total, Number.isNaN(pagaCon) ? 0 : pagaCon);
  const ganancia = producto?.cost && producto.cost > 0 ? round2(total - producto.cost * cantidad) : null;

  const opcionesProducto: Opcion[] = useMemo(
    () =>
      productos.map((p) => ({
        value: p._id,
        label: p.name,
        sublabel: `${money(p.price)} · ${p.quantity < 1 ? 'Sin stock' : `${p.quantity} ${p.unit || 'uds.'} disponibles`}`,
        searchText: `${p.brand ?? ''} ${p.category ?? ''}`,
        left: <ProductImage uri={p.image} size={40} />,
        disabled: p.quantity < 1,
      })),
    [productos]
  );

  const opcionesCliente: Opcion[] = useMemo(
    () => [
      { value: '', label: 'Sin cliente', sublabel: 'Venta al público en general', left: <Avatar text="—" size={40} color={colors.textMuted} /> },
      ...clientes.map((c) => ({
        value: c._id,
        label: fullName(c),
        sublabel: c.esMayoreo ? `Crédito disponible: ${money(creditoDisponible(c))}` : c.phone || c.email || undefined,
        searchText: `${c.phone ?? ''} ${c.email ?? ''} ${c.rfc ?? ''}`,
        left: <Avatar text={initials(c)} size={40} />,
      })),
    ],
    [clientes]
  );

  const elegirProducto = (id: string) => {
    const p = productos.find((x) => x._id === id);
    setProductId(id);
    setCantidad(1);
    setTipoDescuento('porcentaje');
    setDescuentoTxt(p?.discount ? String(p.discount) : '');
    setError(null);
  };

  const elegirCliente = (id: string) => {
    setClientId(id);
    const c = clientes.find((x) => x._id === id);
    if (!c?.esMayoreo) setMetodo('efectivo');
    setError(null);
  };

  const reiniciar = () => {
    setProductId('');
    setCantidad(1);
    setClientId('');
    setTipoDescuento('porcentaje');
    setDescuentoTxt('');
    setOtraFecha(false);
    setFecha(new Date());
    setMetodo('efectivo');
    setPagaConTxt('');
    setError(null);
    setRegistrada(null);
  };

  const validar = (): string | null => {
    if (!producto) return 'Elige un producto.';
    if (cantidad < 1) return 'La cantidad debe ser al menos 1.';
    if (cantidad > producto.quantity) return `Stock insuficiente. Disponible: ${producto.quantity}.`;
    if (Number.isNaN(descuento) || descuento < 0) return 'El descuento no es válido.';
    if (tipoDescuento === 'porcentaje' && descuento > 100) return 'El descuento no puede ser mayor a 100%.';
    if (metodo === 'efectivo') {
      if (Number.isNaN(pagaCon)) return 'El monto con el que paga no es válido.';
      if (pagaCon < total) return `El pago es menor al total. Faltan ${money(total - pagaCon)}.`;
    } else {
      if (!cliente?.esMayoreo) return 'Solo los clientes con crédito pueden pagar a crédito.';
      if (total > disponible) return `Crédito insuficiente. Disponible: ${money(disponible)}.`;
    }
    return null;
  };

  const cobrar = async () => {
    const e = validar();
    setError(e);
    if (e || !producto) return;
    try {
      const res = await crearVenta.mutateAsync({
        productId: producto._id,
        quantity: cantidad,
        clientId: clientId || undefined,
        discount: descuento,
        discountType: tipoDescuento,
        saleDate: fechaParaEnviar(otraFecha ? fecha : new Date()),
        paymentMethod: metodo,
        amountPaid: metodo === 'efectivo' ? pagaCon : undefined,
      });
      setRegistrada(res.sale);
    } catch (err) {
      setError(mensajeError(err, 'Error al registrar la venta'));
    }
  };

  const accionTicket = async (accion: 'imprimir' | 'compartir') => {
    if (!registrada) return;
    try {
      if (accion === 'imprimir') await imprimirTicket(registrada, perfil.data?.business);
      else await compartirTicket(registrada, perfil.data?.business);
    } catch (err) {
      aviso('No se pudo generar el ticket', mensajeError(err));
    }
  };

  // ── Venta registrada ──────────────────────────────────────────
  if (registrada) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Venta registrada' }} />
        <View style={styles.exito}>
          <View style={styles.exitoIcono}>
            <Ionicons name="checkmark" size={34} color={colors.white} />
          </View>
          <Text variant="heading">¡Venta registrada!</Text>
          {registrada.paymentMethod === 'efectivo' && (registrada.change ?? 0) > 0 ? (
            <Text variant="body" align="center">
              Entrega de cambio <Text variant="body" weight="bold">{money(registrada.change)}</Text>
            </Text>
          ) : null}
        </View>
        <TicketCard venta={registrada} />
        <Row>
          <Button title="Imprimir" icon="print-outline" variant="secondary" onPress={() => accionTicket('imprimir')} style={{ flex: 1 }} />
          <Button title="Compartir" icon="share-outline" variant="secondary" onPress={() => accionTicket('compartir')} style={{ flex: 1 }} />
        </Row>
        <Button title="Nueva venta" icon="add" onPress={reiniciar} size="lg" />
        <Button title="Listo" variant="ghost" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Screen>
    );
  }

  // ── Formulario ────────────────────────────────────────────────
  if (!productos.length) {
    return (
      <Screen>
        <Card>
          <Text variant="subheading" align="center">
            Primero registra un producto
          </Text>
          <Text variant="caption" align="center" style={{ marginVertical: spacing.sm }}>
            Para vender necesitas tener al menos un producto en tu inventario.
          </Text>
          <Button title="Agregar producto" icon="add" onPress={() => router.replace({ pathname: '/producto/[id]', params: { id: 'nuevo' } })} />
        </Card>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Screen bottomSpace={110}>
        {/* Producto */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="label" style={styles.label}>
            Producto *
          </Text>
          <Pressable onPress={() => setModal('producto')} style={styles.selector} accessibilityRole="button" accessibilityLabel={producto ? `Producto: ${producto.name}` : 'Elegir producto'} testID="venta-producto">
            {producto ? (
              <>
                <ProductImage uri={producto.image} size={52} />
                <View style={{ flex: 1 }}>
                  <Text variant="subheading" numberOfLines={2}>
                    {producto.name}
                  </Text>
                  <Text variant="caption">
                    {money(producto.price)} · Stock:{' '}
                    <Text variant="caption" weight="semibold" color={producto.quantity < 5 ? colors.danger : colors.success}>
                      {producto.quantity} {producto.unit || 'uds.'}
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.selectorIcono}>
                  <Ionicons name="cube-outline" size={22} color={colors.primary} />
                </View>
                <Text variant="body" weight="medium" color={colors.textMuted} style={{ flex: 1 }}>
                  Toca para elegir un producto
                </Text>
              </>
            )}
            <Ionicons name="chevron-down" size={20} color={colors.textSoft} />
          </Pressable>

          {producto && (
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="label" style={styles.label}>
                Cantidad
              </Text>
              <Stepper value={cantidad} onChange={setCantidad} min={1} max={producto.quantity} />
            </Row>
          )}
        </Card>

        {/* Cliente */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="label" style={styles.label}>
            Cliente (opcional)
          </Text>
          <Pressable onPress={() => setModal('cliente')} style={styles.selector} accessibilityRole="button" accessibilityLabel={cliente ? `Cliente: ${fullName(cliente)}` : 'Elegir cliente'}>
            <Avatar text={cliente ? initials(cliente) : '—'} size={40} color={cliente ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="medium">
                {cliente ? fullName(cliente) : 'Sin cliente'}
              </Text>
              {cliente?.esMayoreo ? <Text variant="caption">Crédito disponible: {money(disponible)}</Text> : null}
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSoft} />
          </Pressable>
        </Card>

        {/* Descuento y fecha */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="label" style={styles.label}>
            Descuento en esta venta
          </Text>
          <Segmented
            options={[
              { value: 'porcentaje', label: '% Porcentaje' },
              { value: 'fijo', label: '$ Monto fijo' },
            ]}
            value={tipoDescuento}
            onChange={(v) => {
              setTipoDescuento(v);
              setDescuentoTxt('');
            }}
          />
          <TextField
            value={descuentoTxt}
            onChangeText={setDescuentoTxt}
            placeholder="0"
            keyboardType="decimal-pad"
            prefix={tipoDescuento === 'porcentaje' ? '%' : '$'}
            accessibilityLabel="Descuento"
          />

          <Text variant="label" style={[styles.label, { marginTop: spacing.sm }]}>
            Fecha de la venta
          </Text>
          <Row gap={spacing.sm}>
            <Chip label="Hoy (ahora)" selected={!otraFecha} onPress={() => setOtraFecha(false)} icon="time-outline" />
            <Chip label="Otra fecha" selected={otraFecha} onPress={() => setOtraFecha(true)} icon="calendar-outline" />
          </Row>
          {otraFecha && <DateField value={fecha} onChange={setFecha} maximumDate={new Date()} />}
        </Card>

        {/* Pago */}
        <Card style={{ gap: spacing.md }}>
          <Text variant="label" style={styles.label}>
            Método de pago
          </Text>
          <Segmented
            options={[
              { value: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
              { value: 'credito', label: 'Crédito', icon: 'card-outline', disabled: !cliente?.esMayoreo },
            ]}
            value={metodo}
            onChange={(v) => {
              setMetodo(v);
              setPagaConTxt('');
              setError(null);
            }}
          />
          {!cliente?.esMayoreo && (
            <Text variant="caption">
              {cliente ? 'Este cliente no tiene crédito habilitado; solo puede pagar en efectivo.' : 'Para vender a crédito elige un cliente con crédito.'}
            </Text>
          )}

          {metodo === 'efectivo' ? (
            <>
              <TextField
                label="Paga con"
                value={pagaConTxt}
                onChangeText={setPagaConTxt}
                placeholder={total.toFixed(2)}
                keyboardType="decimal-pad"
                prefix="$"
                hint="Déjalo vacío si paga exacto."
                testID="venta-paga-con"
              />
              {total > 0 && (
                <Row gap={spacing.sm} style={{ flexWrap: 'wrap' }}>
                  <Chip label="Exacto" selected={!pagaConTxt} onPress={() => setPagaConTxt('')} />
                  {billetesSugeridos(total).map((b) => (
                    <Chip key={b} label={money(b).replace('.00', '')} selected={pagaConTxt === String(b)} onPress={() => setPagaConTxt(String(b))} />
                  ))}
                </Row>
              )}
            </>
          ) : (
            <View style={styles.creditoInfo}>
              <Text variant="body">
                Disponible: <Text weight="semibold">{money(disponible)}</Text>
              </Text>
              <Text variant="body" color={total > disponible ? colors.danger : colors.textMuted}>
                Después de esta venta: <Text weight="semibold">{money(Math.max(0, disponible - total))}</Text>
              </Text>
            </View>
          )}
        </Card>

        {error && <Banner tono="error">{error}</Banner>}

        {producto && ganancia !== null && (
          <Text variant="caption" align="center">
            Ganancia estimada de esta venta: <Text variant="caption" weight="semibold" color={ganancia >= 0 ? colors.success : colors.danger}>{money(ganancia)}</Text>
          </Text>
        )}
      </Screen>

      {/* Barra de cobro */}
      <View style={[styles.barra, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={{ flex: 1 }}>
          <Text variant="caption">Total</Text>
          <Text variant="title" color={colors.text} testID="venta-total">
            {money(total)}
          </Text>
          {metodo === 'efectivo' && producto ? (
            <Text variant="caption" weight="semibold" color={cambio < 0 ? colors.danger : colors.success} testID="venta-cambio">
              {cambio < 0 ? `Faltan ${money(-cambio)}` : `Cambio: ${money(cambio)}`}
            </Text>
          ) : null}
        </View>
        <Button
          title={metodo === 'credito' ? 'Cargar a crédito' : 'Cobrar'}
          icon="checkmark-circle"
          onPress={cobrar}
          loading={crearVenta.isPending}
          disabled={!producto}
          size="lg"
          style={{ minWidth: 160 }}
          testID="venta-cobrar"
        />
      </View>

      <SelectModal
        visible={modal === 'producto'}
        title="Elegir producto"
        options={opcionesProducto}
        selected={productId}
        onSelect={elegirProducto}
        onClose={() => setModal(null)}
        searchPlaceholder="Buscar producto, marca o categoría"
      />
      <SelectModal
        visible={modal === 'cliente'}
        title="Elegir cliente"
        options={opcionesCliente}
        selected={clientId}
        onSelect={elegirCliente}
        onClose={() => setModal(null)}
        searchPlaceholder="Buscar por nombre, teléfono o RFC"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  selectorIcono: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  creditoInfo: { backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  exito: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  exitoIcono: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});

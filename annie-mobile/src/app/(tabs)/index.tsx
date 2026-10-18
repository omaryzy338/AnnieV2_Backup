import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VentaItem } from '@/components/VentaItem';
import {
  Avatar,
  Banner,
  BarChart,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorView,
  HBarList,
  Kpi,
  KpiGrid,
  ListRow,
  LoadingView,
  ProductImage,
  Screen,
  SectionTitle,
  Text,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { mensajeError, resolveMediaUrl } from '@/lib/api';
import { money } from '@/lib/format';
import { useCreditSummary, useProducts, useProfile, useSales } from '@/lib/queries';
import { productosStockBajo, resumenMes, topProductos, totalDelDia, ventasPorDia } from '@/lib/reportes';
import { fechaVenta } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const ventas = useSales();
  const productos = useProducts();
  const perfil = useProfile();
  const credito = useCreditSummary();

  const datos = useMemo(() => {
    const lista = ventas.data ?? [];
    const recientes = [...lista].sort((a, b) => fechaVenta(b).getTime() - fechaVenta(a).getTime()).slice(0, 5);
    return {
      hoy: totalDelDia(lista),
      mes: resumenMes(lista),
      semana: ventasPorDia(lista, 7),
      top: topProductos(lista, 3),
      stockBajo: productosStockBajo(productos.data ?? []).slice(0, 5),
      recientes,
    };
  }, [ventas.data, productos.data]);

  if (ventas.isPending || productos.isPending) return <LoadingView />;
  if (ventas.isError || productos.isError) {
    return (
      <ErrorView
        mensaje={mensajeError(ventas.error ?? productos.error)}
        onRetry={() => {
          ventas.refetch();
          productos.refetch();
        }}
      />
    );
  }

  const negocio = perfil.data?.business;
  const perfilIncompleto = negocio && (!negocio.state || !negocio.city || !negocio.address);
  const refrescando = ventas.isRefetching || productos.isRefetching;
  const { mes } = datos;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen
        refreshing={refrescando}
        onRefresh={() => {
          ventas.refetch();
          productos.refetch();
          perfil.refetch();
          credito.refetch();
        }}
        contentContainerStyle={{ paddingTop: insets.top + spacing.md }}>
        <View style={styles.encabezado}>
          <View style={{ flex: 1 }}>
            <Text variant="caption">Hola, {user?.name ?? ''} 👋</Text>
            <Text variant="title" numberOfLines={1}>
              {negocio?.name ?? user?.businessName ?? 'Mi negocio'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/negocio')} accessibilityRole="button" accessibilityLabel="Mi negocio">
            <Avatar text={(negocio?.name ?? 'A').charAt(0).toUpperCase()} uri={resolveMediaUrl(negocio?.logo)} size={46} />
          </Pressable>
        </View>

        {perfilIncompleto && (
          <Banner
            tono="aviso"
            action={
              <Pressable onPress={() => router.push('/negocio')} accessibilityRole="link">
                <Text variant="body" weight="semibold" color={colors.warning}>
                  Completar ahora →
                </Text>
              </Pressable>
            }>
            Completa los datos de tu negocio (estado, ciudad y dirección) para que salgan en tus tickets.
          </Banner>
        )}

        <Button title="Nueva venta" icon="add-circle" size="lg" onPress={() => router.push('/venta/nueva')} />

        <KpiGrid>
          <Kpi icon="flash" label="Ventas de hoy" value={money(datos.hoy)} />
          <Kpi
            icon="calendar"
            label="Ventas del mes"
            value={money(mes.totalMes)}
            hint={mes.cambioPct !== null ? `${mes.cambioPct >= 0 ? '▲' : '▼'} ${Math.abs(mes.cambioPct).toFixed(1)}% vs mes anterior` : undefined}
            hintColor={mes.cambioPct !== null && mes.cambioPct < 0 ? colors.danger : colors.success}
          />
          <Kpi icon="receipt" label="Ticket promedio del mes" value={money(mes.ticketPromedio)} color={colors.warning} />
          <Kpi
            icon="card"
            label="Por cobrar (créditos)"
            value={money(credito.data?.totalPorCobrar ?? 0)}
            color={(credito.data?.totalPorCobrar ?? 0) > 0 ? colors.danger : colors.success}
          />
        </KpiGrid>

        <Card>
          <SectionTitle>Ventas de los últimos 7 días</SectionTitle>
          <BarChart data={datos.semana} resaltarMaximo />
        </Card>

        <Card>
          <SectionTitle>Productos más vendidos</SectionTitle>
          {datos.top.length ? (
            <HBarList
              data={datos.top.map((t) => ({ clave: t.id, etiqueta: t.nombre, valor: t.unidades, detalle: `Ingresos ${money(t.total)}` }))}
              formato={(n) => `${n} ${n === 1 ? 'vendido' : 'vendidos'}`}
            />
          ) : (
            <Text variant="caption">Aún no hay ventas registradas.</Text>
          )}
        </Card>

        <Card padded={false}>
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <SectionTitle
              action={
                <Pressable onPress={() => router.push('/productos')} accessibilityRole="link" hitSlop={8}>
                  <Text variant="label" weight="semibold" color={colors.primary}>
                    Ver inventario
                  </Text>
                </Pressable>
              }>
              Stock bajo
            </SectionTitle>
          </View>
          {datos.stockBajo.length ? (
            datos.stockBajo.map((p) => (
              <ListRow key={p._id} onPress={() => router.push({ pathname: '/producto/[id]', params: { id: p._id } })}>
                <ProductImage uri={p.image} size={40} />
                <Text variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                  {p.name}
                </Text>
                <View style={styles.stock}>
                  <Ionicons name="warning" size={13} color={colors.danger} />
                  <Text variant="caption" weight="semibold" color={colors.danger}>
                    {p.quantity} {p.unit || 'uds.'}
                  </Text>
                </View>
              </ListRow>
            ))
          ) : (
            <View style={{ padding: spacing.lg, paddingTop: 0 }}>
              <Text variant="caption">Todo tu inventario tiene existencias suficientes.</Text>
            </View>
          )}
        </Card>

        <Card padded={false}>
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <SectionTitle
              action={
                <Pressable onPress={() => router.push('/ventas')} accessibilityRole="link" hitSlop={8}>
                  <Text variant="label" weight="semibold" color={colors.primary}>
                    Ver todas
                  </Text>
                </Pressable>
              }>
              Últimas ventas
            </SectionTitle>
          </View>
          {datos.recientes.length ? (
            datos.recientes.map((v, i) => (
              <View key={v._id}>
                {i > 0 && <Divider />}
                <VentaItem venta={v} />
              </View>
            ))
          ) : (
            <EmptyState icon="cart-outline" title="Sin ventas todavía" message="Registra tu primera venta con el botón de arriba." />
          )}
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stock: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.dangerSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { VentaItem } from '@/components/VentaItem';
import { Card, Chip, Divider, EmptyState, ErrorView, Fab, Kpi, KpiGrid, LoadingView, SearchBar, Text } from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { money, plural } from '@/lib/format';
import { useSales } from '@/lib/queries';
import { buscarVentas, fechaVenta, filtrarPorPeriodo, round2, type Periodo } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'semana', texto: '7 días' },
  { valor: 'mes', texto: 'Este mes' },
  { valor: 'todo', texto: 'Todo' },
];

export default function VentasScreen() {
  const router = useRouter();
  const ventas = useSales();
  const [busqueda, setBusqueda] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const { lista, total, efectivo, credito } = useMemo(() => {
    const ordenadas = [...(ventas.data ?? [])].sort((a, b) => fechaVenta(b).getTime() - fechaVenta(a).getTime());
    const filtradas = buscarVentas(filtrarPorPeriodo(ordenadas, periodo), busqueda);
    const suma = (arr: typeof filtradas) => round2(arr.reduce((a, v) => a + v.total, 0));
    return {
      lista: filtradas,
      total: suma(filtradas),
      efectivo: suma(filtradas.filter((v) => v.paymentMethod !== 'credito')),
      credito: suma(filtradas.filter((v) => v.paymentMethod === 'credito')),
    };
  }, [ventas.data, periodo, busqueda]);

  if (ventas.isPending) return <LoadingView />;
  if (ventas.isError) return <ErrorView mensaje={mensajeError(ventas.error)} onRetry={() => ventas.refetch()} />;

  const sinVentas = (ventas.data ?? []).length === 0;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={lista}
        keyExtractor={(v) => v._id}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={ventas.isRefetching} onRefresh={() => {
          ventas.refetch();
        }} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <KpiGrid>
              <Kpi icon="cash" label={`Vendido (${PERIODOS.find((p) => p.valor === periodo)?.texto.toLowerCase()})`} value={money(total)} hint={plural(lista.length, 'venta')} />
              <Kpi icon="wallet" label="Efectivo / Crédito" value={money(efectivo)} hint={`Crédito: ${money(credito)}`} color={colors.success} />
            </KpiGrid>
            {!sinVentas && (
              <>
                <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por folio, producto o cliente" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                  {PERIODOS.map((p) => (
                    <Chip key={p.valor} label={p.texto} selected={periodo === p.valor} onPress={() => setPeriodo(p.valor)} />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ backgroundColor: colors.card, marginHorizontal: spacing.lg, borderTopLeftRadius: index === 0 ? 16 : 0, borderTopRightRadius: index === 0 ? 16 : 0, borderBottomLeftRadius: index === lista.length - 1 ? 16 : 0, borderBottomRightRadius: index === lista.length - 1 ? 16 : 0, overflow: 'hidden' }}>
            {index > 0 && <Divider />}
            <VentaItem venta={item} />
          </View>
        )}
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            {sinVentas ? (
              <EmptyState icon="cart-outline" title="Sin ventas todavía" message="Registra tu primera venta con el botón de abajo." />
            ) : (
              <EmptyState icon="search" title="Sin resultados" message={busqueda ? `No hay ventas que coincidan con "${busqueda}".` : 'No hay ventas en este período.'} />
            )}
          </Card>
        }
        ListFooterComponent={
          lista.length ? (
            <Text variant="caption" align="center" style={{ marginTop: spacing.md }}>
              {lista.length} de {plural((ventas.data ?? []).length, 'venta')}
            </Text>
          ) : undefined
        }
      />
      <Fab label="Nueva venta" onPress={() => router.push('/venta/nueva')} />
    </View>
  );
}

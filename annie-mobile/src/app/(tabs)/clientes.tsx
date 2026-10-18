import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Avatar, Badge, Card, Divider, EmptyState, ErrorView, Fab, Kpi, KpiGrid, ListRow, LoadingView, SearchBar, Text } from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { fullName, initials, money, plural } from '@/lib/format';
import { useClients, useSales } from '@/lib/queries';
import { round2 } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

export default function ClientesScreen() {
  const router = useRouter();
  const clientes = useClients();
  const ventas = useSales();
  const [busqueda, setBusqueda] = useState('');

  const lista = useMemo(() => clientes.data ?? [], [clientes.data]);

  // Compras y total gastado por cliente (a partir de las ventas)
  const estadisticas = useMemo(() => {
    const mapa = new Map<string, { compras: number; total: number }>();
    for (const v of ventas.data ?? []) {
      if (!v.client) continue;
      const e = mapa.get(v.client._id) ?? { compras: 0, total: 0 };
      e.compras += 1;
      e.total = round2(e.total + v.total);
      mapa.set(v.client._id, e);
    }
    return mapa;
  }, [ventas.data]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) => `${c.name} ${c.lastName ?? ''} ${c.email ?? ''} ${c.phone ?? ''} ${c.rfc ?? ''}`.toLowerCase().includes(q));
  }, [lista, busqueda]);

  if (clientes.isPending) return <LoadingView />;
  if (clientes.isError) return <ErrorView mensaje={mensajeError(clientes.error)} onRetry={() => clientes.refetch()} />;

  const conCredito = lista.filter((c) => c.esMayoreo);
  const porCobrar = round2(conCredito.reduce((a, c) => a + (c.saldo ?? 0), 0));

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtrados}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={clientes.isRefetching}
            onRefresh={() => {
              clientes.refetch();
              ventas.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          lista.length ? (
            <View style={{ padding: spacing.lg, gap: spacing.md }}>
              <KpiGrid>
                <Kpi icon="people" label="Clientes" value={String(lista.length)} />
                <Kpi icon="card" label={`Por cobrar (${plural(conCredito.length, 'cliente')} con crédito)`} value={money(porCobrar)} color={porCobrar > 0 ? colors.danger : colors.success} />
              </KpiGrid>
              <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre, teléfono, email o RFC" />
            </View>
          ) : (
            <View style={{ height: spacing.lg }} />
          )
        }
        renderItem={({ item: c, index }) => {
          const e = estadisticas.get(c._id);
          return (
            <View style={[styles.item, index === 0 && styles.primero, index === filtrados.length - 1 && styles.ultimo]}>
              {index > 0 && <Divider />}
              <ListRow
                onPress={() => router.push({ pathname: '/cliente/[id]', params: { id: c._id } })}
                accessibilityLabel={`${fullName(c)}${c.esMayoreo ? `, con crédito, debe ${money(c.saldo)}` : ''}`}
                right={
                  c.esMayoreo ? (
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Badge text="Crédito" color={colors.warning} />
                      <Text variant="caption" weight="semibold" color={(c.saldo ?? 0) > 0 ? colors.danger : colors.textMuted}>
                        Debe {money(c.saldo)}
                      </Text>
                    </View>
                  ) : undefined
                }>
                <Avatar text={initials(c)} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {fullName(c)}
                  </Text>
                  <Text variant="caption" numberOfLines={1}>
                    {c.phone || c.email || 'Sin datos de contacto'}
                  </Text>
                  <Text variant="caption" color={colors.primaryDark}>
                    {e ? `${plural(e.compras, 'compra')} · ${money(e.total)}` : 'Sin compras'}
                  </Text>
                </View>
              </ListRow>
            </View>
          );
        }}
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            {lista.length === 0 ? (
              <EmptyState icon="people-outline" title="Aún no tienes clientes" message="Agrega tu primer cliente con el botón de abajo." />
            ) : (
              <EmptyState icon="search" title="Sin resultados" message={`No hay clientes que coincidan con "${busqueda}".`} />
            )}
          </Card>
        }
      />
      <Fab label="Nuevo cliente" icon="person-add" onPress={() => router.push({ pathname: '/cliente/[id]', params: { id: 'nuevo' } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.card, marginHorizontal: spacing.lg, overflow: 'hidden' },
  primero: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  ultimo: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
});

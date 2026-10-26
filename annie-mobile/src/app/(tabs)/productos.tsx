import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, Divider, EmptyState, ErrorView, Fab, Kpi, KpiGrid, ListRow, LoadingView, ProductImage, SearchBar, Text } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { mensajeError } from '@/lib/api';
import { money, plural } from '@/lib/format';
import { useProducts } from '@/lib/queries';
import { colorStock, margen, valorInventario } from '@/lib/reportes';
import type { Product } from '@/lib/types';
import { STOCK_BAJO } from '@/lib/validacion';
import { colors, spacing } from '@/theme';

type Orden = 'recientes' | 'stock' | 'nombre' | 'precio';
const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'recientes', texto: 'Recientes' },
  { valor: 'stock', texto: 'Menor stock' },
  { valor: 'nombre', texto: 'A-Z' },
  { valor: 'precio', texto: 'Mayor precio' },
];

function ordenar(lista: Product[], orden: Orden) {
  const copia = [...lista];
  if (orden === 'stock') return copia.sort((a, b) => a.quantity - b.quantity);
  if (orden === 'nombre') return copia.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (orden === 'precio') return copia.sort((a, b) => b.price - a.price);
  return copia; // el backend ya los regresa del más reciente al más antiguo
}

export default function ProductosScreen() {
  const router = useRouter();
  // El empleado solo consulta el inventario: no agrega productos ni ve costos
  const { esDueno } = useAuth();
  const productos = useProducts();
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>('recientes');

  const lista = useMemo(() => productos.data ?? [], [productos.data]);
  const categorias = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of lista) if (p.category) conteo.set(p.category, (conteo.get(p.category) ?? 0) + 1);
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, [lista]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ordenar(
      lista.filter(
        (p) =>
          (!categoria || p.category === categoria) &&
          (!q || `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(q))
      ),
      orden
    );
  }, [lista, busqueda, categoria, orden]);

  if (productos.isPending) return <LoadingView />;
  if (productos.isError) return <ErrorView mensaje={mensajeError(productos.error)} onRetry={() => productos.refetch()} />;

  const stockBajo = lista.filter((p) => p.quantity < STOCK_BAJO).length;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={productos.isRefetching}
            onRefresh={() => {
              productos.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            {lista.length > 0 && (
              <>
                <KpiGrid>
                  <Kpi icon="cube" label="Productos" value={String(lista.length)} />
                  <Kpi icon="pricetags" label="Valor del inventario (precio de venta)" value={money(valorInventario(lista))} color={colors.success} />
                  <Kpi
                    icon="warning"
                    label={`Stock bajo (< ${STOCK_BAJO})`}
                    value={String(stockBajo)}
                    color={stockBajo > 0 ? colors.danger : colors.success}
                  />
                  <Kpi icon="grid" label="Categorías en uso" value={String(categorias.length)} color={colors.warning} />
                </KpiGrid>
                <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar producto o marca" />
                {categorias.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                    <Chip label={`Todos (${lista.length})`} selected={!categoria} onPress={() => setCategoria(null)} />
                    {categorias.map(([cat, n]) => (
                      <Chip key={cat} label={`${cat} (${n})`} selected={categoria === cat} onPress={() => setCategoria(categoria === cat ? null : cat)} />
                    ))}
                  </ScrollView>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
                  <Ionicons name="swap-vertical" size={16} color={colors.textMuted} />
                  {ORDENES.map((o) => (
                    <Chip key={o.valor} label={o.texto} selected={orden === o.valor} onPress={() => setOrden(o.valor)} />
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        }
        renderItem={({ item: p, index }) => {
          // Al empleado el backend no le manda el costo (margen() da null); se oculta de todos modos
          const m = esDueno ? margen(p) : null;
          return (
            <View style={[styles.item, index === 0 && styles.primero, index === filtrados.length - 1 && styles.ultimo]}>
              {index > 0 && <Divider />}
              <ListRow
                onPress={() => router.push({ pathname: '/producto/[id]', params: { id: p._id } })}
                accessibilityLabel={`${p.name}, ${money(p.price)}, stock ${p.quantity}`}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="subheading" weight="bold">
                      {money(p.price)}
                    </Text>
                    <View style={[styles.stock, { backgroundColor: `${colorStock(p.quantity)}1A` }]}>
                      <Text variant="caption" weight="semibold" color={colorStock(p.quantity)} style={{ fontSize: 11, lineHeight: 15 }}>
                        {p.quantity} {p.unit || 'uds.'}
                      </Text>
                    </View>
                  </View>
                }>
                <ProductImage uri={p.image} size={48} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="caption" numberOfLines={1}>
                    {[p.brand, p.category].filter(Boolean).join(' · ') || 'Sin categoría'}
                  </Text>
                  {m !== null && (
                    <Text variant="caption" color={m >= 0 ? colors.success : colors.danger}>
                      {m.toFixed(0)}% de margen
                    </Text>
                  )}
                </View>
              </ListRow>
            </View>
          );
        }}
        ListEmptyComponent={
          <Card style={{ marginHorizontal: spacing.lg }}>
            {lista.length === 0 ? (
              <EmptyState
                icon="cube-outline"
                title="Sin productos todavía"
                message={esDueno ? 'Agrega tu primer producto con el botón de abajo.' : 'Aún no hay productos. Pídele al dueño que los agregue.'}
              />
            ) : (
              <EmptyState icon="search" title="Sin resultados" message="No hay productos que coincidan con la búsqueda o la categoría." />
            )}
          </Card>
        }
        ListFooterComponent={
          filtrados.length ? (
            <Text variant="caption" align="center" style={{ marginTop: spacing.md }}>
              {filtrados.length} de {plural(lista.length, 'producto')}
            </Text>
          ) : undefined
        }
      />
      {esDueno && <Fab label="Agregar" onPress={() => router.push({ pathname: '/producto/[id]', params: { id: 'nuevo' } })} />}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.card, marginHorizontal: spacing.lg, overflow: 'hidden' },
  primero: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  ultimo: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  stock: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
});

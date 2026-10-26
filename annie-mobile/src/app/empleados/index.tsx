// Cuentas de los empleados del negocio (solo el dueño llega aquí).
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorView,
  Kpi,
  KpiGrid,
  ListRow,
  LoadingView,
  Row,
  SearchBar,
  SectionTitle,
  Text,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { fullName, initials } from '@/lib/format';
import { useEmpleados } from '@/lib/queries';
import { colors, radius, spacing } from '@/theme';

export default function EmpleadosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const empleados = useEmpleados();
  const [busqueda, setBusqueda] = useState('');

  // Activos primero y luego por nombre
  const lista = useMemo(
    () =>
      [...(empleados.data ?? [])].sort(
        (a, b) => Number(b.activo) - Number(a.activo) || fullName(a).localeCompare(fullName(b), 'es')
      ),
    [empleados.data]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((e) => `${e.name} ${e.lastName} ${e.email}`.toLowerCase().includes(q));
  }, [lista, busqueda]);

  if (empleados.isPending) return <LoadingView />;
  if (empleados.isError) return <ErrorView mensaje={mensajeError(empleados.error)} onRetry={() => empleados.refetch()} />;

  const activos = lista.filter((e) => e.activo).length;

  const encabezado = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      <KpiGrid>
        <Kpi icon="people" label="Empleados" value={String(lista.length)} />
        <Kpi icon="checkmark-circle" label="Activos" value={String(activos)} color={colors.success} />
        <Kpi icon="pause-circle" label="Inactivos" value={String(lista.length - activos)} color={colors.textMuted} />
      </KpiGrid>

      <Button title="Agregar empleado" icon="person-add" onPress={() => router.push({ pathname: '/empleados/[id]', params: { id: 'nuevo' } })} />

      {lista.length > 0 && <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o correo" />}
    </View>
  );

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(e) => e._id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={empleados.isRefetching}
          onRefresh={() => {
            empleados.refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={encabezado}
      renderItem={({ item: e, index }) => (
        <View style={[styles.item, index === 0 && styles.primero, index === filtrados.length - 1 && styles.ultimo]}>
          {index > 0 && <Divider />}
          <ListRow
            onPress={() => router.push({ pathname: '/empleados/[id]', params: { id: e._id } })}
            accessibilityLabel={`${fullName(e)}, ${e.activo ? 'activo' : 'inactivo'}`}
            right={<Badge text={e.activo ? 'Activo' : 'Inactivo'} color={e.activo ? colors.success : colors.textMuted} style={{ alignSelf: 'center' }} />}>
            <Avatar text={initials(e)} color={e.activo ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text variant="body" weight="semibold" numberOfLines={1}>
                {fullName(e)}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {e.email}
              </Text>
            </View>
          </ListRow>
        </View>
      )}
      ListEmptyComponent={
        <Card>
          {lista.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Aún no tienes empleados"
              message="Crea una cuenta para cada persona que te ayuda en el negocio: entra con su propio correo y contraseña."
            />
          ) : (
            <EmptyState icon="search" title="Sin resultados" message={`No hay empleados que coincidan con "${busqueda}".`} />
          )}
        </Card>
      }
      ListFooterComponent={<Permisos />}
    />
  );
}

/** Qué puede y qué no puede hacer un empleado (el backend lo aplica). */
function Permisos() {
  return (
    <Card style={{ gap: spacing.md, marginTop: spacing.lg }}>
      <SectionTitle>¿Qué puede hacer un empleado?</SectionTitle>
      <Row gap={spacing.sm} style={styles.permiso}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text variant="body" style={{ flex: 1 }}>
          <Text variant="body" weight="semibold">
            Puede:
          </Text>{' '}
          registrar ventas, ver productos e inventario, dar de alta y editar clientes y registrar abonos.
        </Text>
      </Row>
      <Row gap={spacing.sm} style={styles.permiso}>
        <Ionicons name="close-circle" size={18} color={colors.danger} />
        <Text variant="body" style={{ flex: 1 }}>
          <Text variant="body" weight="semibold">
            No puede:
          </Text>{' '}
          crear, editar o eliminar productos ni ver costos, cancelar ventas, eliminar clientes, cambiar créditos, ver
          reportes, editar el negocio ni administrar empleados.
        </Text>
      </Row>
      <Text variant="caption">Cada venta guarda quién la registró y aparece como “Atendió” en el ticket.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: { backgroundColor: colors.card, overflow: 'hidden' },
  primero: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  ultimo: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  permiso: { alignItems: 'flex-start' },
});

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorView,
  Kpi,
  KpiGrid,
  LoadingView,
  ProgressBar,
  Row,
  SearchBar,
  Text,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { fullName, initials, money } from '@/lib/format';
import { useCreditClients, useCreditSummary, useProfile } from '@/lib/queries';
import type { Client } from '@/lib/types';
import { sinRFCReal } from '@/lib/validacion';
import { creditoDisponible, porcentajeCreditoUsado } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

const colorUso = (pct: number) => (pct >= 100 ? colors.danger : pct >= 70 ? colors.warning : colors.success);

export default function CreditosScreen() {
  const router = useRouter();
  const clientes = useCreditClients();
  const resumen = useCreditSummary();
  const perfil = useProfile();
  const [busqueda, setBusqueda] = useState('');
  const insets = useSafeAreaInsets();

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = clientes.data ?? [];
    if (!q) return lista;
    return lista.filter((c) => `${c.name} ${c.lastName ?? ''} ${c.rfc ?? ''} ${c.razonSocial ?? ''}`.toLowerCase().includes(q));
  }, [clientes.data, busqueda]);

  if (clientes.isPending) return <LoadingView />;
  if (clientes.isError) return <ErrorView mensaje={mensajeError(clientes.error)} onRetry={() => clientes.refetch()} />;

  const sinRFC = sinRFCReal(perfil.data?.business);
  const r = resumen.data;

  const encabezado = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      {sinRFC && perfil.data && (
        <Banner
          tono="aviso"
          action={
            <Pressable onPress={() => router.push('/negocio')} accessibilityRole="link">
              <Text variant="body" weight="semibold" color={colors.warning}>
                Configurar RFC →
              </Text>
            </Pressable>
          }>
          Tu negocio no tiene un RFC real, así que no puedes dar crédito a clientes nuevos (sin RFC no puedes facturar).
        </Banner>
      )}

      <KpiGrid>
        <Kpi icon="cash" label="Total por cobrar" value={money(r?.totalPorCobrar)} color={colors.danger} />
        <Kpi icon="people" label="Clientes con crédito" value={String(r?.clientesCredito ?? clientes.data.length)} />
        <Kpi icon="wallet" label="Crédito disponible" value={money(r?.disponibleTotal)} color={colors.success} />
        <Kpi icon="alert-circle" label="Sobre su límite" value={String(r?.sobreLimite ?? 0)} color={(r?.sobreLimite ?? 0) > 0 ? colors.danger : colors.textMuted} />
      </KpiGrid>

      <Button
        title="Nuevo cliente de crédito"
        icon="person-add"
        disabled={sinRFC}
        onPress={() => router.push({ pathname: '/cliente/[id]', params: { id: 'nuevo', credito: '1' } })}
      />

      {clientes.data.length > 0 && <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre, RFC o razón social" />}
    </View>
  );

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(c) => c._id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + insets.bottom }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      refreshControl={
        <RefreshControl
          refreshing={clientes.isRefetching}
          onRefresh={() => {
            clientes.refetch();
            resumen.refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={encabezado}
      ListEmptyComponent={
        <Card>
          {clientes.data.length === 0 ? (
            <EmptyState icon="card-outline" title="Aún no hay clientes de crédito" message="Activa el crédito en un cliente o registra uno nuevo de mayoreo." />
          ) : (
            <EmptyState icon="search" title="Sin resultados" message={`No hay clientes que coincidan con "${busqueda}".`} />
          )}
        </Card>
      }
      renderItem={({ item: c }) => <TarjetaCredito cliente={c} onPress={() => router.push({ pathname: '/creditos/[id]', params: { id: c._id } })} />}
    />
  );
}

function TarjetaCredito({ cliente: c, onPress }: { cliente: Client; onPress: () => void }) {
  const pct = porcentajeCreditoUsado(c);
  const excede = (c.saldo ?? 0) > (c.limiteCredito ?? 0);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${fullName(c)}, debe ${money(c.saldo)} de ${money(c.limiteCredito)}`}>
      <Card style={[{ gap: spacing.md }, excede && { borderWidth: 1.5, borderColor: colors.danger }]}>
        <Row>
          <Avatar text={initials(c)} />
          <View style={{ flex: 1 }}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {fullName(c)}
            </Text>
            <Text variant="caption" numberOfLines={1}>
              {c.rfc}
            </Text>
          </View>
          <Badge text={c.tipoPersona === 'moral' ? 'Moral' : 'Física'} />
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Text variant="caption">Debe</Text>
            <Text variant="subheading" weight="bold" color={(c.saldo ?? 0) > 0 ? colors.danger : colors.text}>
              {money(c.saldo)}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="caption">Límite</Text>
            <Text variant="subheading">{money(c.limiteCredito)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption">Disponible</Text>
            <Text variant="subheading" color={colors.success}>
              {money(creditoDisponible(c))}
            </Text>
          </View>
        </Row>
        <ProgressBar pct={pct} color={colorUso(pct)} />
        {excede && (
          <Text variant="caption" weight="semibold" color={colors.danger}>
            Excede su límite de crédito
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

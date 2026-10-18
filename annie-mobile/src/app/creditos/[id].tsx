import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorView,
  LoadingView,
  ProgressBar,
  Row,
  Screen,
  SectionTitle,
  Segmented,
  Text,
  TextField,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { formatDateTime, fullName, money, parseAmount } from '@/lib/format';
import { validarMovimiento } from '@/lib/formularios';
import { useMovimientoCredito, useMovimientos } from '@/lib/queries';
import { creditoDisponible, porcentajeCreditoUsado } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

export default function EstadoCuentaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const datos = useMovimientos(id);
  const registrar = useMovimientoCredito();
  const [tipo, setTipo] = useState<'abono' | 'cargo'>('abono');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [mensaje, setMensaje] = useState<{ tono: 'exito' | 'error'; texto: string } | null>(null);

  if (datos.isPending) return <LoadingView />;
  if (datos.isError) return <ErrorView mensaje={mensajeError(datos.error)} onRetry={() => datos.refetch()} />;

  const { client, movimientos } = datos.data;
  const saldo = client.saldo ?? 0;
  const disponible = creditoDisponible(client);
  const pct = porcentajeCreditoUsado(client);
  // Si el cliente no debe nada, el único movimiento posible es un cargo
  const tipoActual = saldo <= 0 ? 'cargo' : tipo;

  const onRegistrar = async () => {
    setMensaje(null);
    const err = validarMovimiento(tipoActual, monto, saldo, disponible);
    if (err) return setMensaje({ tono: 'error', texto: err });
    try {
      const res = await registrar.mutateAsync({ clientId: id, tipo: tipoActual, amount: parseAmount(monto), description: concepto.trim() || undefined });
      setMonto('');
      setConcepto('');
      setMensaje({ tono: 'exito', texto: `${tipoActual === 'abono' ? 'Abono' : 'Cargo'} registrado. Nuevo saldo: ${money(res.saldo)}` });
      datos.refetch();
    } catch (e) {
      setMensaje({ tono: 'error', texto: mensajeError(e, 'Error al registrar el movimiento') });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: fullName(client) || 'Estado de cuenta' }} />
      <Screen
        refreshing={datos.isRefetching}
        onRefresh={() => {
          datos.refetch();
        }}>
        <Card style={{ gap: spacing.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Text variant="caption">Debe</Text>
              <Text variant="title" color={saldo > 0 ? colors.danger : colors.text}>
                {money(saldo)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="caption">Límite {money(client.limiteCredito)}</Text>
              <Text variant="body" weight="semibold" color={colors.success}>
                Disponible {money(disponible)}
              </Text>
            </View>
          </Row>
          <ProgressBar pct={pct} color={pct >= 100 ? colors.danger : pct >= 70 ? colors.warning : colors.success} />
          <Text variant="caption">
            {client.rfc} · Persona {client.tipoPersona === 'moral' ? 'moral' : 'física'}
          </Text>
          <Button
            title="Editar cliente"
            icon="create-outline"
            variant="ghost"
            size="sm"
            onPress={() => router.push({ pathname: '/cliente/[id]', params: { id } })}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <SectionTitle>Registrar movimiento</SectionTitle>
          <Segmented
            options={[
              { value: 'abono', label: 'Abono (pago)', icon: 'arrow-down-circle-outline', disabled: saldo <= 0 },
              { value: 'cargo', label: 'Cargo (compra)', icon: 'arrow-up-circle-outline' },
            ]}
            value={tipoActual}
            onChange={(v) => {
              setTipo(v);
              setMensaje(null);
            }}
          />
          <TextField
            label="Monto"
            required
            value={monto}
            onChangeText={setMonto}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
            hint={tipoActual === 'abono' ? `Debe ${money(saldo)}` : `Disponible ${money(disponible)}`}
          />
          {tipoActual === 'abono' && (
            <Button title={`Liquidar todo (${money(saldo)})`} variant="ghost" size="sm" onPress={() => setMonto(saldo.toFixed(2))} />
          )}
          <TextField
            label="Concepto (opcional)"
            value={concepto}
            onChangeText={setConcepto}
            placeholder={tipoActual === 'abono' ? 'Ej: Pago en efectivo' : 'Ej: Pedido de mayoreo'}
          />
          {mensaje && <Banner tono={mensaje.tono}>{mensaje.texto}</Banner>}
          <Button
            title={tipoActual === 'cargo' ? 'Registrar cargo' : 'Registrar abono'}
            icon="checkmark"
            onPress={onRegistrar}
            loading={registrar.isPending}
          />
        </Card>

        <Card padded={false}>
          <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
            <SectionTitle>Movimientos</SectionTitle>
          </View>
          {movimientos.length === 0 ? (
            <EmptyState icon="document-text-outline" title="Sin movimientos todavía" />
          ) : (
            movimientos.map((m, i) => {
              const cargo = m.type === 'cargo';
              return (
                <View key={m._id}>
                  {i > 0 && <Divider />}
                  <Row style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
                    <Ionicons name={cargo ? 'arrow-up-circle' : 'arrow-down-circle'} size={28} color={cargo ? colors.danger : colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight="medium" numberOfLines={2}>
                        {m.description || (cargo ? 'Cargo' : 'Abono')}
                      </Text>
                      <Text variant="caption">{formatDateTime(m.createdAt)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="body" weight="bold" color={cargo ? colors.danger : colors.success}>
                        {cargo ? '+' : '−'}
                        {money(m.amount)}
                      </Text>
                      <Text variant="caption">Saldo {money(m.saldoDespues)}</Text>
                    </View>
                  </Row>
                </View>
              );
            })
          )}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

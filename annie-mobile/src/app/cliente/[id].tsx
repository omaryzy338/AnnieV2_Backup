import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Switch, View } from 'react-native';

import {
  aviso,
  Avatar,
  Banner,
  Button,
  Card,
  confirmar,
  ErrorView,
  LoadingView,
  ProgressBar,
  Row,
  Screen,
  Segmented,
  Text,
  TextField,
} from '@/components/ui';
import { mensajeError } from '@/lib/api';
import { formatDate, fullName, initials, money, plural } from '@/lib/format';
import { camposACliente, clienteACampos, clienteVacio, validarCliente, type CamposCliente, type Errores } from '@/lib/formularios';
import { useClients, useEliminarCliente, useGuardarCliente, useProfile, useSales } from '@/lib/queries';
import type { Client } from '@/lib/types';
import { sinRFCReal, validarRFC } from '@/lib/validacion';
import { creditoDisponible, fechaVenta, porcentajeCreditoUsado, round2 } from '@/lib/ventas';
import { colors, spacing } from '@/theme';

export default function ClienteFormScreen() {
  const { id, credito } = useLocalSearchParams<{ id: string; credito?: string }>();
  const clientes = useClients();

  // Desde Créditos se llega con ?credito=1 para registrar un cliente de mayoreo
  if (id === 'nuevo') return <ClienteForm id={id} existente={null} conCredito={credito === '1'} />;
  if (clientes.isPending) return <LoadingView />;
  if (clientes.isError) return <ErrorView mensaje={mensajeError(clientes.error)} onRetry={() => clientes.refetch()} />;
  const existente = clientes.data.find((c) => c._id === id);
  if (!existente) return <ErrorView mensaje="Este cliente ya no existe." />;
  return <ClienteForm key={id} id={id} existente={existente} />;
}

function ClienteForm({ id, existente, conCredito = false }: { id: string; existente: Client | null; conCredito?: boolean }) {
  const esNuevo = !existente;
  const router = useRouter();
  const ventas = useSales();
  const perfil = useProfile();
  const guardar = useGuardarCliente();
  const eliminar = useEliminarCliente();

  const [c, setC] = useState<CamposCliente>(() => (existente ? clienteACampos(existente) : { ...clienteVacio, esMayoreo: conCredito }));
  const [errores, setErrores] = useState<Errores<keyof CamposCliente>>({});
  const [error, setError] = useState<string | null>(null);

  const estadisticas = useMemo(() => {
    const suyas = (ventas.data ?? []).filter((v) => v.client?._id === id);
    const ultima = suyas.reduce<Date | null>((max, v) => {
      const f = fechaVenta(v);
      return !max || f > max ? f : max;
    }, null);
    return { compras: suyas.length, total: round2(suyas.reduce((a, v) => a + v.total, 0)), ultima };
  }, [ventas.data, id]);

  const set = <K extends keyof CamposCliente>(campo: K, valor: CamposCliente[K]) => {
    setC((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const saldo = existente?.saldo ?? 0;
  const negocioSinRFC = sinRFCReal(perfil.data?.business);
  // Solo se exige el RFC del negocio para ACTIVAR el crédito (igual que el backend)
  const puedeActivarCredito = !negocioSinRFC || !!existente?.esMayoreo;
  const puedeQuitarCredito = saldo <= 0;

  const onGuardar = async () => {
    setError(null);
    const e = validarCliente(c, saldo);
    setErrores(e);
    if (Object.keys(e).length) return setError('Revisa los campos marcados.');
    try {
      await guardar.mutateAsync({ id: esNuevo ? undefined : id, datos: camposACliente(c) });
      router.back();
    } catch (err) {
      setError(mensajeError(err, 'Error al guardar el cliente'));
    }
  };

  const onEliminar = async () => {
    if (saldo > 0) {
      aviso('No se puede eliminar', `El cliente tiene un saldo pendiente de ${money(saldo)}. Registra su pago antes de eliminarlo.`);
      return;
    }
    const ok = await confirmar('¿Eliminar cliente?', `Se eliminará a ${fullName(existente)}. Sus ventas anteriores se conservan como "Sin cliente". Esta acción no se puede deshacer.`, {
      textoConfirmar: 'Sí, eliminar',
      destructivo: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(id);
      router.back();
    } catch (err) {
      aviso('No se pudo eliminar', mensajeError(err));
    }
  };

  const rfcError = c.esMayoreo && c.rfc.trim() ? validarRFC(c.rfc, c.tipoPersona) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo cliente' : 'Cliente' }} />
      <Screen>
        {existente && (
          <Card style={{ gap: spacing.md }}>
            <Row>
              <Avatar text={initials(existente)} size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="heading" numberOfLines={1}>
                  {fullName(existente)}
                </Text>
                <Text variant="caption">
                  {estadisticas.compras
                    ? `${plural(estadisticas.compras, 'compra')} · ${money(estadisticas.total)}${estadisticas.ultima ? ` · Última: ${formatDate(estadisticas.ultima)}` : ''}`
                    : 'Sin compras todavía'}
                </Text>
              </View>
            </Row>
            {existente.esMayoreo && (
              <View style={{ gap: spacing.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text variant="caption">
                    Debe <Text variant="caption" weight="bold" color={saldo > 0 ? colors.danger : colors.text}>{money(saldo)}</Text> de {money(existente.limiteCredito)}
                  </Text>
                  <Text variant="caption">Disponible {money(creditoDisponible(existente))}</Text>
                </Row>
                <ProgressBar
                  pct={porcentajeCreditoUsado(existente)}
                  color={porcentajeCreditoUsado(existente) >= 100 ? colors.danger : porcentajeCreditoUsado(existente) >= 70 ? colors.warning : colors.success}
                />
                <Button
                  title="Estado de cuenta / registrar pago"
                  icon="document-text-outline"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push({ pathname: '/creditos/[id]', params: { id: existente._id } })}
                />
              </View>
            )}
          </Card>
        )}

        {error && <Banner tono="error">{error}</Banner>}

        <Card style={{ gap: spacing.lg }}>
          <TextField label="Nombre" required value={c.name} onChangeText={(t) => set('name', t)} placeholder="Ej: María" error={errores.name} />
          <TextField label="Apellido" value={c.lastName} onChangeText={(t) => set('lastName', t)} placeholder="Ej: Pérez" />
          <TextField label="Teléfono" value={c.phone} onChangeText={(t) => set('phone', t)} placeholder="Ej: 555 123 4567" keyboardType="phone-pad" />
          <TextField
            label="Correo electrónico"
            value={c.email}
            onChangeText={(t) => set('email', t)}
            placeholder="Ej: maria@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errores.email}
          />
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text variant="subheading">Cliente de mayoreo</Text>
              <Text variant="caption">Con línea de crédito (puede comprar fiado)</Text>
            </View>
            <Switch
              value={c.esMayoreo}
              onValueChange={(v) => set('esMayoreo', v)}
              disabled={(c.esMayoreo && !puedeQuitarCredito) || (!c.esMayoreo && !puedeActivarCredito)}
              trackColor={{ true: colors.primary, false: colors.borderStrong }}
              thumbColor={colors.white}
              accessibilityLabel="Cliente de mayoreo con crédito"
            />
          </Row>

          {!puedeActivarCredito && !c.esMayoreo && (
            <Banner
              tono="aviso"
              action={
                <Pressable onPress={() => router.push('/negocio')} accessibilityRole="link">
                  <Text variant="body" weight="semibold" color={colors.warning}>
                    Configurar RFC →
                  </Text>
                </Pressable>
              }>
              Para dar crédito necesitas registrar el RFC real de tu negocio (sin RFC no puedes facturar).
            </Banner>
          )}
          {c.esMayoreo && !puedeQuitarCredito && (
            <Text variant="caption">No se puede quitar el crédito mientras el cliente deba {money(saldo)}.</Text>
          )}

          {c.esMayoreo && (
            <>
              <Segmented
                options={[
                  { value: 'fisica', label: 'Persona física' },
                  { value: 'moral', label: 'Persona moral' },
                ]}
                value={c.tipoPersona}
                onChange={(v) => set('tipoPersona', v)}
              />
              <TextField
                label="RFC"
                required
                value={c.rfc}
                onChangeText={(t) => set('rfc', t.toUpperCase())}
                placeholder={c.tipoPersona === 'moral' ? '12 caracteres' : '13 caracteres'}
                autoCapitalize="characters"
                maxLength={13}
                error={errores.rfc ?? rfcError}
                hint={c.rfc.trim() && !rfcError ? 'RFC válido ✓' : undefined}
              />
              {c.tipoPersona === 'moral' && (
                <TextField label="Razón social" value={c.razonSocial} onChangeText={(t) => set('razonSocial', t)} placeholder="Ej: Distribuidora Ejemplo S.A. de C.V." />
              )}
              <TextField
                label="Límite de crédito"
                value={c.limiteCredito}
                onChangeText={(t) => set('limiteCredito', t)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix="$"
                error={errores.limiteCredito}
                hint="Lo máximo que el cliente puede deber."
              />
            </>
          )}
        </Card>

        <Button title={esNuevo ? 'Registrar cliente' : 'Guardar cambios'} icon="checkmark" size="lg" onPress={onGuardar} loading={guardar.isPending} />
        {!esNuevo && <Button title="Eliminar cliente" icon="trash-outline" variant="danger" onPress={onEliminar} loading={eliminar.isPending} />}
      </Screen>
    </KeyboardAvoidingView>
  );
}

// Alta y edición de la cuenta de un empleado (solo el dueño llega aquí).
import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, View } from 'react-native';

import { aviso, Banner, Button, Card, confirmar, ErrorView, LoadingView, Row, Screen, Text, TextField } from '@/components/ui';
import { useDesplazamientoTeclado } from '@/hooks/useDesplazamientoTeclado';
import { mensajeError } from '@/lib/api';
import { fullName } from '@/lib/format';
import { camposAEmpleado, empleadoACampos, empleadoVacio, validarEmpleado, type CamposEmpleado, type Errores } from '@/lib/formularios';
import { useEliminarEmpleado, useEmpleados, useGuardarEmpleado } from '@/lib/queries';
import type { Empleado } from '@/lib/types';
import { reglasPassword } from '@/lib/validacion';
import { colors, spacing } from '@/theme';

export default function EmpleadoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const empleados = useEmpleados();

  if (id === 'nuevo') return <EmpleadoForm id={id} existente={null} />;
  if (empleados.isPending) return <LoadingView />;
  if (empleados.isError) return <ErrorView mensaje={mensajeError(empleados.error)} onRetry={() => empleados.refetch()} />;
  const existente = empleados.data.find((e) => e._id === id);
  if (!existente) return <ErrorView mensaje="Este empleado ya no existe." />;
  return <EmpleadoForm key={id} id={id} existente={existente} />;
}

/** Lista de requisitos de la contraseña (las mismas reglas que el registro). */
function ReglasPassword({ password }: { password: string }) {
  return (
    <View style={{ gap: 4 }}>
      {reglasPassword(password).map((r) => (
        <View key={r.texto} style={styles.regla}>
          <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? colors.success : colors.textSoft} />
          <Text variant="caption" color={r.ok ? colors.success : colors.textMuted}>
            {r.texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

function EmpleadoForm({ id, existente }: { id: string; existente: Empleado | null }) {
  const desplazamientoTeclado = useDesplazamientoTeclado();
  const esNuevo = !existente;
  const router = useRouter();
  const guardar = useGuardarEmpleado();
  const eliminar = useEliminarEmpleado();

  const [c, setC] = useState<CamposEmpleado>(() => (existente ? empleadoACampos(existente) : empleadoVacio));
  const [errores, setErrores] = useState<Errores<keyof CamposEmpleado>>({});
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CamposEmpleado>(campo: K, valor: CamposEmpleado[K]) => {
    setC((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  // Al terminar se regresa a la lista (también si se llegó con un enlace directo)
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/empleados'));

  const onGuardar = async () => {
    setError(null);
    const e = validarEmpleado(c, esNuevo);
    setErrores(e);
    if (Object.keys(e).length) return setError('Revisa los campos marcados.');
    try {
      await guardar.mutateAsync({ id: esNuevo ? undefined : id, datos: camposAEmpleado(c, esNuevo) });
      volver();
    } catch (err) {
      setError(mensajeError(err, 'Error al guardar el empleado'));
    }
  };

  const onEliminar = async () => {
    const ok = await confirmar(
      '¿Eliminar empleado?',
      `Se eliminará la cuenta de ${fullName(existente)} y ya no podrá entrar a la app. Las ventas que registró se conservan con su nombre. Esta acción no se puede deshacer.`,
      { textoConfirmar: 'Sí, eliminar', destructivo: true }
    );
    if (!ok) return;
    try {
      await eliminar.mutateAsync(id);
      volver();
    } catch (err) {
      aviso('No se pudo eliminar', mensajeError(err));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={desplazamientoTeclado}>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo empleado' : 'Editar empleado' }} />
      <Screen>
        {esNuevo && (
          <Banner tono="info">Tu empleado entrará a la app con este correo y esta contraseña. Compártelos con él en persona.</Banner>
        )}
        {error && <Banner tono="error">{error}</Banner>}

        <Card style={{ gap: spacing.lg }}>
          <Text variant="subheading">Datos del empleado</Text>
          <TextField label="Nombre" required value={c.name} onChangeText={(t) => set('name', t)} placeholder="Ej: Luis" error={errores.name} />
          <TextField label="Apellido" required value={c.lastName} onChangeText={(t) => set('lastName', t)} placeholder="Ej: Pérez" error={errores.lastName} />
          {esNuevo ? (
            <TextField
              label="Correo electrónico"
              required
              value={c.email}
              onChangeText={(t) => set('email', t)}
              placeholder="empleado@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
              error={errores.email}
            />
          ) : (
            <TextField label="Correo electrónico" value={c.email} editable={false} hint="El correo no se puede cambiar." />
          )}
        </Card>

        {!esNuevo && (
          <Card style={{ gap: spacing.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text variant="subheading">Acceso activo</Text>
                <Text variant="caption">{c.activo ? 'Puede entrar a la app y registrar ventas.' : 'No puede entrar a la app.'}</Text>
              </View>
              <Switch
                value={c.activo}
                onValueChange={(v) => set('activo', v)}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.white}
                accessibilityLabel="Acceso activo"
              />
            </Row>
            {existente?.activo && !c.activo && (
              <Text variant="caption" color={colors.warning}>
                Al guardar, su sesión se cerrará la próxima vez que use la app.
              </Text>
            )}
          </Card>
        )}

        <Card style={{ gap: spacing.lg }}>
          <View style={{ gap: 2 }}>
            <Text variant="subheading">{esNuevo ? 'Contraseña' : 'Cambiar contraseña'}</Text>
            {!esNuevo && <Text variant="caption">Déjala vacía para conservar la actual.</Text>}
          </View>
          <TextField
            label={esNuevo ? 'Contraseña' : 'Nueva contraseña'}
            required={esNuevo}
            value={c.password}
            onChangeText={(t) => set('password', t)}
            placeholder="Mín. 8, una mayúscula, un número y un especial"
            password
            autoComplete="new-password"
            textContentType="newPassword"
            error={errores.password}
          />
          {esNuevo || c.password ? <ReglasPassword password={c.password} /> : null}
          <TextField
            label="Confirmar contraseña"
            required={esNuevo}
            value={c.confirmar}
            onChangeText={(t) => set('confirmar', t)}
            placeholder="Repite la contraseña"
            password
            autoComplete="new-password"
            error={errores.confirmar}
          />
        </Card>

        <Button title={esNuevo ? 'Crear empleado' : 'Guardar cambios'} icon="checkmark" size="lg" onPress={onGuardar} loading={guardar.isPending} />
        {!esNuevo && <Button title="Eliminar empleado" icon="trash-outline" variant="danger" onPress={onEliminar} loading={eliminar.isPending} />}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  regla: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

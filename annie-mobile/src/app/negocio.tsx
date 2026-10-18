import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import {
  aviso,
  Avatar,
  Banner,
  Button,
  Card,
  DateField,
  ErrorView,
  LoadingView,
  Row,
  Screen,
  SectionTitle,
  SelectModal,
  Text,
  TextField,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useDesplazamientoTeclado } from '@/hooks/useDesplazamientoTeclado';
import { mensajeError, resolveMediaUrl } from '@/lib/api';
import { isoLocalDate } from '@/lib/format';
import { elegirImagen, type Origen } from '@/lib/imagenes';
import { useGuardarNegocio, useGuardarPropietario, useProfile, useSubirLogo } from '@/lib/queries';
import type { Profile } from '@/lib/types';
import { ESTADOS_MEXICO, limpiarRFC, sinRFCReal, validarRFC } from '@/lib/validacion';
import { colors, radius, spacing } from '@/theme';

type Negocio = { name: string; category: string; state: string; city: string; address: string; phone: string; rfc: string; description: string };
type Propietario = { name: string; lastName: string; birthDate: Date | null; state: string; city: string };
type Aviso = { tono: 'exito' | 'error'; texto: string } | null;

// La fecha de nacimiento se guarda como "YYYY-MM-DD" a medianoche UTC
const fechaDesdeUTC = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function SelectorEstado({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" style={styles.label}>
        Estado
      </Text>
      <Pressable onPress={() => setAbierto(true)} style={styles.selector} accessibilityRole="button" accessibilityLabel={`Estado: ${value || 'sin elegir'}`}>
        <Text variant="body" weight="medium" color={value ? colors.text : colors.textSoft} style={{ flex: 1 }}>
          {value || 'Selecciona el estado'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSoft} />
      </Pressable>
      <SelectModal
        visible={abierto}
        title="Estado"
        options={ESTADOS_MEXICO.map((e) => ({ value: e, label: e }))}
        selected={value}
        onSelect={onChange}
        onClose={() => setAbierto(false)}
        searchPlaceholder="Buscar estado"
      />
    </View>
  );
}

export default function NegocioScreen() {
  const perfil = useProfile();
  if (perfil.isPending) return <LoadingView />;
  if (perfil.isError) return <ErrorView mensaje={mensajeError(perfil.error)} onRetry={() => perfil.refetch()} />;
  return <NegocioForm perfil={perfil.data} />;
}

function NegocioForm({ perfil }: { perfil: Profile }) {
  const desplazamientoTeclado = useDesplazamientoTeclado();
  const { actualizarUsuario } = useAuth();
  const guardarNegocio = useGuardarNegocio();
  const guardarPropietario = useGuardarPropietario();
  const subirLogo = useSubirLogo();
  const business = perfil.business;
  const user = perfil.user;

  const [negocio, setNegocio] = useState<Negocio>(() => ({
    name: business?.name ?? '',
    category: business?.category ?? '',
    state: business?.state ?? '',
    city: business?.city ?? '',
    address: business?.address ?? '',
    phone: business?.phone ?? '',
    // Si el RFC es el genérico se muestra vacío para que capture el real
    rfc: sinRFCReal(business) ? '' : (business?.rfc ?? ''),
    description: business?.description ?? '',
  }));
  const [propietario, setPropietario] = useState<Propietario>(() => ({
    name: user.name ?? '',
    lastName: user.lastName ?? '',
    birthDate: fechaDesdeUTC(user.birthDate),
    state: user.state ?? '',
    city: user.city ?? '',
  }));
  const [avisoNegocio, setAvisoNegocio] = useState<Aviso>(null);
  const [avisoPropietario, setAvisoPropietario] = useState<Aviso>(null);
  const [rfcError, setRfcError] = useState<string | null>(null);

  const setN = (campo: keyof Negocio) => (v: string) => setNegocio((prev) => ({ ...prev, [campo]: campo === 'rfc' ? v.toUpperCase() : v }));
  const setP = <K extends keyof Propietario>(campo: K, v: Propietario[K]) => setPropietario((prev) => ({ ...prev, [campo]: v }));

  const cambiarLogo = async (origen: Origen) => {
    try {
      const archivo = await elegirImagen(origen, { limiteMB: 3 });
      if (!archivo) return;
      await subirLogo.mutateAsync(archivo);
      setAvisoNegocio({ tono: 'exito', texto: 'Logo actualizado correctamente.' });
    } catch (err) {
      aviso('No se pudo subir el logo', mensajeError(err));
    }
  };

  const onGuardarNegocio = async () => {
    setAvisoNegocio(null);
    if (!negocio.name.trim()) return setAvisoNegocio({ tono: 'error', texto: 'El nombre del negocio es obligatorio.' });
    const rfc = limpiarRFC(negocio.rfc);
    const err = rfc ? validarRFC(rfc) : null;
    setRfcError(err);
    if (err) return setAvisoNegocio({ tono: 'error', texto: err });
    try {
      const res = await guardarNegocio.mutateAsync({
        name: negocio.name.trim(),
        category: negocio.category.trim(),
        state: negocio.state,
        city: negocio.city.trim(),
        address: negocio.address.trim(),
        phone: negocio.phone.trim(),
        description: negocio.description.trim(),
        rfc,
        country: business?.country || 'Mexico',
      });
      await actualizarUsuario({ businessName: res.name });
      setAvisoNegocio({ tono: 'exito', texto: 'Datos del negocio actualizados.' });
    } catch (e) {
      setAvisoNegocio({ tono: 'error', texto: mensajeError(e, 'Error al guardar') });
    }
  };

  const onGuardarPropietario = async () => {
    setAvisoPropietario(null);
    if (!propietario.name.trim() || !propietario.lastName.trim())
      return setAvisoPropietario({ tono: 'error', texto: 'El nombre y el apellido son obligatorios.' });
    try {
      const res = await guardarPropietario.mutateAsync({
        name: propietario.name.trim(),
        lastName: propietario.lastName.trim(),
        birthDate: propietario.birthDate ? isoLocalDate(propietario.birthDate) : null,
        state: propietario.state,
        city: propietario.city.trim(),
        country: user.country || 'Mexico',
      });
      await actualizarUsuario({ name: res.name, lastName: res.lastName });
      setAvisoPropietario({ tono: 'exito', texto: 'Datos del propietario actualizados.' });
    } catch (e) {
      setAvisoPropietario({ tono: 'error', texto: mensajeError(e, 'Error al guardar') });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={desplazamientoTeclado}>
      <Screen>
        <Card style={{ gap: spacing.md, alignItems: 'center' }}>
          <View>
            <Avatar text={(business?.name ?? 'A').charAt(0).toUpperCase()} uri={resolveMediaUrl(business?.logo)} size={92} />
            {subirLogo.isPending && (
              <View style={styles.subiendo}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </View>
          <Text variant="heading" align="center">
            {business?.name}
          </Text>
          <Row gap={spacing.sm}>
            <Button title="Cambiar logo" icon="image-outline" variant="secondary" size="sm" onPress={() => cambiarLogo('galeria')} disabled={subirLogo.isPending} />
            {Platform.OS !== 'web' && (
              <Button title="Cámara" icon="camera-outline" variant="secondary" size="sm" onPress={() => cambiarLogo('camara')} disabled={subirLogo.isPending} />
            )}
          </Row>
        </Card>

        {sinRFCReal(business) && (
          <Banner tono="aviso">Tu negocio no tiene un RFC real. Sin RFC no puedes facturar y, por lo tanto, tampoco dar crédito a tus clientes. Agrégalo abajo.</Banner>
        )}

        <Card style={{ gap: spacing.lg }}>
          <SectionTitle>Información del negocio</SectionTitle>
          <TextField label="Nombre del negocio" required value={negocio.name} onChangeText={setN('name')} placeholder="Tienda El Sol" />
          <TextField label="Categoría" value={negocio.category} onChangeText={setN('category')} placeholder="Abarrotes, papelería, ropa..." />
          <TextField
            label="RFC del negocio"
            value={negocio.rfc}
            onChangeText={(t) => {
              setN('rfc')(t);
              setRfcError(null);
            }}
            placeholder="13 o 12 caracteres"
            autoCapitalize="characters"
            maxLength={13}
            error={rfcError}
            hint="Necesario para poder ofrecer crédito a tus clientes."
          />
          <TextField label="Teléfono" value={negocio.phone} onChangeText={setN('phone')} placeholder="555 123 4567" keyboardType="phone-pad" />
          <SelectorEstado value={negocio.state} onChange={setN('state')} />
          <TextField label="Ciudad" value={negocio.city} onChangeText={setN('city')} placeholder="Ej: Guadalajara" />
          <TextField label="Dirección" value={negocio.address} onChangeText={setN('address')} placeholder="Calle 5 de Mayo #10, Col. Centro" />
          <TextField label="Descripción" value={negocio.description} onChangeText={setN('description')} placeholder="¿A qué se dedica tu negocio?" multiline />
          {avisoNegocio && <Banner tono={avisoNegocio.tono}>{avisoNegocio.texto}</Banner>}
          <Button title="Guardar negocio" icon="checkmark" onPress={onGuardarNegocio} loading={guardarNegocio.isPending} />
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <SectionTitle>Datos del propietario</SectionTitle>
          <TextField label="Nombre" required value={propietario.name} onChangeText={(t) => setP('name', t)} placeholder="Juan" />
          <TextField label="Apellido" required value={propietario.lastName} onChangeText={(t) => setP('lastName', t)} placeholder="López García" />
          <DateField label="Fecha de nacimiento" value={propietario.birthDate} onChange={(d) => setP('birthDate', d)} maximumDate={new Date()} />
          <SelectorEstado value={propietario.state} onChange={(v) => setP('state', v)} />
          <TextField label="Ciudad" value={propietario.city} onChangeText={(t) => setP('city', t)} placeholder="Ej: Monterrey" />
          <TextField label="Correo electrónico" value={user.email} editable={false} hint="El correo no se puede cambiar." />
          {avisoPropietario && <Banner tono={avisoPropietario.tono}>{avisoPropietario.texto}</Banner>}
          <Button title="Guardar propietario" icon="checkmark" onPress={onGuardarPropietario} loading={guardarPropietario.isPending} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  subiendo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 46, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
});

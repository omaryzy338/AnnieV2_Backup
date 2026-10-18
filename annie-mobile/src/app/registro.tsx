import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { aviso, Banner, Button, Card, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { useDesplazamientoTeclado } from '@/hooks/useDesplazamientoTeclado';
import { api, mensajeError, type ArchivoLocal } from '@/lib/api';
import { elegirImagen } from '@/lib/imagenes';
import { CAMPOS_REGISTRO_VACIOS, limpiarRFC, reglasPassword, validarRegistro, type CamposRegistro } from '@/lib/validacion';
import { colors, radius, spacing } from '@/theme';

export default function RegistroScreen() {
  const desplazamientoTeclado = useDesplazamientoTeclado();
  const { registrarse } = useAuth();
  const [c, setC] = useState<CamposRegistro>(CAMPOS_REGISTRO_VACIOS);
  const [errores, setErrores] = useState<Partial<Record<keyof CamposRegistro, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<ArchivoLocal | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = (campo: keyof CamposRegistro) => (valor: string) => {
    setC((prev) => ({ ...prev, [campo]: campo === 'rfc' ? valor.toUpperCase() : valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const elegirLogo = async () => {
    try {
      const img = await elegirImagen('galeria', { limiteMB: 3 });
      if (img) setLogo(img);
    } catch (err) {
      aviso('No se pudo elegir la imagen', mensajeError(err));
    }
  };

  const crear = async () => {
    setError(null);
    const e = validarRegistro(c);
    setErrores(e);
    if (Object.keys(e).length) return setError('Revisa los campos marcados.');
    setEnviando(true);
    try {
      await registrarse({
        name: c.name.trim(),
        lastName: c.lastName.trim(),
        businessName: c.businessName.trim(),
        email: c.email,
        password: c.password,
        rfc: c.rfc ? limpiarRFC(c.rfc) : undefined,
      });
      // El logo es opcional: si falla, no se bloquea el registro
      if (logo) await api.upload('/profile/business/logo', 'logo', logo).catch(() => {});
    } catch (err) {
      setError(mensajeError(err, 'Error al crear la cuenta'));
      setEnviando(false);
    }
  };

  const reglas = reglasPassword(c.password);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={desplazamientoTeclado}>
      <Screen>
        <View style={{ gap: 4 }}>
          <Text variant="title">Crear cuenta</Text>
          <Text variant="caption">Empieza a gestionar tu negocio hoy</Text>
        </View>

        {error && <Banner tono="error">{error}</Banner>}

        <Card style={{ gap: spacing.lg }}>
          <Text variant="subheading">Tus datos</Text>
          <TextField label="Nombre" required value={c.name} onChangeText={set('name')} placeholder="Juan" error={errores.name} autoComplete="given-name" />
          <TextField label="Apellido" required value={c.lastName} onChangeText={set('lastName')} placeholder="García" error={errores.lastName} autoComplete="family-name" />
          <TextField
            label="Correo electrónico"
            required
            value={c.email}
            onChangeText={set('email')}
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errores.email}
          />
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <Text variant="subheading">Tu negocio</Text>
          <TextField label="Nombre del negocio" required value={c.businessName} onChangeText={set('businessName')} placeholder="Ej: Tienda El Sol" error={errores.businessName} />

          <View style={{ gap: 6 }}>
            <Text variant="label" style={styles.label}>
              Logo del negocio (opcional)
            </Text>
            <Pressable onPress={elegirLogo} style={styles.logoCaja} accessibilityRole="button" accessibilityLabel="Elegir logo del negocio">
              {logo ? (
                <Image source={{ uri: logo.uri }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={[styles.logo, styles.logoVacio]}>
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="medium">
                  {logo ? 'Cambiar imagen' : 'Toca para elegir una imagen'}
                </Text>
                <Text variant="caption">JPG, PNG o WebP · máx 3 MB</Text>
              </View>
            </Pressable>
          </View>

          <TextField
            label="RFC del negocio (opcional)"
            value={c.rfc}
            onChangeText={set('rfc')}
            placeholder="13 o 12 caracteres"
            autoCapitalize="characters"
            maxLength={13}
            error={errores.rfc}
            hint="Si lo dejas vacío se te asigna un RFC genérico. Necesitas uno real para dar crédito a tus clientes; puedes agregarlo después en Mi negocio."
          />
        </Card>

        <Card style={{ gap: spacing.lg }}>
          <Text variant="subheading">Contraseña</Text>
          <TextField
            label="Contraseña"
            required
            value={c.password}
            onChangeText={set('password')}
            placeholder="Mín. 8, una mayúscula, un número y un especial"
            password
            autoComplete="new-password"
            textContentType="newPassword"
            error={errores.password}
          />
          <View style={{ gap: 4 }}>
            {reglas.map((r) => (
              <View key={r.texto} style={styles.regla}>
                <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? colors.success : colors.textSoft} />
                <Text variant="caption" color={r.ok ? colors.success : colors.textMuted}>
                  {r.texto}
                </Text>
              </View>
            ))}
          </View>
          <TextField
            label="Confirmar contraseña"
            required
            value={c.confirmar}
            onChangeText={set('confirmar')}
            placeholder="Repite tu contraseña"
            password
            autoComplete="new-password"
            error={errores.confirmar}
          />
        </Card>

        <Banner tono="info">Tus datos están protegidos: la contraseña se guarda cifrada y nunca compartimos tu información.</Banner>

        <Button title={enviando ? 'Creando cuenta...' : 'Crear cuenta'} onPress={crear} loading={enviando} size="lg" />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  logoCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  logo: { width: 56, height: 56, borderRadius: radius.md },
  logoVacio: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  regla: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});

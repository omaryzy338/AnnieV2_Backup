import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Button, Text, TextField } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { getApiBaseUrl, mensajeError } from '@/lib/api';
import { EMAIL_REGEX } from '@/lib/validacion';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const entrar = async () => {
    setError(null);
    if (!email.trim() || !password) return setError('Escribe tu correo y tu contraseña.');
    if (!EMAIL_REGEX.test(email.trim())) return setError('El correo no tiene un formato válido.');
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
    } catch (err) {
      setError(mensajeError(err, 'Correo o contraseña incorrectos'));
      setEnviando(false);
    }
  };

  const servidor = getApiBaseUrl().replace(/^https?:\/\//, '');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.primary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.marca, { paddingTop: insets.top + 36 }]}>
          <Image
            source={require('@/assets/images/logo-horizontal-blanco.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="Annie"
          />
          <Text variant="body" color="rgba(255,255,255,0.9)" align="center">
            Gestión de ventas, inventario y clientes para tu negocio
          </Text>
        </View>

        <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={{ gap: 4 }}>
            <Text variant="title">Bienvenido de vuelta</Text>
            <Text variant="caption">Inicia sesión en tu cuenta</Text>
          </View>

          {error && <Banner tono="error">{error}</Banner>}

          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            testID="login-email"
          />
          <TextField
            ref={passwordRef}
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            password
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={entrar}
            testID="login-password"
          />

          <Button title={enviando ? 'Entrando...' : 'Iniciar sesión'} onPress={entrar} loading={enviando} size="lg" testID="login-submit" />

          <View style={styles.registro}>
            <Text variant="body" color={colors.textMuted}>
              ¿No tienes cuenta?
            </Text>
            <Link href="/registro" asChild>
              <Pressable accessibilityRole="link" hitSlop={8}>
                <Text variant="body" weight="semibold" color={colors.primary}>
                  Regístrate aquí
                </Text>
              </Pressable>
            </Link>
          </View>

          <Link href="/servidor" asChild>
            <Pressable style={styles.servidor} accessibilityRole="button" accessibilityLabel="Configurar servidor">
              <Ionicons name="server-outline" size={14} color={colors.textSoft} />
              <Text variant="caption" color={colors.textSoft} numberOfLines={1}>
                Servidor: {servidor || 'sin configurar'}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  marca: { alignItems: 'center', paddingHorizontal: spacing.xxl, paddingBottom: 36, gap: 8 },
  logo: { width: 210, height: 78 },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg + 12,
    borderTopRightRadius: radius.lg + 12,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  registro: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  servidor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 'auto', paddingTop: spacing.md },
});

// Piezas de diseño: tarjetas, pantallas con scroll, banners, estados vacíos,
// carga y error.
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: spacing.lg }, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.seccion}>
      <Text variant="subheading">{children}</Text>
      {action}
    </View>
  );
}

type ScreenProps = ScrollViewProps & {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Deja espacio abajo para un botón flotante o barra fija. */
  bottomSpace?: number;
};

/** Pantalla con scroll, fondo de la app y "jalar para actualizar". */
export function Screen({ children, refreshing, onRefresh, bottomSpace = 0, contentContainerStyle, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      style={styles.pantalla}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.contenido, { paddingBottom: spacing.xxl + bottomSpace + insets.bottom }, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

type Tono = 'error' | 'exito' | 'aviso' | 'info';
const tonos: Record<Tono, { bg: string; fg: string; icono: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: colors.dangerSoft, fg: colors.danger, icono: 'alert-circle' },
  exito: { bg: colors.successSoft, fg: colors.success, icono: 'checkmark-circle' },
  aviso: { bg: colors.warningSoft, fg: colors.warning, icono: 'warning' },
  info: { bg: colors.primarySoft, fg: colors.primaryDark, icono: 'information-circle' },
};

export function Banner({ tono = 'info', children, action }: { tono?: Tono; children: ReactNode; action?: ReactNode }) {
  const t = tonos[tono];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Ionicons name={t.icono} size={20} color={t.fg} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text variant="body" color={t.fg} weight="medium">
          {children}
        </Text>
        {action}
      </View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.vacio}>
      <View style={styles.vacioIcono}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text variant="subheading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="caption" align="center">
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

export function LoadingView({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text variant="caption">{texto}</Text>
    </View>
  );
}

export function ErrorView({ mensaje, onRetry }: { mensaje: string; onRetry?: () => void }) {
  return (
    <View style={styles.centro}>
      <View style={[styles.vacioIcono, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
      </View>
      <Text variant="subheading" align="center">
        No se pudo cargar la información
      </Text>
      <Text variant="caption" align="center" style={{ maxWidth: 320 }}>
        {mensaje}
      </Text>
      {onRetry && <Button title="Reintentar" icon="refresh" variant="secondary" onPress={onRetry} style={{ marginTop: 8 }} />}
    </View>
  );
}

export function Row({ children, gap = spacing.md, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divisor} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow },
  seccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  pantalla: { flex: 1, backgroundColor: colors.background },
  contenido: { padding: spacing.lg, gap: spacing.lg },
  banner: { flexDirection: 'row', gap: 10, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  vacio: { alignItems: 'center', gap: 8, paddingVertical: 36, paddingHorizontal: 24 },
  vacioIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, backgroundColor: colors.background },
  divisor: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
});

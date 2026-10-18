import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

const paleta: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.primarySoft, fg: colors.primaryDark, border: colors.primarySoft },
  ghost: { bg: 'transparent', fg: colors.primaryDark, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  success: { bg: colors.success, fg: colors.white, border: colors.success },
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, size = 'md', style, accessibilityLabel, testID }: Props) {
  const p = paleta[variant];
  const inactivo = disabled || loading;
  const alto = size === 'lg' ? 54 : size === 'sm' ? 38 : 48;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactivo, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border, minHeight: alto, paddingHorizontal: size === 'sm' ? 12 : 18 },
        pressed && !inactivo && { opacity: 0.85 },
        inactivo && { opacity: 0.55 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.contenido}>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={p.fg} />}
          <Text variant={size === 'sm' ? 'label' : 'subheading'} color={p.fg} weight="semibold">
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Botón redondo solo con ícono. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = colors.text,
  background = colors.card,
  size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, alignItems: 'center', justifyContent: 'center' },
        pressed && { opacity: 0.7 },
      ]}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

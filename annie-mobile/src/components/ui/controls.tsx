// Controles pequeños: chips, selector segmentado, tarjetas de indicadores,
// avatar, insignias, barra de progreso, buscador, botón flotante y contador.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow, spacing } from '@/theme';
import { Text } from './Text';

export function Chip({
  label,
  selected,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipActivo : null,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.45 },
      ]}>
      {icon && <Ionicons name={icon} size={15} color={selected ? colors.white : colors.textMuted} />}
      <Text variant="label" weight="semibold" color={selected ? colors.white : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmentado} accessibilityRole="tablist">
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            disabled={o.disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo, disabled: !!o.disabled }}
            style={[styles.segmento, activo && styles.segmentoActivo, o.disabled && { opacity: 0.4 }]}>
            {o.icon && <Ionicons name={o.icon} size={16} color={activo ? colors.primaryDark : colors.textMuted} />}
            <Text variant="label" weight="semibold" color={activo ? colors.primaryDark : colors.textMuted}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Kpi({
  icon,
  label,
  value,
  color = colors.primary,
  hint,
  hintColor,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
  hint?: string;
  hintColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.kpi, style]} accessible accessibilityLabel={`${label}: ${value}${hint ? `, ${hint}` : ''}`}>
      <View style={[styles.kpiIcono, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text variant="heading" weight="bold" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" numberOfLines={2}>
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" weight="semibold" color={hintColor ?? colors.textMuted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Rejilla de 2 columnas para indicadores. */
export function KpiGrid({ children }: { children: ReactNode }) {
  return <View style={styles.kpiGrid}>{children}</View>;
}

export function Avatar({ text, uri, size = 40, color = colors.primary }: { text: string; uri?: string | null; size?: number; color?: string }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}1F`, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="label" weight="bold" color={color} style={{ fontSize: size * 0.36, lineHeight: size * 0.5 }}>
        {text}
      </Text>
    </View>
  );
}

export function Badge({ text, color = colors.primary, soft = true, style }: { text: string; color?: string; soft?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft ? `${color}1A` : color }, style]}>
      <Text variant="caption" weight="semibold" color={soft ? color : colors.white} style={{ fontSize: 11, lineHeight: 15 }}>
        {text}
      </Text>
    </View>
  );
}

export function ProgressBar({ pct, color = colors.primary }: { pct: number; color?: string }) {
  const valor = Math.max(0, Math.min(100, pct));
  return (
    <View style={styles.barraFondo} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(valor) }}>
      <View style={[styles.barra, { width: `${valor}%`, backgroundColor: color }]} />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  return (
    <View style={styles.buscador}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        accessibilityLabel={placeholder}
        style={styles.buscadorInput}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Fab({ icon = 'add', label, onPress }: { icon?: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, { bottom: spacing.lg + Math.max(insets.bottom - 20, 0) }, pressed && { opacity: 0.9 }]}>
      <Ionicons name={icon} size={22} color={colors.white} />
      <Text variant="subheading" color={colors.white}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Stepper({ value, onChange, min = 1, max }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const puedeBajar = value > min;
  const puedeSubir = max === undefined || value < max;
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => puedeBajar && onChange(value - 1)}
        disabled={!puedeBajar}
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
        style={[styles.stepperBtn, !puedeBajar && { opacity: 0.35 }]}>
        <Ionicons name="remove" size={22} color={colors.primaryDark} />
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(t) => {
          const n = parseInt(t.replace(/\D/g, ''), 10);
          if (Number.isNaN(n)) return onChange(min);
          onChange(max !== undefined ? Math.min(n, max) : n);
        }}
        keyboardType="number-pad"
        accessibilityLabel="Cantidad"
        style={styles.stepperInput}
        selectTextOnFocus
      />
      <Pressable
        onPress={() => puedeSubir && onChange(value + 1)}
        disabled={!puedeSubir}
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        style={[styles.stepperBtn, !puedeSubir && { opacity: 0.35 }]}>
        <Ionicons name="add" size={22} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

/** Fila tocable de una lista (con flecha). */
export function ListRow({
  children,
  onPress,
  right,
  showChevron = true,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  right?: ReactNode;
  showChevron?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.fila, pressed && { backgroundColor: colors.background }]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>{children}</View>
      {right}
      {onPress && showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentado: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3, gap: 3 },
  segmento: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: radius.sm + 2,
  },
  segmentoActivo: { backgroundColor: colors.card, ...shadow },
  kpi: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md + 2, gap: 2, ...shadow },
  kpiIcono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buscadorInput: { flex: 1, minHeight: 46, fontSize: 15, fontFamily: fonts.regular, color: colors.text, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 27,
    ...shadow,
    shadowOpacity: 0.25,
    elevation: 6,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card },
  stepperBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepperInput: { width: 64, textAlign: 'center', fontSize: 18, fontFamily: fonts.bold, color: colors.text, paddingVertical: 8, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
});

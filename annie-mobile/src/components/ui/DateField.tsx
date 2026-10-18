// Selector de fecha: diálogo nativo en Android, calendario en una hoja en
// iOS y un <input type="date"> en web.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate, isoLocalDate } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  label?: string;
  value: Date | null;
  onChange: (d: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
};

const desdeISO = (txt: string) => {
  const [y, m, d] = txt.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

export function DateField({ label, value, onChange, maximumDate, minimumDate, placeholder = 'Elegir fecha' }: Props) {
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);
  const [temporal, setTemporal] = useState<Date>(value ?? new Date());

  const etiqueta = label ? (
    <Text variant="label" style={styles.label}>
      {label}
    </Text>
  ) : null;

  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: 6 }}>
        {etiqueta}
        {createElement('input', {
          type: 'date',
          'aria-label': label ?? placeholder,
          value: value ? isoLocalDate(value) : '',
          max: maximumDate ? isoLocalDate(maximumDate) : undefined,
          min: minimumDate ? isoLocalDate(minimumDate) : undefined,
          onChange: (e: { target: { value: string } }) => {
            const d = desdeISO(e.target.value);
            if (d) onChange(d);
          },
          style: {
            height: 48,
            borderRadius: radius.md,
            border: `1.5px solid ${colors.border}`,
            padding: '0 14px',
            fontFamily: fonts.medium,
            fontSize: 15,
            color: colors.text,
            backgroundColor: colors.card,
          },
        })}
      </View>
    );
  }

  const abrir = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (evento, fecha) => {
          if (evento.type === 'set' && fecha) onChange(fecha);
        },
      });
      return;
    }
    setTemporal(value ?? new Date());
    setAbierto(true);
  };

  return (
    <View style={{ gap: 6 }}>
      {etiqueta}
      <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={`${label ?? 'Fecha'}: ${value ? formatDate(value) : placeholder}`} style={styles.caja}>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
        <Text variant="body" weight="medium" color={value ? colors.text : colors.textSoft} style={{ flex: 1 }}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSoft} />
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
          <View style={styles.fondo}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />
            <View style={[styles.hoja, { paddingBottom: insets.bottom + spacing.md }]}>
              <DateTimePicker
                value={temporal}
                mode="date"
                display="inline"
                locale="es-MX"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                accentColor={colors.primary}
                onChange={(_, fecha) => fecha && setTemporal(fecha)}
              />
              <Button
                title="Listo"
                onPress={() => {
                  onChange(temporal);
                  setAbierto(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  hoja: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, gap: spacing.md },
});

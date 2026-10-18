// Lista de opciones con buscador, en una hoja modal. Se usa para elegir
// producto, cliente, estado de la república, etc.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';
import { SearchBar } from './controls';
import { Text } from './Text';

export type Opcion = {
  value: string;
  label: string;
  sublabel?: string;
  left?: ReactNode;
  right?: ReactNode;
  disabled?: boolean;
  /** Texto extra para el buscador (marca, RFC, teléfono...). */
  searchText?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: Opcion[];
  selected?: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  emptyText?: string;
  header?: ReactNode;
};

const quitarAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function SelectModal({ visible, title, options, selected, onSelect, onClose, searchPlaceholder = 'Buscar...', emptyText = 'Sin resultados', header }: Props) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    const q = quitarAcentos(busqueda.trim());
    if (!q) return options;
    return options.filter((o) => quitarAcentos(`${o.label} ${o.sublabel ?? ''} ${o.searchText ?? ''}`).includes(q));
  }, [busqueda, options]);

  const cerrar = () => {
    setBusqueda('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel="Cerrar" />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.asa} />
          <View style={styles.titulo}>
            <Text variant="heading">{title}</Text>
            <Pressable onPress={cerrar} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          {options.length > 6 && (
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
              <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder={searchPlaceholder} />
            </View>
          )}
          {header}
          <FlatList
            data={filtradas}
            keyExtractor={(o) => o.value || '__vacio__'}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text variant="caption" align="center" style={{ padding: spacing.xl }}>
                {emptyText}
              </Text>
            }
            renderItem={({ item }) => {
              const activo = item.value === selected;
              return (
                <Pressable
                  onPress={() => {
                    if (item.disabled) return;
                    onSelect(item.value);
                    cerrar();
                  }}
                  disabled={item.disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo, disabled: !!item.disabled }}
                  style={({ pressed }) => [styles.opcion, activo && styles.opcionActiva, pressed && { opacity: 0.7 }, item.disabled && { opacity: 0.45 }]}>
                  {item.left}
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight={activo ? 'semibold' : 'medium'} numberOfLines={1}>
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text variant="caption" numberOfLines={1}>
                        {item.sublabel}
                      </Text>
                    ) : null}
                  </View>
                  {item.right}
                  {activo && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  hoja: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    maxHeight: '85%',
    minHeight: '40%',
  },
  asa: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 },
  titulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.md },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.lg },
  opcionActiva: { backgroundColor: colors.primarySoft },
});

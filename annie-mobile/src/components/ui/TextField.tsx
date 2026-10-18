import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type Ref } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme';
import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
  required?: boolean;
  password?: boolean;
  ref?: Ref<TextInputInstance>;
};

/** Campo de texto con etiqueta, prefijo opcional ($), error y ayuda. */
export function TextField({ label, error, hint, prefix, required, password, style, editable = true, ref, ...props }: Props) {
  const [enfocado, setEnfocado] = useState(false);
  const [visible, setVisible] = useState(false);
  const borde = error ? colors.danger : enfocado ? colors.primary : colors.border;

  return (
    <View style={styles.wrap}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
          {required ? <Text variant="label" color={colors.danger}> *</Text> : null}
        </Text>
      )}
      <View style={[styles.caja, { borderColor: borde }, !editable && styles.inactivo]}>
        {prefix && (
          <Text variant="body" weight="semibold" color={colors.textMuted} style={styles.prefijo}>
            {prefix}
          </Text>
        )}
        <TextInput
          ref={ref}
          {...props}
          editable={editable}
          accessibilityLabel={props.accessibilityLabel ?? label}
          secureTextEntry={password ? !visible : props.secureTextEntry}
          placeholderTextColor={colors.textSoft}
          onFocus={(e) => {
            setEnfocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, styles.sinContorno, props.multiline && styles.multilinea, style]}
        />
        {password && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            style={styles.ojo}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.mensaje}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" style={styles.mensaje}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { textTransform: 'uppercase', letterSpacing: 0.4 },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
  },
  inactivo: { backgroundColor: colors.background },
  prefijo: { marginRight: 6 },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
    paddingVertical: 10,
  },
  multilinea: { minHeight: 90, textAlignVertical: 'top' },
  // En web el navegador dibuja su propio contorno de foco; el borde azul ya lo indica
  sinContorno: Platform.select({ web: { outlineStyle: 'none' } as object, default: {} }),
  ojo: { paddingLeft: 8, paddingVertical: 8 },
  mensaje: { marginTop: -2 },
});

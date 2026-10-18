import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'number';
type Weight = keyof typeof fonts;

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

const variantes: Record<Variant, { fontSize: number; lineHeight: number; weight: Weight; color: string }> = {
  title: { fontSize: 24, lineHeight: 32, weight: 'bold', color: colors.text },
  heading: { fontSize: 18, lineHeight: 26, weight: 'semibold', color: colors.text },
  subheading: { fontSize: 15, lineHeight: 22, weight: 'semibold', color: colors.text },
  body: { fontSize: 14, lineHeight: 21, weight: 'regular', color: colors.text },
  label: { fontSize: 12, lineHeight: 17, weight: 'medium', color: colors.textMuted },
  caption: { fontSize: 12, lineHeight: 17, weight: 'regular', color: colors.textMuted },
  number: { fontSize: 22, lineHeight: 30, weight: 'bold', color: colors.text },
};

/** Texto con la tipografía de Annie (Poppins). */
export function Text({ variant = 'body', weight, color, align, style, ...props }: Props) {
  const v = variantes[variant];
  return (
    <RNText
      {...props}
      style={[
        styles.base,
        { fontSize: v.fontSize, lineHeight: v.lineHeight, fontFamily: fonts[weight ?? v.weight], color: color ?? v.color },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});

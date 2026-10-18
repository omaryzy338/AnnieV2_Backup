// Tokens de diseño de Annie. El azul es el del logo (#3284F7), igual que en
// la página web; la tipografía es Poppins.

export const colors = {
  primary: '#3284F7',
  primaryDark: '#1F6FE0',
  primarySoft: '#EAF2FF',
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#1A1D29',
  textMuted: '#6B7280',
  textSoft: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  success: '#16A34A',
  successSoft: '#E8F7EE',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  warning: '#D97706',
  warningSoft: '#FEF3E2',
  white: '#FFFFFF',
  overlay: 'rgba(17, 24, 39, 0.45)',
} as const;

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;

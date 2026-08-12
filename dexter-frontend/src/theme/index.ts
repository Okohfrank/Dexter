export const colors = {
  background: '#F6F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFC',
  textPrimary: '#1A1A1E',
  textSecondary: '#8A8A93',
  textInverse: '#FFFFFF',
  primary: '#6C5CE7',
  primaryDark: '#4B3F8F',
  primaryLight: '#EDEBFC',
  positive: '#12B76A',
  positiveBg: '#E7F9F1',
  negative: '#F04452',
  negativeBg: '#FDECEE',
  border: '#ECECEF',
  divider: '#F0F0F3',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radii = { sm: 8, md: 16, lg: 20, pill: 999 };

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, fontFamily: fonts.extrabold },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, fontFamily: fonts.bold },
  subheading: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: fonts.semibold },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: fonts.medium },
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
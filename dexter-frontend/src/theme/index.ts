/**
 * Dexter Glassmorphism Design System (No Gradients)
 * Deep obsidian dark theme with frosted glass translucent surfaces,
 * crisp 1px borders, tactile pill buttons, and high-contrast typography.
 */

export const colors = {
  // Base Obsidian canvas
  background: '#0B0D13',
  backgroundAlt: '#11141D',

  // Frosted Glass Surfaces (translucent layering without gradients)
  glassSurface: 'rgba(255, 255, 255, 0.05)',
  glassSurfaceElevated: 'rgba(255, 255, 255, 0.09)',
  glassSurfaceActive: 'rgba(255, 255, 255, 0.14)',
  glassSurfaceSubtle: 'rgba(255, 255, 255, 0.03)',

  // Solid Surface fallbacks for high density
  surface: '#151822',
  surfaceAlt: '#1D212E',

  // Crisp Glass Borders
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.24)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.07)',
  border: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.08)',

  // Solid Accents (Pure, vivid, no gradient)
  primary: '#6366F1', // Electric Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryGlass: 'rgba(99, 102, 241, 0.15)',
  primaryGlassBorder: 'rgba(99, 102, 241, 0.35)',

  secondary: '#06B6D4', // Cyan
  secondaryGlass: 'rgba(6, 182, 212, 0.15)',

  // Functional Colors
  positive: '#10B981',
  positiveBg: 'rgba(16, 185, 129, 0.14)',
  positiveBorder: 'rgba(16, 185, 129, 0.3)',

  negative: '#EF4444',
  negativeBg: 'rgba(239, 68, 68, 0.14)',
  negativeBorder: 'rgba(239, 68, 68, 0.3)',

  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.14)',

  // High-Contrast Typography
  textPrimary: '#F8FAFC', // Crisp pure white/slate
  textSecondary: '#94A3B8', // Cool muted silver
  textMuted: '#64748B',
  textInverse: '#0B0D13',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    fontFamily: fonts.extrabold,
    color: colors.textPrimary,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
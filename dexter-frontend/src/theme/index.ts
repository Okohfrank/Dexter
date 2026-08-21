/**
 * Dexter Light-First Design System
 * Warm professional palette with clean surfaces, subtle depth,
 * and premium typography. Inspired by Buffer, Hootsuite, Publer.
 */

export const colors = {
  // ── Base Canvas ──
  background: '#F8F9FB',       // Warm snow-white
  backgroundAlt: '#F1F3F6',    // Slightly cooler for modals/drawers

  // ── Card Surfaces ──
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FB',
  surfacePressed: '#F1F3F6',
  surfaceHover: '#EEF0F4',

  // ── Borders & Dividers ──
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocused: '#A5B4FC',
  divider: '#E2E8F0',

  // ── Primary Brand (Deep Indigo) ──
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#818CF8',
  primarySurface: '#EEF2FF',   // Very light tint for backgrounds
  primaryBorder: '#C7D2FE',

  // ── Accent (Warm Coral) ──
  accent: '#F97066',
  accentSurface: '#FEF2F2',
  accentBorder: '#FECACA',

  // ── Secondary (Teal) ──
  secondary: '#0D9488',
  secondarySurface: '#F0FDFA',
  secondaryBorder: '#99F6E4',

  // ── Functional Colors ──
  positive: '#10B981',
  positiveSurface: '#ECFDF5',
  positiveBorder: '#A7F3D0',

  negative: '#EF4444',
  negativeSurface: '#FEF2F2',
  negativeBorder: '#FECACA',

  warning: '#F59E0B',
  warningSurface: '#FFFBEB',
  warningBorder: '#FDE68A',

  // ── Typography ──
  textPrimary: '#1E293B',      // Dark charcoal
  textSecondary: '#64748B',    // Slate gray
  textMuted: '#94A3B8',        // Light muted
  textInverse: '#FFFFFF',

  // ── Misc ──
  overlay: 'rgba(15, 23, 42, 0.5)',
  skeleton: '#E2E8F0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
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
    fontSize: 28,
    lineHeight: 34,
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
  /** Subtle card elevation */
  card: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** Slightly stronger elevation for modals/overlays */
  elevated: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  /** Soft inner-glow for primary buttons */
  primaryBtn: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  /** Very subtle for list items */
  subtle: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
};
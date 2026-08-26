/**
 * Dexter — Apple Human Interface Guidelines Design System
 * Dark-mode-first palette with glassmorphism, system fonts (SF Pro / Roboto),
 * continuous corner radii, and Apple's 8pt spacing grid.
 */

/* ── Color Palette ────────────────────────────────────── */
export const colors = {
  // ── Apple System Colors ──
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D55',
  systemTeal: '#5AC8FA',
  systemIndigo: '#5856D6',

  // ── Dark Backgrounds ──
  background: '#000000',
  backgroundPrimary: '#1C1C1E',
  backgroundSecondary: '#2C2C2E',
  backgroundTertiary: '#3A3A3C',
  backgroundElevated: '#1C1C1E',

  // ── Glass Surfaces ──
  glass: 'rgba(255, 255, 255, 0.08)',
  glassLight: 'rgba(255, 255, 255, 0.12)',
  glassHeavy: 'rgba(255, 255, 255, 0.18)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderLight: 'rgba(255, 255, 255, 0.08)',
  glassBorderFocused: 'rgba(0, 122, 255, 0.50)',

  // ── Glass surface presets ──
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceAlt: 'rgba(255, 255, 255, 0.05)',
  surfacePressed: 'rgba(255, 255, 255, 0.15)',
  surfaceHover: 'rgba(255, 255, 255, 0.12)',

  // ── Labels (Apple's dark-mode text) ──
  labelPrimary: '#FFFFFF',
  labelSecondary: 'rgba(235, 235, 245, 0.60)',
  labelTertiary: 'rgba(235, 235, 245, 0.30)',
  labelQuaternary: 'rgba(235, 235, 245, 0.18)',

  // ── Backward compatibility aliases ──
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.60)',
  textMuted: 'rgba(235, 235, 245, 0.30)',
  textInverse: '#000000',

  // ── Separators ──
  separator: 'rgba(84, 84, 88, 0.65)',
  separatorOpaque: '#38383A',
  border: 'rgba(255, 255, 255, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderFocused: 'rgba(0, 122, 255, 0.50)',
  divider: 'rgba(84, 84, 88, 0.65)',

  // ── Functional Colors ──
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#5AC8FA',
  primarySurface: 'rgba(0, 122, 255, 0.15)',
  primaryBorder: 'rgba(0, 122, 255, 0.30)',

  accent: '#FF9500',
  accentSurface: 'rgba(255, 149, 0, 0.15)',
  accentBorder: 'rgba(255, 149, 0, 0.30)',

  secondary: '#5AC8FA',
  secondarySurface: 'rgba(90, 200, 250, 0.15)',
  secondaryBorder: 'rgba(90, 200, 250, 0.30)',

  positive: '#34C759',
  positiveSurface: 'rgba(52, 199, 89, 0.15)',
  positiveBorder: 'rgba(52, 199, 89, 0.30)',

  negative: '#FF3B30',
  negativeSurface: 'rgba(255, 59, 48, 0.15)',
  negativeBorder: 'rgba(255, 59, 48, 0.30)',

  warning: '#FF9500',
  warningSurface: 'rgba(255, 149, 0, 0.15)',
  warningBorder: 'rgba(255, 149, 0, 0.30)',

  // ── Misc ──
  overlay: 'rgba(0, 0, 0, 0.60)',
  skeleton: 'rgba(255, 255, 255, 0.06)',
};

/* ── Spacing (Apple 8pt Grid) ─────────────────────────── */
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

/* ── Corner Radii (Apple Continuous Corners) ──────────── */
export const radii = {
  xs: 8,
  sm: 10,
  md: 13,
  lg: 16,
  xl: 22,
  xxl: 28,
  xxxl: 39,
  pill: 999,
};

/* ── System Fonts ─────────────────────────────────────── */
export const fonts = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  extrabold: 'System',
};

/* ── Typography Presets (Apple HIG) ───────────────────── */
export const typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
    color: colors.labelPrimary,
  },
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
    color: colors.labelPrimary,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
    color: colors.labelPrimary,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
    color: colors.labelPrimary,
  },
  subheading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
    color: colors.labelPrimary,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
    color: colors.labelSecondary,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
    color: colors.labelSecondary,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
    letterSpacing: -0.08,
    color: colors.labelSecondary,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.07,
    color: colors.labelTertiary,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
    color: colors.labelTertiary,
  },
};

/* ── Shadow Presets (Apple Diffused Shadows) ──────────── */
export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  primaryBtn: {
    shadowColor: '#007AFF',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#007AFF',
    shadowOpacity: 0.20,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
};

/* ── Glass Style Presets ──────────────────────────────── */
export const glass = {
  card: {
    backgroundColor: colors.glass,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden' as const,
  },
  cardLight: {
    backgroundColor: colors.glassLight,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden' as const,
  },
  cardHeavy: {
    backgroundColor: colors.glassHeavy,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden' as const,
  },
  pill: {
    backgroundColor: colors.glass,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
};
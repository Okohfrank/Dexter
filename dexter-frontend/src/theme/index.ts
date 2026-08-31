/**
 * Dexter — DESIGN.md v1.0 Design System
 * Single source of truth mirroring `dexter-frontend/DESIGN.md` §2.
 * Companion machine-readable file: `dexter-design-system.css` (same values).
 * Never hardcode a color, font size, spacing value, or radius — resolve to a token here.
 */

/* ── Color Tokens (§2.1) ──────────────────────────────── */
export const colorBg = '#FBF8F2';           // Screen background (legacy)
export const colorBgAlt = '#F3EEE1';        // Section background, alt rows (legacy)
export const colorSurface = '#FFFFFF';      // Card surface
export const colorSurfaceSunken = '#F6F3EA';// Inputs, inset areas (legacy)
export const colorInk = '#000000';          // Primary text — pure black
export const colorInkSoft = '#888888';      // Secondary text — gray
export const colorInkFaint = '#999999';     // Placeholder, disabled, labels
export const colorBorder = '#E0E0E0';       // Hairline borders — neutral gray
export const colorAccent = '#CDDC39';       // Lime/chartreuse — primary actions, active tabs
export const colorAccentStrong = '#B8CC2A'; // Pressed/hover on accent elements
export const colorBrand = '#CDDC39';        // Alias — lime (replaces indigo)
export const colorBrandTint = '#F5F8D0';    // Lime tint background
export const colorBrandStrong = '#B8CC2A';  // Alias — pressed lime
export const colorPremium = '#000000';      // Black (replaces burgundy)
export const colorEnergy = '#CDDC39';       // Lime (replaces orange)
export const colorPositiveText = '#000000'; // Black (replaces green)
export const colorPositiveFill = '#F5F5F5'; // Light gray (replaces mint)
export const colorNegativeText = '#000000'; // Black (replaces red)
export const colorNegativeFill = '#F5F5F5'; // Light gray (replaces red tint)
export const colorHighlightBg = '#F5F5F5';  // Light gray (replaces yellow)

/* Paired darker text tokens for colored fills (§5) */
export const colorOnHighlight = '#000000';  // Text on light gray
export const colorOnPositive = '#000000';   // Text on light gray
export const colorOnEnergy = '#000000';     // Text on lime

/* Dark surface set — pure black mode */
export const colorBgDark = '#000000';
export const colorSurfaceDark = '#111111';
export const colorInkDark = '#FFFFFF';
export const colorBorderDark = '#333333';

/* Backward-compatible palette aliases (legacy screens reference these until restyled) */
export const colors = {
  background: colorSurface,        // white (was warm paper)
  backgroundAlt: '#F5F5F5',
  surface: colorSurface,
  surfaceSunken: '#F5F5F5',
  textPrimary: colorInk,
  textSecondary: colorInkSoft,
  textMuted: colorInkFaint,
  textInverse: colorSurface,
  labelPrimary: colorInk,
  labelSecondary: colorInkSoft,
  labelTertiary: colorInkFaint,
  primary: colorAccent,            // lime
  primaryDark: colorAccentStrong,
  primaryLight: '#E0E86B',
  primarySurface: '#F5F8D0',
  primaryBorder: '#D4DF6B',
  accent: colorAccent,
  accentSurface: '#F5F8D0',
  accentBorder: '#D4DF6B',
  secondary: colorAccent,
  secondarySurface: '#F5F8D0',
  secondaryBorder: '#D4DF6B',
  positive: colorInk,
  positiveSurface: '#F5F5F5',
  positiveBorder: '#E0E0E0',
  negative: colorInk,
  negativeSurface: '#F5F5F5',
  negativeBorder: '#E0E0E0',
  warning: colorAccent,
  warningSurface: '#F5F8D0',
  warningBorder: '#D4DF6B',
  highlight: '#F5F5F5',
  border: colorBorder,
  borderLight: '#F0F0F0',
  divider: colorBorder,
  separator: colorBorder,
  skeleton: '#F0F0F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: '#F5F5F5',
  glassLight: '#FAFAFA',
  glassHeavy: '#FFFFFF',
  glassBorder: colorBorder,
  glassBorderLight: '#F0F0F0',
  glassBorderFocused: colorAccent,
  surfaceAlt: '#F5F5F5',
  surfacePressed: '#E8E8E8',
  surfaceHover: '#F0F0F0',
  systemBlue: colorAccent,
  systemGreen: colorInk,
  systemRed: colorInk,
  systemOrange: colorAccent,
  systemYellow: '#F5F5F5',
  systemPurple: colorInk,
  systemPink: colorInk,
  systemTeal: colorAccent,
  systemIndigo: colorAccent,
  backgroundPrimary: colorSurface,
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: colorBorder,
  backgroundElevated: colorSurface,
  /* DESIGN.md §2.1 semantic names */
  ink: colorInk,
  inkSoft: colorInkSoft,
  inkFaint: colorInkFaint,
  accentStrong: colorAccentStrong,
  brand: colorAccent,
  brandTint: '#F5F8D0',
  brandStrong: colorAccentStrong,
  energy: colorAccent,
  premium: colorInk,
  positiveFill: '#F5F5F5',
  negativeFill: '#F5F5F5',
  highlightFill: '#F5F5F5',
  onHighlight: colorInk,
  onPositive: colorInk,
  onEnergy: colorInk,
  bgDark: colorBgDark,
  surfaceDark: colorSurfaceDark,
  inkDark: colorInkDark,
  borderDark: colorBorderDark,
};

/* ── Spacing (§2.3) — 4px base scale ─────────────────── */
export const space1 = 4;
export const space2 = 8;
export const space3 = 12;
export const space4 = 16;
export const space5 = 20;
export const space6 = 24;
export const space7 = 32;
export const space8 = 40;
export const space9 = 48;
export const space10 = 64;

export const spacing = {
  xs: space1,     // 4
  sm: space2,     // 8
  md: space3,     // 12
  lg: space4,     // 16
  xl: space5,     // 20
  xxl: space6,    // 24
  xxxl: space7,   // 32
  xxxxl: space8,  // 40
  // Legacy alias for the old 48px bucket
  huge: space9,   // 48
};

/* ── Radius (§2.4) ───────────────────────────────────── */
export const radiusSm = 12;    // chips, inputs, small tappable rows
export const radiusMd = 20;    // standard card
export const radiusLg = 28;    // hero/feature card, bottom sheets
export const radiusFull = 999; // buttons, pills, nav, avatars

export const radii = {
  xs: radiusSm,   // 12 — minimum for any tappable element
  sm: radiusSm,   // 12
  md: radiusMd,   // 20
  lg: radiusLg,   // 28
  xl: radiusLg,   // 28
  xxl: radiusLg,  // 28
  xxxl: radiusLg, // 28 — legacy alias for bottom sheet top corners
  pill: radiusFull, // 999
};

/* ── Shadow (§2.5) — neutral black ────────────────────── */
const SHADOW_SM: [number, number, number, string] = [0, 1, 2, 'rgba(0, 0, 0, 0.05)'];
const SHADOW_MD: [number, number, number, string] = [0, 8, 24, 'rgba(0, 0, 0, 0.10)'];
const SHADOW_LG: [number, number, number, string] = [0, 20, 48, 'rgba(0, 0, 0, 0.15)'];

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: SHADOW_SM[2],
    shadowOffset: { width: SHADOW_SM[0], height: SHADOW_SM[1] },
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: SHADOW_MD[2],
    shadowOffset: { width: SHADOW_MD[0], height: SHADOW_MD[1] },
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: SHADOW_LG[2],
    shadowOffset: { width: SHADOW_LG[0], height: SHADOW_LG[1] },
    elevation: 8,
  },
  // Legacy aliases
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: SHADOW_SM[2],
    shadowOffset: { width: SHADOW_SM[0], height: SHADOW_SM[1] },
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: SHADOW_MD[2],
    shadowOffset: { width: SHADOW_MD[0], height: SHADOW_MD[1] },
    elevation: 4,
  },
  primaryBtn: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: SHADOW_SM[2],
    shadowOffset: { width: SHADOW_SM[0], height: SHADOW_SM[1] },
    elevation: 1,
  },
  glow: {
    shadowColor: colorAccent,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
};

/* ── Motion (§2.6) ────────────────────────────────────── */
export const motion = {
  durationFast: 150,
  durationBase: 240,
  easingOut: [0.16, 1, 0.3, 1] as const,
};

/* ── Fonts (§2.2) — Fraunces (display) + Inter (UI/body) only ── */
export const fontFamilyDisplay = 'Fraunces_700Bold';
export const fontFamilyDisplayMedium = 'Fraunces_600SemiBold';
export const fontFamilyRegular = 'Inter_400Regular';
export const fontFamilyMedium = 'Inter_500Medium';
export const fontFamilySemiBold = 'Inter_600SemiBold';
export const fontFamilyBold = 'Inter_700Bold';

/* Backward-compatible font aliases */
export const fonts = {
  regular: fontFamilyRegular,
  medium: fontFamilyMedium,
  semibold: fontFamilySemiBold,
  bold: fontFamilyBold,
  extrabold: fontFamilyBold,
  display: fontFamilyDisplay,
  displayMedium: fontFamilyDisplayMedium,
};

/* ── Typography Presets (§2.2) ────────────────────────── */
export const typography = {
  /// Fraunces display (max 1–2 elements per screen)
  displayLarge: {
    fontFamily: fontFamilyDisplay,
    fontSize: 40,
    lineHeight: 43.2,
    letterSpacing: -0.5,
    color: colorInk,
  },
  displayMedium: {
    fontFamily: fontFamilyDisplayMedium,
    fontSize: 32,
    lineHeight: 35.8,
    letterSpacing: -0.4,
    color: colorInk,
  },
  displaySmall: {
    fontFamily: fontFamilyDisplayMedium,
    fontSize: 26,
    lineHeight: 30.7,
    letterSpacing: -0.3,
    color: colorInk,
  },
  /// Inter UI
  h1: {
    fontFamily: fontFamilyBold,
    fontSize: 22,
    lineHeight: 27.5,
    letterSpacing: -0.2,
    color: colorInk,
  },
  h2: {
    fontFamily: fontFamilySemiBold,
    fontSize: 18,
    lineHeight: 23.4,
    letterSpacing: -0.1,
    color: colorInk,
  },
  h3: {
    fontFamily: fontFamilySemiBold,
    fontSize: 15,
    lineHeight: 20.3,
    letterSpacing: 0,
    color: colorInk,
  },
  body: {
    fontFamily: fontFamilyRegular,
    fontSize: 15,
    lineHeight: 23.3,
    letterSpacing: 0,
    color: colorInk,
  },
  bodySmall: {
    fontFamily: fontFamilyRegular,
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: 0,
    color: colorInk,
  },
  label: {
    fontFamily: fontFamilySemiBold,
    fontSize: 12,
    lineHeight: 15.6,
    letterSpacing: 0.6,
    color: colorInkFaint,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fontFamilyBold,
    fontSize: 28,
    lineHeight: 30.8,
    letterSpacing: -0.3,
    color: colorInk,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
  },
  caption2: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 15.4,
    letterSpacing: 0.2,
    color: colorInkFaint,
  },
  // Backward-compatible aliases used by legacy screens
  largeTitle: {
    fontFamily: fontFamilyDisplay,
    fontSize: 34,
    lineHeight: 40.8,
    letterSpacing: -0.4,
    color: colorInk,
  },
  display: {
    fontFamily: fontFamilyDisplay,
    fontSize: 28,
    lineHeight: 33.6,
    letterSpacing: -0.3,
    color: colorInk,
  },
  heading: {
    fontFamily: fontFamilyBold,
    fontSize: 22,
    lineHeight: 27.5,
    letterSpacing: -0.2,
    color: colorInk,
  },
  title3: {
    fontFamily: fontFamilySemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
    color: colorInk,
  },
  subheading: {
    fontFamily: fontFamilySemiBold,
    fontSize: 17,
    lineHeight: 22.1,
    letterSpacing: -0.2,
    color: colorInk,
  },
  callout: {
    fontFamily: fontFamilyRegular,
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.15,
    color: colorInkSoft,
  },
  caption: {
    fontFamily: fontFamilyMedium,
    fontSize: 13,
    lineHeight: 18.2,
    letterSpacing: 0,
    color: colorInkSoft,
  },
  footnote: {
    fontFamily: fontFamilyRegular,
    fontSize: 13,
    lineHeight: 18.2,
    letterSpacing: 0,
    color: colorInkFaint,
  },
};

/* ── Surface presets (aligned to DESIGN.md §3.2) ─────── */
export const glass = {
  card: {
    backgroundColor: colorSurface,
    borderRadius: radiusMd,
    borderWidth: 1,
    borderColor: colorBorder,
    overflow: 'hidden' as const,
    ...shadows.sm,
  },
  cardLight: {
    backgroundColor: colorSurface,
    borderRadius: radiusMd,
    borderWidth: 1,
    borderColor: colorBorder,
    overflow: 'hidden' as const,
  },
  cardHeavy: {
    backgroundColor: colorSurface,
    borderRadius: radiusMd,
    borderWidth: 1,
    borderColor: colorBorder,
    overflow: 'hidden' as const,
    ...shadows.md,
  },
  pill: {
    backgroundColor: colorSurfaceSunken,
    borderRadius: radiusFull,
    borderWidth: 1,
    borderColor: colorBorder,
  },
  input: {
    backgroundColor: colorSurfaceSunken,
    borderRadius: radiusFull,
    borderWidth: 1,
    borderColor: colorBorder,
  },
};
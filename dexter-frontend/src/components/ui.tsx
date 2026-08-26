import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, fonts, shadows, glass } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Screen Wrapper (Auth) ───────────────────────────── */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.authBg}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.authScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ── Brand Mark ──────────────────────────────────────── */
export function BrandMark() {
  return (
    <View style={styles.logo}>
      <BlurView intensity={40} tint="dark" style={styles.logoBlur}>
        <View style={styles.logoInner}>
          <View style={styles.logoIcon}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>Dexter</Text>
        </View>
      </BlurView>
    </View>
  );
}

/* ── Glass Card ──────────────────────────────────────── */
export function GlassCard({
  children,
  style,
  elevated,
  highlighted,
  intensity = 25,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  highlighted?: boolean;
  intensity?: number;
}) {
  return (
    <View
      style={[
        styles.glassCardOuter,
        elevated && shadows.card,
        highlighted && styles.glassCardHighlighted,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={styles.glassCardBlur}
      >
        <View style={[styles.glassCardContent]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

/** Backward-compat alias */
export const Card = GlassCard;

/* ── Bento Card (Variable-size grid card) ────────────── */
export type BentoSize = '1x1' | '2x1' | '1x2' | '2x2' | 'full';

export function BentoCard({
  children,
  size = '1x1',
  style,
  accentColor,
}: {
  children: React.ReactNode;
  size?: BentoSize;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}) {
  const bentoStyle = bentoDimensions[size];

  return (
    <View
      style={[
        styles.bentoCardOuter,
        bentoStyle,
        accentColor && { borderColor: `${accentColor}33` },
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" style={styles.bentoCardBlur}>
        <View style={styles.bentoCardContent}>
          {accentColor && (
            <View
              style={[styles.bentoAccentStrip, { backgroundColor: accentColor }]}
            />
          )}
          {children}
        </View>
      </BlurView>
    </View>
  );
}

/* ── Glass Pill Badge ────────────────────────────────── */
export function GlassPill({
  label,
  icon,
  variant = 'default',
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'positive' | 'primary' | 'warning' | 'negative';
}) {
  const variantStyles = {
    default: { bg: colors.glass, border: colors.glassBorderLight, text: colors.labelSecondary },
    positive: { bg: colors.positiveSurface, border: colors.positiveBorder, text: colors.positive },
    primary: { bg: colors.primarySurface, border: colors.primaryBorder, text: colors.primary },
    warning: { bg: colors.warningSurface, border: colors.warningBorder, text: colors.warning },
    negative: { bg: colors.negativeSurface, border: colors.negativeBorder, text: colors.negative },
  }[variant];

  return (
    <View style={[styles.pill, { backgroundColor: variantStyles.bg, borderColor: variantStyles.border }]}>
      {icon && <Ionicons name={icon} size={12} color={variantStyles.text} />}
      <Text style={[styles.pillText, { color: variantStyles.text }]}>{label}</Text>
    </View>
  );
}

/** Backward-compat alias */
export const Pill = GlassPill;

/* ── Segmented Control (Apple-style) ─────────────────── */
export function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
}: {
  segments: { key: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  selected: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={styles.segmentedOuter}>
      <BlurView intensity={20} tint="dark" style={styles.segmentedBlur}>
        <View style={styles.segmentedInner}>
          {segments.map((seg) => {
            const active = seg.key === selected;
            return (
              <Pressable
                key={seg.key}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => onChange(seg.key)}
              >
                {seg.icon && (
                  <Ionicons
                    name={seg.icon}
                    size={13}
                    color={active ? '#FFFFFF' : colors.labelTertiary}
                  />
                )}
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {seg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

/* ── Text Input (Glass) ──────────────────────────────── */
type AuthInputProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
};

export function AuthTextInput({ label, icon, secure, ...props }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <Ionicons
          name={icon}
          size={18}
          color={focused ? colors.primary : colors.labelTertiary}
        />
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={colors.labelTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secure && (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.labelTertiary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Primary Button ──────────────────────────────────── */
export function PrimaryButton({
  title,
  onPress,
  disabled,
  icon,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}

/* ── Outlined Button (Glass) ─────────────────────────── */
export function OutlinedButton({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outlinedBtn,
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.labelPrimary} />
      <Text style={styles.outlinedBtnText}>{title}</Text>
    </Pressable>
  );
}

/* ── Divider ─────────────────────────────────────────── */
export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/* ── Status Dot (Animated-ready) ─────────────────────── */
export function StatusDot({ active, color }: { active?: boolean; color?: string }) {
  return (
    <View
      style={[
        styles.statusDot,
        { backgroundColor: color ?? (active ? colors.positive : colors.labelTertiary) },
        active && styles.statusDotGlow,
      ]}
    />
  );
}

/* ── Bento Dimension Map ─────────────────────────────── */
const BENTO_GAP = spacing.md;
const BENTO_PADDING = spacing.lg;
const BENTO_COL = (SCREEN_W - BENTO_PADDING * 2 - BENTO_GAP) / 2;

const bentoDimensions: Record<BentoSize, ViewStyle> = {
  '1x1': { width: BENTO_COL, height: BENTO_COL },
  '2x1': { width: SCREEN_W - BENTO_PADDING * 2, height: BENTO_COL * 0.55 },
  '1x2': { width: BENTO_COL, height: BENTO_COL * 2 + BENTO_GAP },
  '2x2': { width: SCREEN_W - BENTO_PADDING * 2, height: BENTO_COL * 2 + BENTO_GAP },
  'full': { width: SCREEN_W - BENTO_PADDING * 2 },
};

/* ── Styles ──────────────────────────────────────────── */
const styles = StyleSheet.create({
  flex: { flex: 1 },

  // ── Auth Screen ──
  authBg: {
    flex: 1,
    backgroundColor: colors.background,
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },

  // ── Brand Mark ──
  logo: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  logoBlur: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  logoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.labelPrimary,
  },

  // ── Glass Card ──
  glassCardOuter: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  glassCardBlur: {
    overflow: 'hidden',
  },
  glassCardContent: {
    padding: spacing.lg,
  },
  glassCardHighlighted: {
    borderColor: colors.primaryBorder,
  },

  // ── Bento Card ──
  bentoCardOuter: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  bentoCardBlur: {
    flex: 1,
    overflow: 'hidden',
  },
  bentoCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  bentoAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },

  // ── Glass Pill ──
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: {
    ...typography.caption2,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Segmented Control ──
  segmentedOuter: {
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  segmentedBlur: {
    padding: 3,
  },
  segmentedInner: {
    flexDirection: 'row',
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.xs,
  },
  segmentBtnActive: {
    backgroundColor: colors.glassHeavy,
  },
  segmentText: {
    ...typography.caption,
    color: colors.labelTertiary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Input ──
  field: { marginBottom: spacing.lg },
  label: {
    ...typography.caption,
    color: colors.labelSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  inputWrapFocused: {
    borderColor: colors.glassBorderFocused,
    backgroundColor: colors.glassLight,
  },
  input: {
    flex: 1,
    color: colors.labelPrimary,
    fontSize: 16,
    paddingVertical: spacing.lg,
  },

  // ── Primary Button ──
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.primaryBtn,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },

  // ── Outlined Button ──
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 15,
  },
  outlinedBtnText: {
    color: colors.labelPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.separator,
  },
  dividerLabel: {
    color: colors.labelTertiary,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Status Dot ──
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotGlow: {
    shadowColor: '#34C759',
    shadowOpacity: 0.60,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
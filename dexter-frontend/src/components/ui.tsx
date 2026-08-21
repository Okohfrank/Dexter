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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, fonts, shadows } from '../theme';

/* ── Screen Wrapper ─────────────────────────────────── */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Brand Mark ─────────────────────────────────────── */
export function BrandMark() {
  return (
    <View style={styles.logo}>
      <View style={styles.logoInner}>
        <View style={styles.logoIcon}>
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.logoText}>Dexter</Text>
      </View>
    </View>
  );
}

/* ── Card (replaces GlassCard) ──────────────────────── */
export function Card({
  children,
  style,
  elevated,
  highlighted,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  highlighted?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.cardElevated,
        highlighted && styles.cardHighlighted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Backward-compat alias */
export const GlassCard = Card;

/* ── Pill Badge (replaces GlassPill) ────────────────── */
export function Pill({
  label,
  icon,
  variant = 'default',
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'positive' | 'primary' | 'warning' | 'negative';
}) {
  const variantStyles = {
    default: { bg: colors.surfaceAlt, border: colors.border, text: colors.textSecondary },
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
export const GlassPill = Pill;

/* ── Text Input ─────────────────────────────────────── */
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
          color={focused ? colors.primary : colors.textMuted}
        />
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secure && (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Primary Button ─────────────────────────────────── */
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
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}

/* ── Outlined Button ────────────────────────────────── */
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
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
      <Text style={styles.outlinedBtnText}>{title}</Text>
    </Pressable>
  );
}

/* ── Divider ────────────────────────────────────────── */
export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },

  // Brand
  logo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.subtle,
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
    fontFamily: fonts.extrabold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardElevated: {
    ...shadows.elevated,
    borderColor: colors.borderLight,
  },
  cardHighlighted: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySurface,
  },

  // Pill
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
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },

  // Input
  field: { marginBottom: spacing.lg },
  label: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: spacing.lg,
  },

  // Primary Button
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.primaryBtn,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },

  // Outlined Button
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  outlinedBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
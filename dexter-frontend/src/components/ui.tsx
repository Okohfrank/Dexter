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

export function BrandMark() {
  return (
    <View style={styles.logo}>
      <View style={styles.logoInner}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <Text style={styles.logoText}>Dexter</Text>
      </View>
    </View>
  );
}

export function GlassCard({
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
        styles.glassCard,
        elevated && styles.glassCardElevated,
        highlighted && styles.glassCardHighlighted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

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
    default: { bg: colors.glassSurfaceElevated, border: colors.glassBorder, text: colors.textSecondary },
    positive: { bg: colors.positiveBg, border: colors.positiveBorder, text: colors.positive },
    primary: { bg: colors.primaryGlass, border: colors.primaryGlassBorder, text: colors.primaryLight },
    warning: { bg: colors.warningBg, border: 'rgba(245, 158, 11, 0.3)', text: colors.warning },
    negative: { bg: colors.negativeBg, border: colors.negativeBorder, text: colors.negative },
  }[variant];

  return (
    <View style={[styles.glassPill, { backgroundColor: variantStyles.bg, borderColor: variantStyles.border }]}>
      {icon && <Ionicons name={icon} size={12} color={variantStyles.text} />}
      <Text style={[styles.glassPillText, { color: variantStyles.text }]}>{label}</Text>
    </View>
  );
}

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
          color={focused ? colors.primaryLight : colors.textSecondary}
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
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

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
        disabled && { opacity: 0.4 },
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
      <Text style={styles.primaryBtnText}>{title}</Text>
    </Pressable>
  );
}

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
        pressed && { backgroundColor: colors.glassSurfaceActive },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
      <Text style={styles.outlinedBtnText}>{title}</Text>
    </Pressable>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  logo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.glassSurfaceElevated,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorderHighlight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  logoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  glassCard: {
    backgroundColor: colors.glassSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    ...shadows.card,
  },
  glassCardElevated: {
    backgroundColor: colors.glassSurfaceElevated,
    borderColor: colors.glassBorderHighlight,
  },
  glassCardHighlighted: {
    borderColor: colors.primaryGlassBorder,
    backgroundColor: colors.primaryGlass,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  glassPillText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  field: { marginBottom: spacing.lg },
  label: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassSurface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.glassSurfaceElevated,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.regular,
    paddingVertical: spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.glow,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.bold,
    letterSpacing: 0.2,
  },
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassSurface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.lg,
  },
  outlinedBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },
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
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
  OutlinedButton,
  Divider,
} from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Dexter's been hard at work since you left. See what's planned, posted, and learned.
        </Text>
      </View>

      <AuthTextInput
        label="Email"
        icon="mail-outline"
        placeholder="you@company.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <AuthTextInput
        label="Password"
        icon="lock-closed-outline"
        placeholder="••••••••"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />

      <View style={styles.forgotRow}>
        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </Link>
      </View>

      <PrimaryButton title="Log in" onPress={() => {}} />

      <Divider label="or continue with" />
      <OutlinedButton title="Continue with LinkedIn" icon="logo-linkedin" onPress={() => {}} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Dexter? </Text>
        <Link href="/signup" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Create account</Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xxl, marginBottom: spacing.xxxl },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
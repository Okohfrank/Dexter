import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
} from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>
          {sent ? 'Check your inbox' : 'Reset your password'}
        </Text>
        <Text style={styles.subtitle}>
          {sent
            ? `We sent a password reset link to ${email || 'your email'}.`
            : 'Enter your email and we\'ll send you a link to get back in.'}
        </Text>
      </View>

      {!sent && (
        <>
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
          <PrimaryButton title="Send reset link" onPress={() => setSent(true)} />
        </>
      )}

      {sent && (
        <PrimaryButton title="Back to log in" onPress={() => setSent(false)} />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Remembered it? </Text>
        <Link href="/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Log in</Text>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
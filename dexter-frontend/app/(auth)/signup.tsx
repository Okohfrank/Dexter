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
  Checkbox,
} from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Hire your AI employee</Text>
        <Text style={styles.subtitle}>
          Create an account and Dexter will handle your content strategy, scheduling, and posting.
        </Text>
      </View>

      <AuthTextInput
        label="Full name"
        icon="person-outline"
        placeholder="Jane Smith"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
      />
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
        placeholder="At least 8 characters"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <Pressable style={styles.terms} onPress={() => setAgreed((a) => !a)}>
        <Checkbox checked={agreed} />
        <Text style={styles.termsText}>
          I agree to Dexter's <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </Pressable>

      <PrimaryButton
        title="Create account"
        disabled={!agreed}
        onPress={() => {}}
      />

      <Divider label="or continue with" />
      <OutlinedButton title="Continue with LinkedIn" icon="logo-linkedin" onPress={() => {}} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
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
  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  termsText: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
  },
  termsLink: { color: colors.primary, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
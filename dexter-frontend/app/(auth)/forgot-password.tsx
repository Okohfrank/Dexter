import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
} from '../../src/components/ui';
import { colors, spacing, typography, radii } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your account email.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and Dexter will send you instructions to reset your password.
        </Text>
      </View>

      {sent ? (
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={24} color={colors.positive} />
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successText}>
            We sent a password reset link to {email}.
          </Text>
          <PrimaryButton title="Back to sign in" onPress={() => router.replace('/login')} />
        </View>
      ) : (
        <>
          <AuthTextInput
            label="Email"
            icon="mail-outline"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PrimaryButton title="Send Reset Link" onPress={handleReset} disabled={loading} />
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

          <View style={styles.footer}>
            <Link href="/login" asChild>
              <Pressable hitSlop={8} style={styles.backRow}>
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={styles.footerLink}>Back to sign in</Text>
              </Pressable>
            </Link>
          </View>
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.xxl },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  successTitle: { ...typography.heading, color: colors.textPrimary, marginTop: 4 },
  successText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
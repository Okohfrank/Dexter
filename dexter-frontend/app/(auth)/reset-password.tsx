import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
} from '../../src/components/ui';
import { colors, spacing, typography, radii } from '../../src/theme';
import { resetPassword } from '../../src/api/auth';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      Alert.alert('Missing token', 'Please provide the reset token from your email.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(trimmedToken, password);
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not reset password. The link or token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.subtitle}>
          Create a new password for your Dexter account.
        </Text>
      </View>

      {success ? (
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={28} color={colors.positive} />
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successText}>
            Your password has been changed successfully. You can now sign in.
          </Text>
          <PrimaryButton title="Sign In Now" onPress={() => router.replace('/login')} />
        </View>
      ) : (
        <>
          {!params.token && (
            <AuthTextInput
              label="Reset Token"
              icon="key-outline"
              placeholder="Paste token from email"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
            />
          )}

          <AuthTextInput
            label="New Password"
            icon="lock-closed-outline"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AuthTextInput
            label="Confirm Password"
            icon="shield-checkmark-outline"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <PrimaryButton title="Update Password" onPress={handleReset} disabled={loading} />
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

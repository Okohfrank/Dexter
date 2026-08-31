import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  AuthTextInput,
  PrimaryButton,
} from '../../src/components/ui';
import { colors, spacing, fonts, radii } from '../../src/theme';
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
      <View style={styles.header}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.subtitle}>
          Create a new password for your account.
        </Text>
      </View>

      {success ? (
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={28} color="#000000" />
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
              placeholder="Paste token from email"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
            />
          )}

          <AuthTextInput
            label="New Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secure
          />

          <AuthTextInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secure
          />

          <PrimaryButton title="Update Password" onPress={handleReset} disabled={loading} />
          {loading && <ActivityIndicator color="#000000" style={{ marginTop: spacing.sm }} />}

          <View style={styles.footer}>
            <Link href="/login" asChild>
              <Pressable hitSlop={8} style={styles.backRow}>
                <Ionicons name="arrow-back" size={16} color="#000000" />
                <Text style={styles.backText}>Back to sign in</Text>
              </Pressable>
            </Link>
          </View>
        </>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: '#000000',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    marginTop: spacing.xs,
  },
  successText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#000000',
  },
});

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  AuthTextInput,
  PrimaryButton,
} from '../../src/components/ui';
import { colors, spacing, fonts, radii } from '../../src/theme';
import { forgotPassword } from '../../src/api/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Missing email', 'Please enter your account email.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you instructions to reset your password.
        </Text>
      </View>

      {sent ? (
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={28} color="#000000" />
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
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PrimaryButton title="Send Reset Link" onPress={handleReset} disabled={loading} />
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

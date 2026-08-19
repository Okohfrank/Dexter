import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
  OutlinedButton,
  Divider,
} from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';
import { register, getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { useAuthStore } from '../../src/api/client';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(email.trim(), password, fullName.trim() || 'Founder');
      useAuthStore.getState().setTokens({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      router.replace('/(onboarding)');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = async () => {
    try {
      const businessId = '00000000-0000-0000-0000-000000000000';
      const { authorization_url } = await getLinkedInAuthorizationUrl(businessId);
      await WebBrowser.openBrowserAsync(authorization_url);
    } catch (e: any) {
      Alert.alert('LinkedIn', e.message);
    }
  };

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Hire your AI Agent</Text>
        <Text style={styles.subtitle}>
          Dexter plans, writes, and publishes thought-leadership content on your social accounts.
        </Text>
      </View>

      <AuthTextInput
        label="Full Name"
        icon="person-outline"
        placeholder="Alex Mercer"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <AuthTextInput
        label="Work Email"
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
        textContentType="newPassword"
      />

      <PrimaryButton title="Get Started" onPress={handleSignup} disabled={loading} />
      {loading && <ActivityIndicator color={colors.primaryLight} style={{ marginTop: spacing.sm }} />}

      <Divider label="or sign up with" />
      <OutlinedButton title="Continue with LinkedIn" icon="logo-linkedin" onPress={handleLinkedIn} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/login" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primaryLight, fontWeight: '700' },
});
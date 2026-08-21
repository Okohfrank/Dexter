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
import { colors, spacing, typography, fonts } from '../../src/theme';
import { login, getLinkedInAuthorizationUrl, getMe } from '../../src/api/auth';
import { listBusinesses } from '../../src/api/business';
import { listConnectedAccounts } from '../../src/api/oauth';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      useAuthStore.getState().setTokens({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      try {
        const me = await getMe();
        useAuthStore.getState().setAuth({
          user: me,
          access_token: res.access_token,
          refresh_token: res.refresh_token,
        });
      } catch {
        // Fallback
      }
      try {
        const businesses = await listBusinesses();
        if (businesses.length > 0) {
          useAppStore.getState().setBusiness(businesses[0]);
          const accounts = await listConnectedAccounts(businesses[0].id).catch(() => []);
          useAppStore.getState().setConnectedAccounts(accounts);
          router.replace('/(dashboard)');
        } else {
          router.replace('/(onboarding)');
        }
      } catch {
        router.replace('/(dashboard)');
      }
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = async () => {
    const me = useAuthStore.getState().user;
    if (!me) {
      Alert.alert('Log in first', 'Connect LinkedIn after logging in.');
      return;
    }
    try {
      const businessId = '00000000-0000-0000-0000-000000000000';
      const { authorization_url } = await getLinkedInAuthorizationUrl(businessId);
      await WebBrowser.openBrowserAsync(authorization_url);
      Alert.alert('LinkedIn', 'Complete sign-in in the browser.');
    } catch (e: any) {
      Alert.alert('LinkedIn', e.message);
    }
  };

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Dexter has been autonomously orchestrating your brand. Check in on your performance.
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

      <PrimaryButton title="Sign In" onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

      <Divider label="or continue with" />
      <OutlinedButton title="Continue with LinkedIn" icon="logo-linkedin" onPress={handleLinkedIn} />

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
  header: { marginTop: spacing.xl, marginBottom: spacing.xxl },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});
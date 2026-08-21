import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import {
  AuthScreen,
  BrandMark,
  AuthTextInput,
  PrimaryButton,
  OutlinedButton,
  Divider,
} from '../../src/components/ui';
import { colors, spacing, typography, fonts, radii } from '../../src/theme';
import { login, register, getMe } from '../../src/api/auth';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { listConnectedAccounts, mockConnectAccount } from '../../src/api/oauth';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password, or tap "Quick Demo Sign-In" below.');
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

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      const demoEmail = 'founder@dexter.ai';
      const demoPass = 'Password123!';
      setEmail(demoEmail);
      setPassword(demoPass);

      let res;
      try {
        res = await login(demoEmail, demoPass);
      } catch {
        res = await register(demoEmail, demoPass, 'Alex Mercer');
      }

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
      } catch {}

      try {
        const businesses = await listBusinesses();
        if (businesses.length > 0) {
          useAppStore.getState().setBusiness(businesses[0]);
          let accounts = await listConnectedAccounts(businesses[0].id).catch(() => []);
          if (accounts.length === 0) {
            const mockAcc = await mockConnectAccount(businesses[0].id, 'linkedin');
            accounts = [mockAcc];
          }
          useAppStore.getState().setConnectedAccounts(accounts);
          router.replace('/(dashboard)');
        } else {
          const newBiz = await createBusiness({ name: 'Dexter SaaS Studio' });
          useAppStore.getState().setBusiness(newBiz);
          const mockAcc = await mockConnectAccount(newBiz.id, 'linkedin');
          useAppStore.getState().setConnectedAccounts([mockAcc]);
          router.replace('/(dashboard)');
        }
      } catch {
        router.replace('/(dashboard)');
      }
    } catch (e: any) {
      Alert.alert('Demo Mode', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <BrandMark />
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Dexter autonomously orchestrates your brand. Check in on your performance.
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

      <Divider label="or instant preview" />
      <OutlinedButton title="1-Tap Demo Sign-In (Alex Mercer)" icon="flash-outline" onPress={handleQuickDemo} />

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
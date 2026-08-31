import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  AuthTextInput,
  PrimaryButton,
  OutlinedButton,
  Divider,
  SegmentedControl,
} from '../../src/components/ui';
import { colors, spacing, typography, fonts } from '../../src/theme';
import { login, register, getMe } from '../../src/api/auth';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { listConnectedAccounts } from '../../src/api/oauth';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';

type LoginMode = 'phone' | 'email';

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const identifier = mode === 'email' ? email : phone;
    if (!identifier || !password) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const loginEmail = mode === 'email' ? email.trim() : `${phone.trim()}@dexter.local`;
      const res = await login(loginEmail, password);
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

  const handleGoogleLogin = () => {
    Alert.alert('Google Sign-In', 'Google sign-in coming soon.');
  };

  const handleFacebookLogin = () => {
    Alert.alert('Facebook Sign-In', 'Facebook sign-in coming soon.');
  };

  return (
    <AuthScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to access your account</Text>
      </View>

      <SegmentedControl
        segments={[
          { key: 'phone', label: 'Phone Number' },
          { key: 'email', label: 'Email' },
        ]}
        selected={mode}
        onChange={(key) => setMode(key as LoginMode)}
      />

      <View style={styles.fieldsGap} />

      {mode === 'phone' ? (
        <AuthTextInput
          label="Phone Number"
          placeholder="+8801775472701"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      ) : (
        <AuthTextInput
          label="Email"
          placeholder="you@company.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
      )}

      <AuthTextInput
        label="Password"
        placeholder="••••••••"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />

      <View style={styles.optionsRow}>
        <Pressable
          style={styles.checkbox}
          onPress={() => setRemember(!remember)}
          hitSlop={8}
        >
          <View style={[styles.checkboxBox, remember && styles.checkboxChecked]}>
            {remember && <Ionicons name="checkmark" size={12} color="#000000" />}
          </View>
          <Text style={styles.checkboxLabel}>Remember me</Text>
        </Pressable>
        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.forgotText}>Forget password?</Text>
          </Pressable>
        </Link>
      </View>

      <PrimaryButton title="Log In" onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator color="#000000" style={{ marginTop: spacing.sm }} />}

      <Divider label="Or Sign In With" />

      <View style={styles.socialRow}>
        <Pressable style={styles.socialBtn} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={18} color="#000000" />
          <Text style={styles.socialBtnText}>Google</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={handleFacebookLogin}>
          <Ionicons name="logo-facebook" size={18} color="#000000" />
          <Text style={styles.socialBtnText}>Facebook</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/signup" asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>
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
  fieldsGap: {
    height: spacing.xl,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#CDDC39',
    borderColor: '#CDDC39',
  },
  checkboxLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#000000',
  },
  forgotText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
  },
  footerLink: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: '#000000',
  },
});

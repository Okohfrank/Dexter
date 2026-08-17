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
  Checkbox,
} from '../../src/components/ui';
import { colors, spacing, typography } from '../../src/theme';
import { register, getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { useAuthStore } from '../../src/api/client';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!agreed) return;
    if (!email || !password || !name) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(email.trim(), password, name.trim());
      useAuthStore.getState().setAuth({
        user: res.user,
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      Alert.alert(
        'Account created',
        res.user.is_verified
          ? 'You\'re all set!'
          : 'Check your email to verify your account.',
        [{
          text: 'OK',
          onPress: () => router.replace('/(onboarding)'),
        }],
      );
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = async () => {
    const me = useAuthStore.getState().user;
    if (!me) {
      Alert.alert('Log in first', 'Connect LinkedIn after signing in.');
      return;
    }
    try {
      // A real business id is needed; wire this to the user's active business.
      const businessId = '00000000-0000-0000-0000-000000000000';
      const { authorization_url } = await getLinkedInAuthorizationUrl(businessId);
      await WebBrowser.openBrowserAsync(authorization_url);
      // The backend /oauth/linkedin/callback handles the redirect server-side.
      Alert.alert('LinkedIn', 'Complete sign-in in the browser.');
    } catch (e: any) {
      Alert.alert('LinkedIn', e.message);
    }
  };

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
        disabled={!agreed || loading}
        onPress={agreed ? handleCreate : undefined}
      />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

      <Divider label="or continue with" />
      <OutlinedButton title="Continue with LinkedIn" icon="logo-linkedin" onPress={handleLinkedIn} />

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
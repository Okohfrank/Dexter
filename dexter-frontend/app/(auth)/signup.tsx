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
    if (!email || !password || !fullName.trim()) {
      Alert.alert('Missing info', 'Please enter your full name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(email.trim(), password, fullName.trim());
      useAuthStore.getState().setAuth({
        user: res.user,
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      router.replace('/(onboarding)');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message || 'Could not connect to backend server. Please check your backend terminal.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedIn = async () => {
    Alert.alert(
      'LinkedIn Sign Up',
      'Please sign up with your name and email first, then link your LinkedIn account inside the onboarding channel setup!',
    );
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
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

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
  footerLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
});     }
      } catch {
        biz = {
          id: 'biz_dexter_studio',
          user_id: demoUser.id,
          name: 'Dexter AI Studio',
          industry: 'AI & SaaS Growth',
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }

      useAppStore.getState().setBusiness(biz);

      let accounts = [];
      try {
        accounts = await listConnectedAccounts(biz.id);
        if (accounts.length === 0) {
          const mockAcc = await mockConnectAccount(biz.id, 'linkedin');
          accounts = [mockAcc];
        }
      } catch {
        accounts = [
          {
            id: 'acc_linkedin_alex',
            business_id: biz.id,
            platform: 'linkedin' as const,
            platform_user_id: 'urn:li:person:alex_mercer_demo',
            display_name: 'Alex Mercer (LinkedIn Verified)',
            profile_url: 'https://linkedin.com/in/alexmercer',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ];
      }

      useAppStore.getState().setConnectedAccounts(accounts);
      router.replace('/(dashboard)');
    } catch {
      router.replace('/(dashboard)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Dark Navy Canvas Header ── */}
      <SafeAreaView style={styles.topHeader} edges={['top', 'left', 'right']}>
        <View style={styles.topNavRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(dashboard)');
            }}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>
            {isLogin
              ? 'Go ahead and set up\nyour account'
              : 'Create your\naccount'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Sign in-up to enjoy the best managing experience
          </Text>
        </View>
      </SafeAreaView>

      {/* ── Bottom White Card Sheet ── */}
      <KeyboardAvoidingView
        style={styles.sheetWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetCard}>
          <ScrollView
            contentContainerStyle={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Segmented Pill Switcher */}
            <SegmentedControl
              options={[
                { value: 'login', label: 'Login' },
                { value: 'register', label: 'Register' },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val)}
              style={styles.segmentedControl}
            />

            {/* Form Inputs */}
            <View style={styles.form}>
              {!isLogin && (
                <Input
                  icon="person-outline"
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              )}

              <Input
                icon="mail-outline"
                placeholder={isLogin ? 'E-mail ID' : 'Email-ID'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Input
                icon="lock-closed-outline"
                placeholder="Password"
                secure
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                textContentType={isLogin ? 'password' : 'newPassword'}
              />

              {!isLogin && (
                <Input
                  icon="business-outline"
                  placeholder="Company / Brand Name"
                  value={phoneOrBrand}
                  onChangeText={setPhoneOrBrand}
                  autoCapitalize="words"
                />
              )}

              {isLogin && (
                <View style={styles.optionsRow}>
                  <Checkbox
                    checked={rememberMe}
                    onChange={setRememberMe}
                    label="Remember me"
                  />
                  <Pressable
                    onPress={() => router.push('/(auth)/forgot-password')}
                    hitSlop={8}
                  >
                    <Text style={styles.forgotLink}>Forget Password?</Text>
                  </Pressable>
                </View>
              )}

              {/* Primary Action Button */}
              <Button
                title={isLogin ? 'Login' : 'Register'}
                onPress={isLogin ? handleLogin : handleRegister}
                loading={loading}
                disabled={loading}
                variant="primary"
                style={styles.actionBtn}
              />

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>
                  {isLogin ? 'Or login with' : 'Or register with'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Row */}
              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialBtn}
                  onPress={handleQuickDemo}
                >
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={styles.socialBtnText}>1-Tap Demo</Text>
                </Pressable>

                <Pressable
                  style={styles.socialBtn}
                  onPress={() => {
                    Alert.alert(
                      'Google Register',
                      'Tap "1-Tap Demo" to explore instantly with Alex Mercer, or complete the form.'
                    );
                  }}
                >
                  <Ionicons name="logo-google" size={16} color="#EA4335" />
                  <Text style={styles.socialBtnText}>Google</Text>
                </Pressable>

                <Pressable
                  style={styles.socialBtn}
                  onPress={() => {
                    Alert.alert(
                      'Apple Sign In',
                      'Tap "1-Tap Demo" to explore instantly with Alex Mercer, or complete the form.'
                    );
                  }}
                >
                  <Ionicons name="logo-apple" size={16} color={colors.textPrimary} />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasDark,
  },
  topHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    gap: spacing[2],
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: fonts.displayBold,
    color: colors.textDark,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textDarkMuted,
  },

  // Bottom Sheet Card
  sheetWrapper: {
    flex: 1,
  },
  sheetCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    ...shadows.lg,
  },
  sheetScroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
  },
  segmentedControl: {
    marginBottom: spacing[5],
  },
  form: {
    gap: spacing[1],
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing[2],
    paddingHorizontal: 2,
  },
  forgotLink: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  actionBtn: {
    marginTop: spacing[3],
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  // Social Row
  socialRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: 12,
    ...shadows.sm,
  },
  socialBtnText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
  },
});
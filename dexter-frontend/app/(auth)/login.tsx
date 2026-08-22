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
    const demoEmail = 'founder@dexter.ai';
    const demoPass = 'Password123!';
    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      let res;
      try {
        res = await login(demoEmail, demoPass);
      } catch {
        res = await register(demoEmail, demoPass, 'Alex Mercer').catch(() => ({
          access_token: 'demo_token_' + Date.now(),
          refresh_token: 'demo_refresh_' + Date.now(),
          token_type: 'bearer',
          user: {
            id: 'user_alex_mercer',
            email: demoEmail,
            full_name: 'Alex Mercer',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
          },
        }));
      }

      useAuthStore.getState().setTokens({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });

      const demoUser = (res as any).user || {
        id: 'user_alex_mercer',
        email: demoEmail,
        full_name: 'Alex Mercer',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
      };

      useAuthStore.getState().setAuth({
        user: demoUser,
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });

      let biz;
      try {
        const businesses = await listBusinesses();
        if (businesses.length > 0) {
          biz = businesses[0];
        } else {
          biz = await createBusiness({ name: 'Dexter SaaS Studio' });
        }
      } catch {
        biz = {
          id: 'biz_dexter_studio',
          user_id: demoUser.id,
          name: 'Dexter SaaS Studio',
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
});           {!isLogin && (
                <Input
                  icon="business-outline"
                  placeholder="Company / Brand Name"
                  value={phoneOrBrand}
                  onChangeText={setPhoneOrBrand}
                  autoCapitalize="words"
                />
              )}

              {/* Options Row (Remember me + Forgot Password) */}
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

              {/* Primary Action Button (Royal Blue #2563EB) */}
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
                      'Google Login',
                      'Tap "1-Tap Demo" to explore instantly with Alex Mercer, or use email login.'
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
                      'Tap "1-Tap Demo" to explore instantly with Alex Mercer, or use email login.'
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
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button } from '@/src/components/rnr/button';
import { Text as RNRText } from '@/src/components/rnr/text';
import { Input } from '@/src/components/rnr/input';
import { Icon } from '@/src/components/rnr/icon';
import { DatePickerField } from '@/src/components/ui';
import { dark, fonts } from '@/src/theme';
import { register } from '@/src/api/auth';
import { useAuthStore } from '@/src/api/client';

/* v2 signup — matches the Brilliant-style login: centered title,
 * Apple/Google row, OR divider, stacked inputs, indigo primary. */
export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!email.trim() || !password || !firstName.trim()) {
      Alert.alert('Missing info', 'Please enter your first name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await register(email.trim(), password, fullName);
      useAuthStore.getState().setAuth({
        user: res.user,
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      router.replace('/(onboarding)');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message || 'Could not connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = () => {
    Alert.alert('Apple Sign-Up', 'Apple sign-up coming soon.');
  };

  const handleGoogleSignup = () => {
    Alert.alert('Google Sign-Up', 'Google sign-up coming soon.');
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Hire your AI employee for LinkedIn growth.
            </Text>

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialBtn}
                onPress={handleAppleSignup}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Apple"
              >
                <Ionicons name="logo-apple" size={24} color={dark.ink} />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={handleGoogleSignup}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Google"
              >
                <Ionicons name="logo-google" size={22} color={dark.ink} />
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Input
                    placeholder="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    placeholderTextColor={dark.inkFaint}
                  />
                </View>
                <View style={styles.nameField}>
                  <Input
                    placeholder="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    placeholderTextColor={dark.inkFaint}
                  />
                </View>
              </View>

              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholderTextColor={dark.inkFaint}
              />

              <DatePickerField
                label=""
                value={birthDate}
                onChange={setBirthDate}
                placeholder="Date of birth"
              />

              <Input
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={dark.inkFaint}
              />

              <View>
                <Input
                  placeholder="Set password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  placeholderTextColor={dark.inkFaint}
                />
                <Pressable
                  onPress={() => setShowPw((s) => !s)}
                  hitSlop={12}
                  style={styles.eye}
                  accessibilityRole="button"
                  accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon
                    as={showPw ? EyeOff : Eye}
                    size={18}
                    color={dark.inkSoft}
                  />
                </Pressable>
              </View>

              <Button
                onPress={handleSignup}
                disabled={loading}
                className="min-h-[60px] w-full"
              >
                <RNRText className="text-base font-semibold">
                  {loading ? 'Creating account…' : 'Sign up'}
                </RNRText>
              </Button>
            </View>
            {loading && (
              <ActivityIndicator
                color={dark.accent}
                style={{ marginTop: 12 }}
              />
            )}

            <View style={styles.bottomSpacer} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1, backgroundColor: dark.canvas },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  bottomSpacer: { flexGrow: 1, minHeight: 32 },
  title: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: dark.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: dark.inkSoft,
    textAlign: 'center',
    marginBottom: 28,
  },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  socialBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dark.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    minHeight: 62,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: dark.hairline },
  dividerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1,
    color: dark.inkFaint,
  },
  form: { gap: 16 },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  eye: { position: 'absolute', right: 18, top: 15 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: dark.inkSoft,
  },
  footerLink: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
    textDecorationLine: 'underline',
  },
});

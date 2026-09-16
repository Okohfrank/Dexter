import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Eye, EyeOff } from "lucide-react-native";
import { Button } from "@/src/components/rnr/button";
import { Text as RNRText } from "@/src/components/rnr/text";
import { Input } from "@/src/components/rnr/input";
import { Icon } from "@/src/components/rnr/icon";
import { dark, fonts } from "@/src/theme";
import { login, getMe } from "@/src/api/auth";
import { listBusinesses } from "@/src/api/business";
import { listConnectedAccounts } from "@/src/api/oauth";
import { useAuthStore } from "@/src/api/client";
import { useAppStore } from "@/src/store/app";

type LoginMode = "phone" | "email";

/* v2 login — Brilliant-style centered sign-in (Mobbin ref) on the
 * Dexter dark system: tonal surfaces, hairlines, indigo primary. */
export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const identifier = mode === "email" ? email : phone;
    if (!identifier || !password) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const loginEmail =
        mode === "email" ? email.trim() : `${phone.trim()}@dexter.local`;
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
          const accounts = await listConnectedAccounts(businesses[0].id).catch(
            () => [],
          );
          useAppStore.getState().setConnectedAccounts(accounts);
          router.replace("/(dashboard)");
        } else {
          router.replace("/(onboarding)");
        }
      } catch {
        router.replace("/(dashboard)");
      }
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert("Apple Sign-In", "Apple sign-in coming soon.");
  };

  const handleGoogleLogin = () => {
    Alert.alert("Google Sign-In", "Google sign-in coming soon.");
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSpacer} />

            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Your AI employee is ready to work.
            </Text>

            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialBtn}
                onPress={handleAppleLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Apple"
              >
                <Ionicons name="logo-apple" size={24} color={dark.ink} />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                onPress={handleGoogleLogin}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
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
              <View style={styles.segTrack}>
                {(
                  [
                    { key: "phone" as LoginMode, label: "Phone number" },
                    { key: "email" as LoginMode, label: "Email" },
                  ]
                ).map((opt) => {
                  const active = opt.key === mode;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.seg, active && styles.segActive]}
                      onPress={() => setMode(opt.key)}
                    >
                      <Text
                        style={[styles.segLabel, active && styles.segLabelActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {mode === "phone" ? (
                <Input
                  placeholder="+8801775472701"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  placeholderTextColor={dark.inkFaint}
                />
              ) : (
                <Input
                  placeholder="you@company.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholderTextColor={dark.inkFaint}
                />
              )}

              <View>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  placeholderTextColor={dark.inkFaint}
                />
                <Pressable
                  onPress={() => setShowPw((s) => !s)}
                  hitSlop={12}
                  style={styles.eye}
                  accessibilityRole="button"
                  accessibilityLabel={showPw ? "Hide password" : "Show password"}
                >
                  <Icon
                    as={showPw ? EyeOff : Eye}
                    size={18}
                    color={dark.inkSoft}
                  />
                </Pressable>
              </View>

              <Button
                onPress={handleLogin}
                disabled={loading}
                className="min-h-[60px] w-full"
              >
                <RNRText className="text-base font-semibold">
                  {loading ? "Signing in…" : "Sign in"}
                </RNRText>
              </Button>
            </View>
            {loading && (
              <ActivityIndicator
                color={dark.accent}
                style={{ marginTop: 12 }}
              />
            )}

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable hitSlop={8} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </Link>

            <View style={styles.bottomSpacer} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>No account yet? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign up</Text>
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
    paddingBottom: 32,
  },
  topSpacer: { flexGrow: 0.6, minHeight: 48 },
  bottomSpacer: { flexGrow: 1, minHeight: 32 },
  title: {
    fontFamily: "InterTight_700Bold",
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: dark.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: dark.inkSoft,
    textAlign: "center",
    marginBottom: 28,
  },
  socialRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  socialBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dark.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    minHeight: 62,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  segTrack: {
    flexDirection: "row",
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    padding: 4,
  },
  form: { gap: 16 },
  seg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 999,
  },
  segActive: { backgroundColor: dark.surfaceElevated },
  segLabel: { fontFamily: fonts.medium, fontSize: 14, color: dark.inkSoft },
  segLabelActive: { fontFamily: fonts.semibold, color: dark.ink },
  eye: { position: "absolute", right: 18, top: 15 },
  forgotBtn: { alignSelf: "center", marginTop: 28, padding: 8 },
  forgotText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: dark.ink,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    textDecorationLine: "underline",
  },
});

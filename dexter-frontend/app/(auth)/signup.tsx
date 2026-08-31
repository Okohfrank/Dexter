import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AuthScreen,
  AuthTextInput,
  PrimaryButton,
  SegmentedControl,
} from '../../src/components/ui';
import { colors, spacing, fonts } from '../../src/theme';
import { register } from '../../src/api/auth';
import { useAuthStore } from '../../src/api/client';

type SignupMode = 'signup' | 'login';

export default function SignupScreen() {
  const [mode, setMode] = useState<SignupMode>('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <AuthScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Get Started Now</Text>
        <Text style={styles.subtitle}>
          Create an account or log in to explore about our app
        </Text>
      </View>

      <SegmentedControl
        segments={[
          { key: 'signup', label: 'Sign Up' },
          { key: 'login', label: 'Log In' },
        ]}
        selected={mode}
        onChange={(key) => {
          const k = key as SignupMode;
          setMode(k);
          if (k === 'login') router.replace('/login');
        }}
      />

      <View style={styles.fieldsGap} />

      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <AuthTextInput
            label="Fast Name"
            placeholder="Raj"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.nameField}>
          <AuthTextInput
            label="Last Name"
            placeholder="Sarkar"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>
      </View>

      <AuthTextInput
        label="Email"
        placeholder="sarkarraj0766@gmail.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <AuthTextInput
        label="Birth of date"
        placeholder="15/06/2000"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
      />

      <AuthTextInput
        label="Password"
        placeholder="(454) 726-0592"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <AuthTextInput
        label="Set Password"
        placeholder="••••••••"
        secure
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        textContentType="newPassword"
      />

      <PrimaryButton title="Sign Up" onPress={handleSignup} disabled={loading} />
      {loading && <ActivityIndicator color="#000000" style={{ marginTop: spacing.sm }} />}
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
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
});

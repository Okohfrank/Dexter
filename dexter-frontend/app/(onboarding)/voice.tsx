import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../src/theme';
import { useAppStore } from '../../src/store/app';

const BAR_COUNT = 18;

/**
 * Voice interview shell (PRD §3.2).
 *
 * Voice transcription isn't implemented on the backend yet (MisoLabs.ai is
 * future work). This screen provides the full mic + waveform UI but wires it
 * to a "coming soon" state rather than blocking the flow.
 */
export default function VoiceInterviewScreen() {
  const router = useRouter();
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const anims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2)),
  ).current;

  useEffect(() => {
    if (!listening) {
      anims.forEach((a) => a.stopAnimation());
      return;
    }
    const loop = anims.map((a) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 1,
            duration: 450 + Math.random() * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: 0.2,
            duration: 450 + Math.random() * 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loop.forEach((l) => l.start());
    return () => loop.forEach((l) => l.stop());
  }, [listening]);

  const handleMicPress = () => {
    if (!listening) {
      setListening(true);
      setRecording(true);
    } else {
      setListening(false);
      setRecording(false);
      Alert.alert(
        'Voice interviews are coming soon',
        'Text transcription isn\'t wired up yet. Switch to text mode to try the interview now.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Use text instead',
            onPress: () => {
              setInterviewMode('text');
              router.replace('/(onboarding)/interview');
            },
          },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Voice interview</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Step 3 of 5</Text>
        <Text style={styles.subtitle}>
          {listening ? 'Listening… answer naturally.' : 'Tap the mic and talk to Dexter.'}
        </Text>

        <View style={styles.waveform}>
          {anims.map((a, i) => (
            <Animated.View
              key={i}
              style={[styles.bar, { transform: [{ scaleY: a }] }, listening && styles.barActive]}
            />
          ))}
        </View>

        <Pressable style={[styles.micBtn, listening && styles.micBtnActive]} onPress={handleMicPress}>
          <Ionicons
            name={recording ? 'stop' : 'mic'}
            size={40}
            color={listening ? colors.textInverse : colors.primary}
          />
        </Pressable>

        <View style={styles.soonBadge}>
          <Ionicons name="flask-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.soonText}>
            Voice is in preview — tap to see what's next, or use text mode.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.heading, color: colors.textPrimary },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  subtitle: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 90,
    marginVertical: spacing.xxl,
  },
  bar: {
    width: 6,
    height: 70,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  barActive: { backgroundColor: colors.primary },
  micBtn: {
    width: 92,
    height: 92,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...{ shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  },
  micBtnActive: { backgroundColor: colors.primary },
  soonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  soonText: { flexShrink: 1, ...typography.caption, color: colors.primaryDark },
});
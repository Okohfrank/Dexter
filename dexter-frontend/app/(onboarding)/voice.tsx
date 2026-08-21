import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { transcribeAudio } from '../../src/api/voice';
import { Card, Pill } from '../../src/components/ui';

const BAR_COUNT = 24;

export default function VoiceInterviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);

  const anims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15)),
  ).current;

  useEffect(() => {
    if (!recording) {
      anims.forEach((a) => a.stopAnimation());
      return;
    }
    const loops = anims.map((a) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 250 + Math.random() * 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: 0.15,
            duration: 250 + Math.random() * 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [recording]);

  const toggleRecording = async () => {
    if (!recording) {
      setRecording(true);
      setTranscriptPreview(null);
    } else {
      setRecording(false);
      setTranscribing(true);
      try {
        const result = await transcribeAudio('mock-recording-uri', business?.id);
        setTranscriptPreview(result.transcript);
      } catch (e: any) {
        Alert.alert('Audio Error', e.message);
      } finally {
        setTranscribing(false);
      }
    }
  };

  const handleProceedToBrain = () => {
    router.push('/(onboarding)/brain');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Voice Interview</Text>
          <Text style={styles.headerSubtitle}>MisoLabs Voice Agent Engine</Text>
        </View>
        <Pill label="BETA" variant="primary" icon="sparkles" />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Step 2 of 5</Text>
        <Text style={styles.title}>Talk to Dexter</Text>
        <Text style={styles.subtitle}>
          {recording
            ? 'Dexter is listening… Speak freely about your product, audience, and goals.'
            : 'Tap the microphone to begin your voice onboarding session.'}
        </Text>

        {/* Waveform */}
        <Card style={styles.waveformCard} elevated={recording}>
          <View style={styles.waveform}>
            {anims.map((a, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  { transform: [{ scaleY: a }] },
                  recording && styles.barActive,
                ]}
              />
            ))}
          </View>
        </Card>

        {/* Mic Button */}
        <View style={styles.micContainer}>
          <Pressable
            style={[styles.micBtn, recording && styles.micBtnActive]}
            onPress={toggleRecording}
            disabled={transcribing}
          >
            {transcribing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={recording ? 'stop' : 'mic'}
                size={38}
                color="#FFFFFF"
              />
            )}
          </Pressable>
        </View>

        {/* Transcript / Switch */}
        {transcriptPreview ? (
          <Card style={styles.transcriptCard} highlighted>
            <View style={styles.transcriptHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.positive} />
              <Text style={styles.transcriptTitle}>Interview Transcribed</Text>
            </View>
            <Text style={styles.transcriptText}>"{transcriptPreview}"</Text>
            <Pressable style={styles.proceedBtn} onPress={handleProceedToBrain}>
              <Text style={styles.proceedBtnText}>Review Business Brain</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </Card>
        ) : (
          <Pressable
            style={styles.switchModeBtn}
            onPress={() => {
              setInterviewMode('text');
              router.replace('/(onboarding)/interview');
            }}
          >
            <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
            <Text style={styles.switchModeText}>Prefer typing? Switch to text interview</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitleWrap: { flex: 1, marginLeft: spacing.md },
  headerTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 17 },
  headerSubtitle: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, textAlign: 'center', color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    maxWidth: 320,
  },
  waveformCard: {
    width: '100%',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 80,
  },
  bar: {
    width: 5,
    height: 70,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  micBtnActive: {
    backgroundColor: colors.negative,
    borderColor: colors.negativeBorder,
  },
  transcriptCard: {
    width: '100%',
    gap: spacing.sm,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  transcriptText: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    ...shadows.primaryBtn,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchModeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
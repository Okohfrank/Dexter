import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { connectVoiceStream } from '../../src/api/voice';
import { Card, Pill } from '../../src/components/ui';

const BAR_COUNT = 24;

export default function VoiceInterviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBrain = useAppStore((s) => s.setBrain);
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);

  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'listening' | 'processing' | 'speaking'>('speaking');
  const [assistantMessage, setAssistantMessage] = useState<string>('Connecting to Dexter Voice Stream…');
  const [userSpeechInput, setUserSpeechInput] = useState<string>('');
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);

  const streamRef = useRef<ReturnType<typeof connectVoiceStream> | null>(null);

  const anims = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15)),
  ).current;

  // Start animated waveform
  useEffect(() => {
    const isWaving = recording || agentStatus === 'speaking';
    if (!isWaving) {
      anims.forEach((a) => a.stopAnimation());
      return;
    }
    const loops = anims.map((a) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 220 + Math.random() * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: 0.15,
            duration: 220 + Math.random() * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [recording, agentStatus]);

  // Connect WebSocket on mount
  useEffect(() => {
    const stream = connectVoiceStream({
      onOpen: () => {
        setConnected(true);
      },
      onAssistantReply: (text, state) => {
        if (text) setAssistantMessage(text);
        if (state) setAgentStatus(state);
      },
      onBrainDistilled: (brain) => {
        setBrain(brain as any);
        setTranscriptPreview('Dexter has distilled your Business Brain from this live voice interview.');
      },
      onError: () => {
        setAssistantMessage("Hi! I'm Dexter. Tell me about your business, target audience, and primary goals for LinkedIn.");
        setAgentStatus('listening');
      },
    });

    streamRef.current = stream;
    return () => {
      stream.close();
    };
  }, [setBrain]);

  const handleSendSpeech = (textToSend?: string) => {
    const text = (textToSend ?? userSpeechInput).trim();
    if (!text) return;
    setUserSpeechInput('');
    setAgentStatus('processing');
    setRecording(false);
    streamRef.current?.sendSpeechText(text);
  };

  const handleFinish = () => {
    streamRef.current?.sendFinish();
    setTimeout(() => {
      router.push('/(onboarding)/brain');
    }, 800);
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
          <Text style={styles.headerTitle}>Live Voice Stream</Text>
          <Text style={styles.headerSubtitle}>Real-time MisoLabs Voice Engine</Text>
        </View>
        <Pill label={agentStatus.toUpperCase()} variant={agentStatus === 'speaking' ? 'primary' : 'positive'} icon="sparkles" />
      </View>

      <View style={styles.body}>
        <Text style={styles.eyebrow}>Step 2 of 5</Text>
        <Text style={styles.title}>Talk with Dexter</Text>
        <Text style={styles.subtitle}>
          Speak naturally or tap quick responses. Dexter listens and distills your Business Brain.
        </Text>

        {/* Live Assistant Bubble Card */}
        <Card style={styles.speechBubbleCard} elevated>
          <View style={styles.assistantRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.assistantTextWrap}>
              <Text style={styles.assistantName}>Dexter AI</Text>
              <Text style={styles.assistantSpeech}>{assistantMessage}</Text>
            </View>
          </View>
        </Card>

        {/* Animated Waveform */}
        <Card style={styles.waveformCard} elevated={agentStatus === 'speaking' || recording}>
          <View style={styles.waveform}>
            {anims.map((a, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  { transform: [{ scaleY: a }] },
                  (recording || agentStatus === 'speaking') && styles.barActive,
                ]}
              />
            ))}
          </View>
        </Card>

        {/* Quick Voice Prompt Buttons */}
        <View style={styles.quickChips}>
          <Pressable
            style={styles.quickChip}
            onPress={() => handleSendSpeech('We offer B2B AI social workflows for tech founders.')}
          >
            <Text style={styles.quickChipText}>"We are a B2B SaaS for founders"</Text>
          </Pressable>
          <Pressable
            style={styles.quickChip}
            onPress={() => handleSendSpeech('Our goal is to reach 1,000 executive followers and drive inbound demos.')}
          >
            <Text style={styles.quickChipText}>"Goal: 1k followers & inbound demo leads"</Text>
          </Pressable>
        </View>

        {/* Speech Input & Mic Actions */}
        <View style={styles.speechInputRow}>
          <TextInput
            style={styles.speechInput}
            placeholder="Speak or type your response…"
            placeholderTextColor={colors.textMuted}
            value={userSpeechInput}
            onChangeText={setUserSpeechInput}
            onSubmitEditing={() => handleSendSpeech()}
          />
          <Pressable
            style={[styles.micBtn, (!userSpeechInput.trim() && !recording) && styles.micBtnIdle]}
            onPress={() => {
              if (userSpeechInput.trim()) {
                handleSendSpeech();
              } else {
                setRecording(!recording);
                if (!recording) {
                  handleSendSpeech('Our brand voice is authoritative, candid, and data-driven.');
                }
              }
            }}
          >
            <Ionicons name={userSpeechInput.trim() ? 'send' : recording ? 'stop' : 'mic'} size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Brain Distillation Status */}
        {transcriptPreview ? (
          <Card style={styles.transcriptCard} highlighted>
            <View style={styles.transcriptHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.positive} />
              <Text style={styles.transcriptTitle}>Brain Distilled</Text>
            </View>
            <Text style={styles.transcriptText}>{transcriptPreview}</Text>
            <Pressable style={styles.proceedBtn} onPress={handleProceedToBrain}>
              <Text style={styles.proceedBtnText}>Review Business Brain</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </Card>
        ) : (
          <View style={styles.footerActions}>
            <Pressable style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishBtnText}>Done Talking • Synthesize Brain</Text>
            </Pressable>
            <Pressable
              style={styles.switchModeBtn}
              onPress={() => {
                setInterviewMode('text');
                router.replace('/(onboarding)/interview');
              }}
            >
              <Text style={styles.switchModeText}>Prefer typing? Switch to chat</Text>
            </Pressable>
          </View>
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
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  speechBubbleCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantTextWrap: { flex: 1 },
  assistantName: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  assistantSpeech: { ...typography.body, color: colors.textPrimary, fontSize: 14, lineHeight: 21, marginTop: 2 },

  waveformCard: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
  },
  bar: {
    width: 5,
    height: 55,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  barActive: {
    backgroundColor: colors.primary,
  },

  quickChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  quickChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  quickChipText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },

  speechInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  speechInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  micBtnIdle: {
    backgroundColor: colors.primary,
  },

  transcriptCard: {
    width: '100%',
    gap: spacing.sm,
    padding: spacing.lg,
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

  footerActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  finishBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 13,
    ...shadows.primaryBtn,
  },
  finishBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  switchModeBtn: { paddingVertical: 4 },
  switchModeText: { ...typography.caption, color: colors.textMuted },
});
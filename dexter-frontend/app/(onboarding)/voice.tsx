import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { connectVoiceStream } from '../../src/api/voice';
import { GlassCard, GlassPill } from '../../src/components/ui';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ORB_SIZE = Math.min(SCREEN_W * 0.48, 200);

export default function VoiceInterviewScreen() {
  const router = useRouter();
  const setBrain = useAppStore((s) => s.setBrain);
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);

  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'listening' | 'processing' | 'speaking'>('speaking');
  const [assistantMessage, setAssistantMessage] = useState<string>('Connecting to Dexter Voice Stream…');
  const [userSpeechInput, setUserSpeechInput] = useState<string>('');
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const streamRef = useRef<ReturnType<typeof connectVoiceStream> | null>(null);

  // Animated values for ChatGPT-style fluid glowing Orb
  const orbScale = useRef(new Animated.Value(1)).current;
  const haloScale1 = useRef(new Animated.Value(1)).current;
  const haloScale2 = useRef(new Animated.Value(1)).current;
  const haloOpacity1 = useRef(new Animated.Value(0.4)).current;
  const haloOpacity2 = useRef(new Animated.Value(0.2)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;

  // ChatGPT Orb Animation Loop
  useEffect(() => {
    // Rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    let pulseLoop: Animated.CompositeAnimation;

    if (agentStatus === 'speaking') {
      // Energetic undulating pulse when AI is speaking
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(orbScale, {
              toValue: 1.18,
              duration: 550,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 0.94,
              duration: 500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 1.12,
              duration: 450,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 1.0,
              duration: 400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloScale1, {
              toValue: 1.45,
              duration: 1000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(haloScale1, {
              toValue: 1.0,
              duration: 900,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloOpacity1, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity1, {
              toValue: 0.2,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloScale2, {
              toValue: 1.75,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(haloScale2, {
              toValue: 1.0,
              duration: 1200,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloOpacity2, {
              toValue: 0.35,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity2, {
              toValue: 0.05,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    } else if (agentStatus === 'listening') {
      // Soft breathing glow when listening to user
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(orbScale, {
              toValue: 1.08,
              duration: 1600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 0.98,
              duration: 1600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloScale1, {
              toValue: 1.25,
              duration: 1600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(haloScale1, {
              toValue: 1.0,
              duration: 1600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloOpacity1, {
              toValue: 0.45,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity1, {
              toValue: 0.15,
              duration: 1600,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    } else {
      // Thinking mode: subtle shimmering
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(orbScale, {
              toValue: 1.04,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 0.96,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloOpacity1, {
              toValue: 0.5,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity1, {
              toValue: 0.2,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    }

    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, [agentStatus]);

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
    setTextModalVisible(false);
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

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (!isMuted) {
      setAgentStatus('listening');
    }
  };

  const spin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar (ChatGPT Style) */}
      <View style={styles.topBar}>
        <Pressable style={styles.topIconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.labelPrimary} />
        </Pressable>

        <View style={styles.agentTitleCluster}>
          <View style={styles.statusLiveDot} />
          <Text style={styles.agentTitleText}>Dexter</Text>
          <Text style={styles.agentModeBadge}>Live</Text>
        </View>

        <Pressable
          style={styles.topIconBtn}
          onPress={() => {
            setInterviewMode('text');
            router.replace('/(onboarding)/interview');
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.labelSecondary} />
        </Pressable>
      </View>

      {/* Main Center Area — Fluid ChatGPT Voice Orb */}
      <View style={styles.centerContainer}>
        <View style={styles.orbWrapper}>
          {/* Outer Halo Layer 2 */}
          <Animated.View
            style={[
              styles.haloOuter,
              {
                transform: [{ scale: haloScale2 }],
                opacity: isMuted ? 0.05 : haloOpacity2,
                backgroundColor:
                  agentStatus === 'speaking'
                    ? '#007AFF'
                    : agentStatus === 'processing'
                    ? '#AF52DE'
                    : '#5AC8FA',
              },
            ]}
          />

          {/* Inner Halo Layer 1 */}
          <Animated.View
            style={[
              styles.haloInner,
              {
                transform: [{ scale: haloScale1 }],
                opacity: isMuted ? 0.08 : haloOpacity1,
                backgroundColor:
                  agentStatus === 'speaking'
                    ? '#007AFF'
                    : agentStatus === 'processing'
                    ? '#FF9500'
                    : '#34C759',
              },
            ]}
          />

          {/* Main Glowing Fluid Orb */}
          <Animated.View
            style={[
              styles.orbCore,
              {
                transform: [{ scale: orbScale }, { rotate: spin }],
                borderColor:
                  agentStatus === 'speaking'
                    ? 'rgba(0, 122, 255, 0.8)'
                    : agentStatus === 'processing'
                    ? 'rgba(175, 82, 222, 0.8)'
                    : 'rgba(255, 255, 255, 0.8)',
              },
            ]}
          >
            <View
              style={[
                styles.orbGradientSimulation,
                {
                  backgroundColor:
                    agentStatus === 'speaking'
                      ? '#007AFF'
                      : agentStatus === 'processing'
                      ? '#5856D6'
                      : isMuted
                      ? '#2C2C2E'
                      : '#FFFFFF',
                },
              ]}
            >
              {/* Internal Organic Ring */}
              <View style={styles.orbInnerCore}>
                <Ionicons
                  name={
                    isMuted
                      ? 'mic-off'
                      : agentStatus === 'speaking'
                      ? 'volume-high'
                      : agentStatus === 'processing'
                      ? 'sync'
                      : 'mic'
                  }
                  size={36}
                  color={agentStatus === 'listening' && !isMuted ? '#000000' : '#FFFFFF'}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Live Status Label */}
        <View style={styles.statusLabelWrap}>
          <Text style={styles.statusLabelText}>
            {isMuted
              ? 'Microphone muted'
              : agentStatus === 'speaking'
              ? 'Dexter is speaking…'
              : agentStatus === 'processing'
              ? 'Dexter is thinking…'
              : 'Listening… speak naturally'}
          </Text>
        </View>
      </View>

      {/* Subtitles / Live Transcript Area (ChatGPT floating text style) */}
      <View style={styles.subtitlesContainer}>
        {transcriptPreview ? (
          <GlassCard style={styles.brainReadyCard} highlighted elevated>
            <View style={styles.brainReadyHeader}>
              <Ionicons name="sparkles" size={18} color={colors.positive} />
              <Text style={styles.brainReadyTitle}>Business Brain Distilled!</Text>
            </View>
            <Text style={styles.brainReadyText}>{transcriptPreview}</Text>
            <Pressable style={styles.reviewBrainBtn} onPress={handleProceedToBrain}>
              <Text style={styles.reviewBrainText}>Review Strategy & Brain</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </GlassCard>
        ) : (
          <GlassCard style={styles.subtitlesCard}>
            <Text style={styles.subtitleCaption}>LIVE INTERACTION</Text>
            <Text style={styles.subtitleText} numberOfLines={4}>
              {assistantMessage}
            </Text>
          </GlassCard>
        )}
      </View>

      {/* Quick Prompts (Translucent Floating Pills) */}
      <View style={styles.quickPromptsRow}>
        <Pressable
          style={styles.promptPill}
          onPress={() => handleSendSpeech('We are a B2B SaaS building AI automations for founders.')}
        >
          <Text style={styles.promptPillText}>"B2B SaaS for founders"</Text>
        </Pressable>
        <Pressable
          style={styles.promptPill}
          onPress={() => handleSendSpeech('Our goal is 1,000 executive followers and demo requests.')}
        >
          <Text style={styles.promptPillText}>"1k followers & demos"</Text>
        </Pressable>
      </View>

      {/* Bottom Floating Control Dock (ChatGPT Style) */}
      <View style={styles.bottomDockWrapper}>
        <BlurView intensity={40} tint="dark" style={styles.bottomDockBlur}>
          <View style={styles.bottomDock}>
            {/* Keyboard / Text modal button */}
            <Pressable style={styles.dockCircleBtn} onPress={() => setTextModalVisible(true)}>
              <Ionicons name="keypad-outline" size={22} color={colors.labelPrimary} />
            </Pressable>

            {/* Center Mic Mute / Unmute Button */}
            <Pressable
              style={[
                styles.dockMainMicBtn,
                isMuted && styles.dockMainMicBtnMuted,
                agentStatus === 'listening' && !isMuted && styles.dockMainMicBtnActive,
              ]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={28}
                color={isMuted ? colors.negative : '#FFFFFF'}
              />
            </Pressable>

            {/* End / Done Button */}
            <Pressable style={styles.dockDoneBtn} onPress={handleFinish}>
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </BlurView>
      </View>

      {/* Quick Text Input Drawer Modal */}
      <Modal visible={textModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalOuter}>
            <BlurView intensity={50} tint="dark" style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Type to Dexter</Text>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setTextModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color={colors.labelPrimary} />
                  </Pressable>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Type your answer (e.g. products, target audience, voice)…"
                  placeholderTextColor={colors.labelTertiary}
                  value={userSpeechInput}
                  onChangeText={setUserSpeechInput}
                  multiline
                  autoFocus
                />
                <Pressable
                  style={[styles.modalSendBtn, !userSpeechInput.trim() && { opacity: 0.4 }]}
                  onPress={() => handleSendSpeech()}
                  disabled={!userSpeechInput.trim()}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  <Text style={styles.modalSendText}>Send to Dexter</Text>
                </Pressable>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  statusLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
  agentTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  agentModeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Center ChatGPT Orb ──
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrapper: {
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  haloOuter: {
    position: 'absolute',
    width: ORB_SIZE * 1.3,
    height: ORB_SIZE * 1.3,
    borderRadius: (ORB_SIZE * 1.3) / 2,
  },
  haloInner: {
    position: 'absolute',
    width: ORB_SIZE * 1.15,
    height: ORB_SIZE * 1.15,
    borderRadius: (ORB_SIZE * 1.15) / 2,
  },
  orbCore: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
  },
  orbGradientSimulation: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbInnerCore: {
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.7,
    borderRadius: (ORB_SIZE * 0.7) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabelWrap: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  statusLabelText: {
    ...typography.subheading,
    color: colors.labelSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // ── Subtitles / Transcript ──
  subtitlesContainer: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
  },
  subtitlesCard: {
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subtitleCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitleText: {
    ...typography.callout,
    color: colors.labelPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  brainReadyCard: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  brainReadyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brainReadyTitle: {
    ...typography.subheading,
    color: colors.positive,
    fontWeight: '700',
  },
  brainReadyText: {
    ...typography.caption,
    color: colors.labelPrimary,
    lineHeight: 18,
  },
  reviewBrainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    marginTop: 4,
    ...shadows.primaryBtn,
  },
  reviewBrainText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Quick Prompts ──
  quickPromptsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  promptPillText: {
    ...typography.caption2,
    color: colors.labelSecondary,
    fontSize: 11,
  },

  // ── Bottom Dock (ChatGPT Style) ──
  bottomDockWrapper: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
    borderRadius: radii.xxxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  bottomDockBlur: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockMainMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  dockMainMicBtnActive: {
    backgroundColor: colors.primary,
  },
  dockMainMicBtnMuted: {
    backgroundColor: colors.negativeSurface,
    borderWidth: 1.5,
    borderColor: colors.negativeBorder,
  },
  dockDoneBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.positive,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },

  // ── Text Modal ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalOuter: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    overflow: 'hidden',
  },
  modalBlur: {},
  modalContent: {
    padding: spacing.xxl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { ...typography.heading, color: colors.labelPrimary },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.labelPrimary,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    ...shadows.primaryBtn,
  },
  modalSendText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
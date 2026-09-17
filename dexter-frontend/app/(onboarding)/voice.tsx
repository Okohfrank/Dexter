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
import {
  X,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Check,
  ArrowUp,
  Lightbulb,
} from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { connectVoiceStream } from '../../src/api/voice';

const { width: SCREEN_W } = Dimensions.get('window');
const ORB_SIZE = Math.min(SCREEN_W * 0.48, 200);

/* v2 voice interview — dark live-call chrome. Stream, orb physics,
 * dock behavior, and brain hand-off logic unchanged. */
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

  // Animated values for fluid glowing Orb
  const orbScale = useRef(new Animated.Value(1)).current;
  const haloScale1 = useRef(new Animated.Value(1)).current;
  const haloScale2 = useRef(new Animated.Value(1)).current;
  const haloOpacity1 = useRef(new Animated.Value(0.4)).current;
  const haloOpacity2 = useRef(new Animated.Value(0.2)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;

  // Orb animation: energy follows conversation state so motion reads
  // as voice-reactive. Durations stay incommensurate (never visibly
  // looping); amplitude and rotation speed scale with state.
  useEffect(() => {
    const energy =
      agentStatus === 'speaking'
        ? { amp: 0.15, durA: 420, durB: 560, rotDur: 6000 }
        : agentStatus === 'listening'
          ? { amp: 0.07, durA: 1400, durB: 1800, rotDur: 14000 }
          : { amp: 0.035, durA: 650, durB: 800, rotDur: 9000 };

    const rotateLoop = Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: energy.rotDur,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    let pulseLoop: Animated.CompositeAnimation;

    if (isMuted) {
      // Muted: near-static, barely breathing.
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: 1.01,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 0.99,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    } else {
      // Speaking/listening/processing: layered wobble + traveling halo.
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(orbScale, {
              toValue: 1 + energy.amp,
              duration: energy.durA,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 1 - energy.amp * 0.7,
              duration: energy.durB,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 1 + energy.amp * 0.5,
              duration: Math.round(energy.durA * 0.8),
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orbScale, {
              toValue: 1,
              duration: Math.round(energy.durB * 0.7),
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloScale1, {
              toValue: 1.45,
              duration: energy.durB,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(haloScale1, {
              toValue: 1.0,
              duration: energy.durA,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(haloOpacity1, {
              toValue: 0.6,
              duration: energy.durB,
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity1, {
              toValue: 0.2,
              duration: energy.durA,
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
  }, [agentStatus, isMuted]);

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.topIconBtn} onPress={() => router.back()}>
          <Icon as={X} size={22} color={dark.ink} />
        </Pressable>

        <View style={styles.agentTitleCluster}>
          <View
            style={[
              styles.statusLiveDot,
              { backgroundColor: connected ? dark.positive : dark.inkFaint },
            ]}
          />
          <Text style={styles.agentTitleText}>Dexter</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>

        <Pressable
          style={styles.topIconBtn}
          onPress={() => {
            setInterviewMode('text');
            router.replace('/(onboarding)/interview');
          }}
        >
          <Icon as={MessageCircle} size={20} color={dark.inkSoft} />
        </Pressable>
      </View>

      {/* ── Orb ── */}
      <View style={styles.centerContainer}>
        <View style={styles.orbWrapper}>
          <Animated.View
            style={[
              styles.haloOuter,
              {
                transform: [{ scale: haloScale2 }],
                opacity: isMuted ? 0.03 : haloOpacity2,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.haloInner,
              {
                transform: [{ scale: haloScale1 }],
                opacity: isMuted ? 0.05 : haloOpacity1,
                backgroundColor: '#FFFFFF',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.orbCore,
              {
                transform: [{ scale: orbScale }],
                opacity: isMuted ? 0.35 : 1,
              },
            ]}
          >
            {/* ChatGPT-style silk: black core, counter-rotating white blobs */}
            <Animated.View
              style={[styles.silkSpinA, { transform: [{ rotate: spin }] }]}
            >
              <View style={styles.blobA} />
              <View style={styles.blobB} />
            </Animated.View>
            <Animated.View
              style={[styles.silkSpinB, { transform: [{ rotate: spin }] }]}
            >
              <View style={styles.blobC} />
            </Animated.View>
            <View style={styles.orbIconWrap}>
              <Icon
                as={
                  isMuted
                    ? MicOff
                    : agentStatus === 'speaking'
                      ? Volume2
                      : agentStatus === 'processing'
                        ? Loader2
                        : Mic
                }
                size={30}
                color="rgba(255,255,255,0.92)"
              />
            </View>
          </Animated.View>
        </View>

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

      {/* ── Subtitles / brain card ── */}
      <View style={styles.subtitlesContainer}>
        {transcriptPreview ? (
          <View style={styles.brainReadyCard}>
            <View style={styles.brainReadyHeader}>
              <Icon as={Lightbulb} size={18} color={dark.positive} />
              <Text style={styles.brainReadyTitle}>Business Brain Distilled!</Text>
            </View>
            <Text style={styles.brainReadyText}>{transcriptPreview}</Text>
            <Pressable style={styles.reviewBrainBtn} onPress={handleProceedToBrain}>
              <Text style={styles.reviewBrainText}>Review Strategy & Brain</Text>
              <Icon as={ArrowUp} size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.subtitlesCard}>
            <Text style={styles.subtitleCaption}>LIVE INTERACTION</Text>
            <Text style={styles.subtitleText} numberOfLines={4}>
              {assistantMessage}
            </Text>
          </View>
        )}
      </View>

      {/* ── Quick Prompts ── */}
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

      {/* ── Bottom Control Dock ── */}
      <View style={styles.bottomDockWrapper}>
        <View style={styles.bottomDock}>
          <Pressable style={styles.dockCircleBtn} onPress={() => setTextModalVisible(true)}>
            <Icon as={MessageCircle} size={22} color={dark.ink} />
          </Pressable>

          <Pressable
            style={[styles.dockMainMicBtn, isMuted && styles.dockMainMicBtnMuted]}
            onPress={toggleMute}
          >
            <Icon
              as={isMuted ? MicOff : Mic}
              size={28}
              color={isMuted ? dark.negative : '#FFFFFF'}
            />
          </Pressable>

          <Pressable style={styles.dockDoneBtn} onPress={handleFinish}>
            <Icon as={Check} size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* ── Text Input Sheet ── */}
      <Modal visible={textModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Type to Dexter</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setTextModalVisible(false)}
              >
                <Icon as={X} size={20} color={dark.ink} />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Type your answer (e.g. products, target audience, voice)…"
              placeholderTextColor={dark.inkFaint}
              value={userSpeechInput}
              onChangeText={setUserSpeechInput}
              multiline
              autoFocus
            />
            <Pressable
              style={styles.modalSendBtn}
              onPress={() => handleSendSpeech()}
              disabled={!userSpeechInput.trim()}
            >
              <Icon as={ArrowUp} size={18} color="#FFFFFF" />
              <Text style={styles.modalSendText}>Send to Dexter</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ORB_R = ORB_SIZE / 2;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: dark.canvas },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  statusLiveDot: { width: 8, height: 8, borderRadius: 4 },
  agentTitleText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  liveBadge: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.positive,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: dark.positive,
  },

  centerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  orbWrapper: {
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
  },
  haloInner: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
  },
  orbCore: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_R,
    backgroundColor: '#000000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  silkSpinA: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silkSpinB: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobA: {
    position: 'absolute',
    width: ORB_SIZE * 0.85,
    height: ORB_SIZE * 0.55,
    borderRadius: ORB_SIZE * 0.28,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    transform: [{ rotate: '24deg' }],
  },
  blobB: {
    position: 'absolute',
    width: ORB_SIZE * 0.6,
    height: ORB_SIZE * 0.9,
    borderRadius: ORB_SIZE * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ rotate: '-30deg' }],
  },
  blobC: {
    position: 'absolute',
    width: ORB_SIZE * 0.45,
    height: ORB_SIZE * 0.45,
    borderRadius: ORB_SIZE * 0.225,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  orbIconWrap: {
    width: ORB_SIZE * 0.34,
    height: ORB_SIZE * 0.34,
    borderRadius: ORB_SIZE * 0.17,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusLabelWrap: { marginTop: spacing.md },
  statusLabelText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: dark.inkSoft,
  },

  subtitlesContainer: { paddingHorizontal: spacing.lg },
  subtitlesCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: 6,
  },
  subtitleCaption: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: dark.inkFaint,
  },
  subtitleText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: dark.ink,
  },
  brainReadyCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.positive,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  brainReadyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brainReadyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  brainReadyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
  },
  reviewBrainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 13,
    minHeight: 48,
    marginTop: spacing.xs,
  },
  reviewBrainText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  quickPromptsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  promptPill: {
    flex: 1,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  promptPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
    textAlign: 'center',
  },

  bottomDockWrapper: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginTop: 'auto',
  },
  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dockCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockMainMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockMainMicBtnMuted: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.negative,
  },
  dockDoneBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: dark.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: dark.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: dark.hairline,
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: dark.hairlineStrong,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 20,
    color: dark.ink,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: dark.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    padding: spacing.lg,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: dark.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 14,
    minHeight: 52,
  },
  modalSendText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

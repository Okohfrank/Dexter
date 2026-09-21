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
  Alert,
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
  ArrowRight,
  Lightbulb,
} from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { usePressFeedback } from '../../src/lib/animate';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { connectVoiceStream, transcribeAudio } from '../../src/api/voice';

const { width: SCREEN_W } = Dimensions.get('window');
const ORB_SIZE = Math.min(SCREEN_W * 0.48, 200);

const WAVE_DURS = [720, 980, 830, 1100, 900];

/* Voice waveform bar: own loop, height follows `energy`.
 * speaking ≈ 1.3, listening = 1, processing = 0.5, muted ≈ 0.08. */
function WaveBar({ energy, duration }: { energy: number; duration: number }) {
  const v = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0.25,
          duration: Math.round(duration * 1.2),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, v]);
  const peak = 0.22 + Math.min(energy, 1.4) * 0.55;
  const scaleY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, Math.max(peak, 0.25)],
  });
  return <Animated.View style={[styles.waveBar, { transform: [{ scaleY }] }]} />;
}

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
  const [isRecording, setIsRecording] = useState(false);

  const streamRef = useRef<ReturnType<typeof connectVoiceStream> | null>(null);
  const voiceRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const fbReview = usePressFeedback();
  const fbModalSend = usePressFeedback();
  const fbMic = usePressFeedback();
  const fbDone = usePressFeedback();

  // Animated values for fluid glowing Orb
  const orbScale = useRef(new Animated.Value(1)).current;
  const haloScale1 = useRef(new Animated.Value(1)).current;
  const haloScale2 = useRef(new Animated.Value(1)).current;
  const haloOpacity1 = useRef(new Animated.Value(0.4)).current;
  const haloOpacity2 = useRef(new Animated.Value(0.2)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;

  // Gentle halo breathing; the waveform bars carry state expression.
  useEffect(() => {
    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity1, {
          toValue: 0.5,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(haloOpacity1, {
          toValue: 0.15,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    halo.start();
    return () => halo.stop();
  }, [haloOpacity1]);

  // Slow halo drift for depth.
  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale1, {
          toValue: 1.3,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloScale1, {
          toValue: 1.0,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    drift.start();
    return () => drift.stop();
  }, [haloScale1]);

  // Orb body follows conversation energy directly.
  useEffect(() => {
    const target =
      agentStatus === 'speaking' ? 1.12 : agentStatus === 'listening' ? 1.04 : 1.0;
    Animated.timing(orbScale, {
      toValue: target,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [agentStatus, orbScale]);

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

  const toggleMute = async () => {
    // Unmute = user takes the floor: start recording immediately so most
    // of the talking is theirs. Mute = stop, transcribe, and send.
    // (expo-audio — expo-av's native module is no longer bundled.)
    if (!isMuted) {
      setIsMuted(true);
      setAgentStatus('listening');
      await stopRecordingAndSend();
      return;
    }
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone Access',
          'Please allow microphone access in settings to speak with Dexter.',
        );
        return;
      }
      await voiceRecorder.prepareToRecordAsync();
      voiceRecorder.record();
      setIsRecording(true);
      setIsMuted(false);
      setAgentStatus('listening');
    } catch (e: any) {
      Alert.alert(
        'Microphone Error',
        `Could not access microphone: ${e.message || 'Audio hardware error'}`,
      );
    }
  };

  const stopRecordingAndSend = async () => {
    if (!isRecording) {
      return;
    }
    setIsRecording(false);
    setAgentStatus('processing');
    try {
      await voiceRecorder.stop();
      const uri = voiceRecorder.uri;
      if (uri) {
        const res = await transcribeAudio(uri, undefined);
        if (res && res.transcript) {
          handleSendSpeech(res.transcript);
          return;
        }
        Alert.alert(
          'Speech Recognition',
          'Could not detect speech. Please try speaking again.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Voice Error',
        `Transcription error: ${err.message || 'Microphone error'}`,
      );
    } finally {
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
                opacity: isMuted ? 0.5 : 1,
              },
            ]}
          >
            {/* Voice waveform: bars breathe with conversation energy */}
            <View style={styles.waveRow}>
              {WAVE_DURS.map((d, i) => (
                <WaveBar
                  key={i}
                  duration={d}
                  energy={
                    isMuted
                      ? 0.08
                      : agentStatus === 'speaking'
                        ? 1.3
                        : agentStatus === 'listening'
                          ? 1
                          : 0.5
                  }
                />
              ))}
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
            <Pressable style={[styles.reviewBrainBtn, fbReview.feedback]} onPress={handleProceedToBrain} {...fbReview.bind}>
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
        <Pressable style={styles.continuePill} onPress={handleProceedToBrain}>
          <Text style={styles.continuePillText}>Continue to Business Brain</Text>
          <Icon as={ArrowRight} size={16} color={dark.accent} />
        </Pressable>
        <View style={styles.bottomDock}>
          <Pressable style={styles.dockCircleBtn} onPress={() => setTextModalVisible(true)}>
            <Icon as={MessageCircle} size={22} color={dark.ink} />
          </Pressable>

          <Pressable
            style={[styles.dockMainMicBtn, isMuted && styles.dockMainMicBtnMuted, fbMic.feedback]}
            onPress={toggleMute}
            {...fbMic.bind}
          >
            <Icon
              as={isMuted ? MicOff : Mic}
              size={28}
              color={isMuted ? dark.negative : '#FFFFFF'}
            />
          </Pressable>

          <Pressable style={[styles.dockDoneBtn, fbDone.feedback]} onPress={handleFinish} {...fbDone.bind}>
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
              style={[styles.modalSendBtn, fbModalSend.feedback]}
              onPress={() => handleSendSpeech()}
              disabled={!userSpeechInput.trim()}
              {...fbModalSend.bind}
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
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waveBar: {
    width: 9,
    height: 72,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
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
    gap: spacing.sm,
  },
  continuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 48,
  },
  continuePillText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: dark.accent,
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

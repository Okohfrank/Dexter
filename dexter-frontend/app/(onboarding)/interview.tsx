import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { sendChatMessage } from '../../src/api/chat';
import { connectVoiceStream, transcribeAudio } from '../../src/api/voice';
import { useAppStore } from '../../src/store/app';
import { Card, Pill } from '../../src/components/ui';
import type { ChatMessage, ChatBrief, BusinessBrain } from '../../src/types';

const OPENING: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! I\'m Dexter, your autonomous brand employee. Let\'s establish your Business Brain. To start, tell me about your business — what products or services do you offer, and who is your ideal target audience?',
};

export default function InterviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const setBrain = useAppStore((s) => s.setBrain);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [messages, setMessages] = useState<ChatMessage[]>([OPENING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceState, setVoiceState] = useState<'listening' | 'processing' | 'speaking'>('listening');
  const [brief, setBrief] = useState<ChatBrief | null>(null);
  const [hasBrainReady, setHasBrainReady] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const voiceStreamRef = useRef<ReturnType<typeof connectVoiceStream> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const speak = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.0,
        onStart: () => setVoiceState('speaking'),
        onDone: () => setVoiceState('listening'),
        onStopped: () => setVoiceState('listening'),
        onError: () => setVoiceState('listening'),
      });
    } catch {}
  };

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const startMicRecording = async () => {
    try {
      Speech.stop();
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microphone Access', 'Please allow microphone access in settings to speak with Dexter.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setVoiceState('listening');
    } catch (e: any) {
      Alert.alert('Microphone Error', `Could not access microphone: ${e.message || 'Audio hardware error'}`);
      setIsRecording(false);
      setVoiceState('listening');
    }
  };

  const stopMicRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setVoiceState('processing');

    try {
      const rec = recordingRef.current;
      recordingRef.current = null;
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();

      if (uri) {
        const res = await transcribeAudio(uri, business?.id);
        if (res && res.transcript) {
          await handleSendText(res.transcript);
        } else {
          Alert.alert('Speech Recognition', 'Could not detect speech. Please try speaking again or type.');
          setVoiceState('listening');
        }
      }
    } catch (err: any) {
      Alert.alert('Voice Error', `Transcription error: ${err.message || 'Microphone error'}`);
      setVoiceState('listening');
    }
  };

  const toggleVoiceMode = async () => {
    if (voiceActive) {
      Speech.stop();
      if (isRecording) {
        await stopMicRecording();
      }
      voiceStreamRef.current?.close();
      voiceStreamRef.current = null;
      setVoiceActive(false);
      return;
    }

    setVoiceActive(true);
    setVoiceState('listening');
    speak(OPENING.content);

    voiceStreamRef.current = connectVoiceStream({
      onOpen: () => {
        setVoiceState('listening');
      },
      onAssistantReply: (text, state) => {
        if (text) {
          setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
          speak(text);
        }
        setVoiceState(state);
      },
      onBrainDistilled: (brainData) => {
        if (brainData) {
          const distilledBrain: BusinessBrain = {
            industry: brainData.industry || 'Technology & Growth',
            products: Array.isArray(brainData.products) ? brainData.products : ['AI Automation'],
            audience: Array.isArray(brainData.audience) ? brainData.audience : ['Founders & Marketers'],
            goals: Array.isArray(brainData.goals) ? brainData.goals : ['Brand Authority', 'Lead Gen'],
            brandVoice: brainData.brandVoice || 'Direct & Insightful',
            restrictions: Array.isArray(brainData.restrictions) ? brainData.restrictions : [],
            writingStyle: brainData.writingStyle || 'Punchy, actionable paragraphs',
            visualStyle: brainData.visualStyle || 'Modern minimalist light mode',
            preferredHashtags: Array.isArray(brainData.preferredHashtags) ? brainData.preferredHashtags : ['#AI', '#Founders'],
            preferredCtas: Array.isArray(brainData.preferredCtas) ? brainData.preferredCtas : ['Follow for weekly breakdown'],
          };
          setBrain(distilledBrain);
          setHasBrainReady(true);
        }
      },
      onError: (err) => {
        Alert.alert('Voice Server Notice', 'Real-time voice stream disconnected. You can continue speaking via mic or text.');
        setVoiceActive(false);
      },
      onClose: () => {
        setVoiceActive(false);
      },
    });
  };

  const handleSendText = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);

    if (voiceActive && voiceStreamRef.current) {
      voiceStreamRef.current.sendSpeechText(text);
      setSending(false);
      return;
    }

    try {
      const linkedin = connectedAccounts.find((a) => a.platform === 'linkedin');
      const res = await sendChatMessage(
        history.map((m) => ({ role: m.role, content: m.content })),
        {
          businessId: business?.id,
          connectedAccountId: linkedin?.id,
        },
      );
      const assistantMsg: ChatMessage = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      if (voiceActive) {
        speak(res.reply);
      }
      if (res.is_finalized && res.brief) {
        setBrief(res.brief);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Server unreachable';
      Alert.alert('Communication Error', `Could not reach Dexter: ${errorMsg}`);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ I encountered an issue: ${errorMsg}. Could you try rephrasing?` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    handleSendText(input);
  };

  const renderBubble = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
          {!isUser && (
            <Pressable style={styles.bubbleSpeakBtn} hitSlop={8} onPress={() => speak(item.content)}>
              <Ionicons name="volume-medium-outline" size={14} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>Step 3 of 5</Text>
            <Text style={styles.title}>Business Interview</Text>
            <Text style={styles.subtitle}>
              {business ? `Configuring profile for ${business.name}` : 'Answer naturally as Dexter asks questions.'}
            </Text>
          </View>
          <Pressable onPress={toggleVoiceMode} style={styles.voiceModeToggle}>
            <Pill
              label={voiceActive ? 'VOICE ON' : 'VOICE AI'}
              variant={voiceActive ? 'positive' : 'primary'}
              icon={voiceActive ? 'mic' : 'mic-outline'}
            />
          </Pressable>
        </View>

        {voiceActive && (
          <View style={styles.voiceBanner}>
            <View style={[styles.voiceIndicator, voiceState === 'speaking' && styles.voiceSpeaking, voiceState === 'processing' && styles.voiceProcessing]}>
              <Ionicons
                name={voiceState === 'speaking' ? 'volume-high' : voiceState === 'processing' ? 'sync' : 'mic'}
                size={16}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.voiceBannerTextWrap}>
              <Text style={styles.voiceBannerTitle}>
                {voiceState === 'speaking' ? 'Dexter is speaking…' : voiceState === 'processing' ? 'Thinking…' : 'Listening… speak or type freely'}
              </Text>
              <Text style={styles.voiceBannerSub}>Real-time MisoLabs Voice Stream active</Text>
            </View>
            <Pressable onPress={toggleVoiceMode} style={styles.voiceEndBtn}>
              <Text style={styles.voiceEndText}>Mute</Text>
            </Pressable>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderBubble}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>Dexter is processing your input…</Text>
          </View>
        )}

        {(brief || hasBrainReady) && (
          <Pressable style={styles.finalizeWrap} onPress={() => router.push('/(onboarding)/brain')}>
            <Card style={styles.finalizeCard} highlighted>
              <Ionicons name="checkmark-circle" size={20} color={colors.positive} />
              <Text style={styles.finalizeText}>
                Dexter synthesized your Business Brain. Tap here to review & refine.
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </Card>
          </Pressable>
        )}

        <View style={styles.inputRow}>
          <Pressable
            style={[styles.micBtn, (voiceActive || isRecording) && styles.micBtnActive]}
            onPress={isRecording ? stopMicRecording : startMicRecording}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : voiceActive ? 'mic' : 'mic-outline'}
              size={20}
              color={(voiceActive || isRecording) ? '#FFFFFF' : colors.primary}
            />
          </Pressable>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={isRecording ? "🔴 Recording your voice... tap to finish" : voiceActive ? "Speak or type your answer…" : "Type or tap mic to speak…"}
              placeholderTextColor={isRecording ? colors.negative : colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
          >
            <Ionicons name="send" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleWrap: { flex: 1 },
  voiceModeToggle: { marginLeft: spacing.sm },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.heading, color: colors.textPrimary, marginTop: 2 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  voiceIndicator: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceSpeaking: { backgroundColor: colors.positive },
  voiceProcessing: { backgroundColor: colors.warning },
  voiceBannerTextWrap: { flex: 1 },
  voiceBannerTitle: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  voiceBannerSub: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  voiceEndBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voiceEndText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', fontSize: 11 },
  list: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.md },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '100%' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  userBubble: {
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  bubbleText: { ...typography.body, color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: '#FFFFFF', fontWeight: '500' },
  bubbleSpeakBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    padding: 2,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  typingText: { ...typography.caption, color: colors.textSecondary },
  finalizeWrap: {
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  finalizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  finalizeText: { flex: 1, ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  micBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.primaryBtn,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  sendBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
});
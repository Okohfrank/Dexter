import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mic, MicOff, ArrowUp, ArrowLeft, ArrowRight, Volume2, CheckCircle2 } from "lucide-react-native";
import { Icon } from "../../src/components/rnr/icon";
import { usePressFeedback } from "../../src/lib/animate";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import * as Speech from "expo-speech";
import { dark, fonts, spacing } from "../../src/theme";
import { sendChatMessage } from "../../src/api/chat";
import { connectVoiceStream, transcribeAudio } from "../../src/api/voice";
import { useAppStore } from "../../src/store/app";
import type { ChatMessage, ChatBrief, BusinessBrain } from "../../src/types";

const OPENING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Dexter, your autonomous brand employee. Let's establish your Business Brain. To start, tell me about your business — what products or services do you offer, and who is your ideal target audience?",
};

/* v2 step 3 (text) — stripped copilot: same interview logic, no
 * suggestions, no history menu, no image upload. Just the conversation,
 * voice toggle, mic input, and the brain-ready card forward. */
export default function InterviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBrain = useAppStore((s) => s.setBrain);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([OPENING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const fbContinue = usePressFeedback();
  const fbSend = usePressFeedback();
  const [voiceState, setVoiceState] = useState<
    "listening" | "processing" | "speaking"
  >("listening");
  const [brief, setBrief] = useState<ChatBrief | null>(null);
  const [hasBrainReady, setHasBrainReady] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const greetedVoiceRef = useRef(false);
  const voiceStreamRef = useRef<ReturnType<typeof connectVoiceStream> | null>(
    null,
  );
  const recordingRef = useRef<boolean>(false);
  const interviewRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const speak = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 1.0,
        onStart: () => setVoiceState("speaking"),
        onDone: () => setVoiceState("listening"),
        onStopped: () => setVoiceState("listening"),
        onError: () => setVoiceState("listening"),
      });
    } catch {}
  };

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onFrame = (e: any) => setKbHeight(e.endCoordinates.height);
    const show = Keyboard.addListener("keyboardDidShow", onFrame);
    const change = Keyboard.addListener("keyboardDidChangeFrame", onFrame);
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
    return () => {
      show.remove();
      change.remove();
      hide.remove();
    };
  }, []);

  const startMicRecording = async () => {
    try {
      Speech.stop();
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone Access",
          "Please allow microphone access in settings to speak with Dexter.",
        );
        return;
      }

      await interviewRecorder.prepareToRecordAsync();
      interviewRecorder.record();
      recordingRef.current = true;
      setIsRecording(true);
      setVoiceState("listening");
    } catch (e: any) {
      Alert.alert(
        "Microphone Error",
        `Could not access microphone: ${e.message || "Audio hardware error"}`,
      );
      setIsRecording(false);
      setVoiceState("listening");
    }
  };

  const stopMicRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setVoiceState("processing");

    try {
      recordingRef.current = false;
      await interviewRecorder.stop();
      const uri = interviewRecorder.uri;

      if (uri) {
        const res = await transcribeAudio(uri, business?.id);
        if (res && res.transcript) {
          await handleSendText(res.transcript);
        } else {
          Alert.alert(
            "Speech Recognition",
            "Could not detect speech. Please try speaking again or type.",
          );
          setVoiceState("listening");
        }
      }
    } catch (err: any) {
      Alert.alert(
        "Voice Error",
        `Transcription error: ${err.message || "Microphone error"}`,
      );
      setVoiceState("listening");
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
    setVoiceState("listening");
    // Greet only on first activation — replays on every toggle feel broken.
    if (!greetedVoiceRef.current) {
      greetedVoiceRef.current = true;
      speak(OPENING.content);
    }

    voiceStreamRef.current = connectVoiceStream({
      onOpen: () => {
        setVoiceState("listening");
      },
      onAssistantReply: (text, state) => {
        if (text) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: text },
          ]);
          speak(text);
        }
        setVoiceState(state);
      },
      onBrainDistilled: (brainData) => {
        if (brainData) {
          const distilledBrain: BusinessBrain = {
            industry: brainData.industry || "Technology & Growth",
            products: Array.isArray(brainData.products)
              ? brainData.products
              : ["AI Automation"],
            audience: Array.isArray(brainData.audience)
              ? brainData.audience
              : ["Founders & Marketers"],
            goals: Array.isArray(brainData.goals)
              ? brainData.goals
              : ["Brand Authority", "Lead Gen"],
            brandVoice: brainData.brandVoice || "Direct & Insightful",
            restrictions: Array.isArray(brainData.restrictions)
              ? brainData.restrictions
              : [],
            writingStyle:
              brainData.writingStyle || "Punchy, actionable paragraphs",
            visualStyle: brainData.visualStyle || "Modern minimalist dark mode",
            preferredHashtags: Array.isArray(brainData.preferredHashtags)
              ? brainData.preferredHashtags
              : ["#AI", "#Founders"],
            preferredCtas: Array.isArray(brainData.preferredCtas)
              ? brainData.preferredCtas
              : ["Follow for weekly breakdown"],
          };
          setBrain(distilledBrain);
          setHasBrainReady(true);
        }
      },
      onError: () => {
        Alert.alert(
          "Voice Server Notice",
          "Real-time voice stream disconnected. You can continue speaking via mic or text.",
        );
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
    const userMsg: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setSending(true);

    if (voiceActive && voiceStreamRef.current) {
      voiceStreamRef.current.sendSpeechText(text);
      setSending(false);
      return;
    }

    try {
      const linkedin = connectedAccounts.find((a) => a.platform === "linkedin");
      const res = await sendChatMessage(
        history.map((m) => ({ role: m.role, content: m.content })),
        {
          businessId: business?.id,
          connectedAccountId: linkedin?.id,
        },
      );
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (voiceActive) {
        speak(res.reply);
      }
      if (res.is_finalized && res.brief) {
        setBrief(res.brief);
      }
    } catch (e: any) {
      const errorMsg = e.message || "Server unreachable";
      Alert.alert("Communication Error", `Could not reach Dexter: ${errorMsg}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I encountered an issue: ${errorMsg}. Could you try rephrasing?`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    handleSendText(input);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/mode');
    }
  };

  const renderBubble = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    if (isUser) {
      return (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.content}</Text>
        </View>
      );
    }
    return (
      <View style={styles.assistantBlock}>
        <Text style={styles.assistantText}>{item.content}</Text>
        <Pressable
          style={styles.speakBtn}
          hitSlop={8}
          onPress={() => speak(item.content)}
          accessibilityRole="button"
          accessibilityLabel="Read aloud"
        >
          <Icon as={Volume2} size={16} color={dark.accent} />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.statusWrap}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    voiceState === "speaking"
                      ? dark.positive
                      : voiceActive
                        ? dark.accent
                        : dark.inkFaint,
                },
              ]}
            />
          </View>
          <View style={styles.topBarTitles}>
            <Text style={styles.topBarTitle}>Business Interview</Text>
            <Text style={styles.topBarSub}>
              {business ? `Configuring profile for ${business.name}` : 'Step 3 of 5'}
            </Text>
          </View>
          <Pressable
            style={[styles.voicePill, voiceActive && styles.voicePillOn]}
            onPress={toggleVoiceMode}
            accessibilityRole="button"
            accessibilityLabel={voiceActive ? "Turn voice off" : "Turn voice on"}
          >
            <Icon
              as={voiceActive ? MicOff : Mic}
              size={14}
              color={voiceActive ? "#FFF" : dark.accent}
            />
            <Text style={[styles.voicePillText, voiceActive && styles.voicePillTextOn]}>
              {voiceActive ? "VOICE ON" : "VOICE"}
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderBubble}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={dark.accent} />
            <Text style={styles.typingText}>Dexter is processing your input…</Text>
          </View>
        )}

        {/* ── Brain ready → step 4 ── */}
        {(brief || hasBrainReady) && (
          <Pressable
            style={styles.finalizeCard}
            onPress={() => router.push("/(onboarding)/brain")}
          >
            <Icon as={CheckCircle2} size={20} color={dark.positive} />
            <Text style={styles.finalizeText}>
              Dexter synthesized your Business Brain. Tap here to review & refine.
            </Text>
          </Pressable>
        )}

        {/* ── Composer (mic + input + send only) ── */}
        <View
          style={[
            styles.composerOuter,
            Platform.OS === "android" && kbHeight > 0
              ? { paddingBottom: kbHeight }
              : { paddingBottom: 0 },
          ]}
        >
          <View style={styles.composerCard}>
            <TextInput
              style={styles.composerInput}
              placeholder="Type your response to Dexter…"
              placeholderTextColor={dark.inkFaint}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={handleSend}
            />
            <View style={styles.composerRow}>
              <Pressable
                style={[
                  styles.roundBtn,
                  (voiceActive || isRecording) && styles.roundBtnActive,
                ]}
                hitSlop={8}
                onPress={isRecording ? stopMicRecording : startMicRecording}
                accessibilityRole="button"
                accessibilityLabel="Voice input"
              >
                <Icon
                  as={Mic}
                  size={20}
                  color={voiceActive || isRecording ? "#FFFFFF" : dark.inkSoft}
                />
              </Pressable>
              <View style={styles.spacer} />
              <Pressable
                style={[
                  styles.sendBtn,
                  (!input.trim() || sending) && styles.sendBtnDisabled,
                  fbSend.feedback,
                ]}
                hitSlop={8}
                onPress={handleSend}
                disabled={!input.trim() || sending}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                {...fbSend.bind}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={dark.inkFaint} />
                ) : (
                  <Icon
                    as={ArrowUp}
                    size={20}
                    color={!input.trim() ? dark.inkFaint : "#FFFFFF"}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Bottom nav ── */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
            <Icon as={ArrowLeft} size={18} color={dark.ink} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.stepText}>3 / 5</Text>
          <Pressable
            style={[styles.continueBtn, fbContinue.feedback]}
            onPress={() => router.push('/(onboarding)/brain')}
            accessibilityRole="button"
            accessibilityLabel="Continue to Business Brain"
            {...fbContinue.bind}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Icon as={ArrowRight} size={18} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: dark.canvas },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statusWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  topBarTitles: { flex: 1, flexShrink: 1 },
  topBarTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: dark.ink,
  },
  topBarSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: dark.inkSoft,
    marginTop: 1,
  },
  voicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexShrink: 0,
  },
  voicePillOn: { backgroundColor: dark.accent, borderColor: dark.accent },
  voicePillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: dark.accent,
  },
  voicePillTextOn: { color: "#FFF" },

  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    marginLeft: 40,
  },
  userText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    color: dark.ink,
  },
  assistantBlock: { gap: spacing.sm, paddingRight: spacing.sm },
  assistantText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 25,
    color: dark.ink,
  },
  speakBtn: { alignSelf: "flex-start", padding: 4 },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
  },

  finalizeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.positive,
    borderRadius: 20,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  finalizeText: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: dark.ink,
  },

  composerOuter: { paddingHorizontal: spacing.lg },
  composerCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 28,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  composerInput: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: dark.ink,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnActive: { backgroundColor: dark.accent },
  spacer: { flex: 1 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: dark.surfaceElevated },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: dark.hairline,
    backgroundColor: dark.canvas,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkFaint,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
    minWidth: 150,
  },
  continueText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

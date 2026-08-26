import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  fonts,
} from "../../src/theme";
import { useAppStore } from "../../src/store/app";
import { useAuthStore } from "../../src/api/client";
import { sendChatMessage } from "../../src/api/chat";
import { publishPost, publishNow } from "../../src/api/publishing";
import { transcribeAudio } from "../../src/api/voice";
import type { ChatMessage, ChatBrief } from "../../src/types";

type AIState = "idle" | "listening" | "thinking" | "speaking";

const QUICK_SUGGESTIONS = [
  "🚀 Draft a thought-leadership post about AI agents",
  "📸 Write a post based on my attached graphic",
  "💡 Brainstorm 3 growth frameworks for B2B founders",
  "✍️ Rewrite my next post to be punchier",
];

export default function AICopilotScreen() {
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [aiState, setAiState] = useState<AIState>("idle");
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${user?.full_name?.split(" ")[0] || "there"}! I'm Dexter, your AI Social Media copilot. Ask me to draft a LinkedIn post, analyze a graphic, or refine your content strategy.`,
    },
  ]);
  const [activeBrief, setActiveBrief] = useState<ChatBrief | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const speakText = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 1.0,
        onStart: () => setAiState("speaking"),
        onDone: () => setAiState("idle"),
        onStopped: () => setAiState("idle"),
        onError: () => setAiState("idle"),
      });
    } catch {
      setAiState("idle");
    }
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access to attach images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || "image/jpeg";
          setAttachedImage(`data:${mimeType};base64,${asset.base64}`);
        } else if (asset.uri) {
          setAttachedImage(asset.uri);
        }
      }
    } catch (e: any) {
      Alert.alert("Image Selection Error", e.message || "Could not pick image");
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query && !attachedImage) return;

    setInputText("");
    const currentImg = attachedImage;
    setAttachedImage(null);

    const userMessage: ChatMessage = {
      role: "user",
      content:
        query ||
        "Analyze this attached image and create an engaging LinkedIn post about it.",
      image_url: currentImg,
    };

    const newHistory: ChatMessage[] = [...messages, userMessage];
    setMessages(newHistory);
    setAiState("thinking");

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const linkedin = connectedAccounts.find((a) => a.platform === "linkedin");

    try {
      const res = await sendChatMessage(newHistory, {
        businessId: business?.id,
        connectedAccountId: linkedin?.id,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.reply,
      };
      setMessages([...newHistory, assistantMsg]);

      if (res.brief) {
        setActiveBrief(res.brief);
      }

      if (isAutoSpeak) {
        speakText(res.reply);
      } else {
        setAiState("idle");
      }
    } catch (e: any) {
      const errorMsg = e.message || "Backend connection failed";
      Alert.alert(
        "AI Communication Error",
        `Could not get a response from Dexter: ${errorMsg}`,
      );
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: `⚠️ Error communicating with AI: ${errorMsg}. Please check your backend connection.`,
        },
      ]);
      setAiState("idle");
    } finally {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleVoiceToggle = async () => {
    if (aiState === "speaking") {
      Speech.stop();
      setAiState("idle");
      return;
    }

    if (isVoiceActive) {
      // User tapped to stop recording and send
      setIsVoiceActive(false);
      setAiState("thinking");

      try {
        if (recordingRef.current) {
          const rec = recordingRef.current;
          recordingRef.current = null;
          await rec.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          const uri = rec.getURI();

          if (uri) {
            const transResult = await transcribeAudio(uri, business?.id);
            if (transResult && transResult.transcript) {
              await handleSend(transResult.transcript);
              return;
            } else {
              Alert.alert(
                "Voice Recognition",
                "Could not detect clear speech. Please try speaking again.",
              );
            }
          }
        }
      } catch (err: any) {
        Alert.alert(
          "Voice Recording Error",
          `Voice processing failed: ${err.message || "Microphone error"}`,
        );
      } finally {
        setAiState("idle");
      }
    } else {
      setIsVoiceActive(true);
      setAiState("listening");
      // Speak a brief prompt to open the voice turn
      Speech.speak("I am listening. What would you like to post or update?", {
        onDone: () => {
          setAiState("listening");
        },
      });
    }
  };

  const handlePublishBrief = async () => {
    if (!activeBrief) return;
    const linkedin = connectedAccounts.find((a) => a.platform === "linkedin");
    if (!linkedin) {
      Alert.alert(
        "LinkedIn Not Connected",
        "Please connect your LinkedIn account first before publishing.",
      );
      return;
    }

    setPublishing(true);
    try {
      const pubRes = await publishPost({
        platform: "linkedin",
        content_text: activeBrief.content_text,
        connected_account_id: linkedin.id,
      });

      await publishNow(pubRes.post_id);

      Alert.alert(
        "🎉 Post is Live!",
        "Your post was successfully published to your live LinkedIn feed!",
        [{ text: "Awesome!", onPress: () => setActiveBrief(null) }],
      );
    } catch (e: any) {
      Alert.alert("Publish Failed", e.message || "Could not publish post.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.headerOuter}>
          <BlurView intensity={60} tint="dark" style={styles.headerBlur}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerEyebrow}>DEXTER COPILOT</Text>
                <Text style={styles.headerTitle}>AI Assistant</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={[
                    styles.audioToggleBtn,
                    isAutoSpeak && styles.audioToggleActive,
                  ]}
                  onPress={() => {
                    if (aiState === "speaking") Speech.stop();
                    setIsAutoSpeak(!isAutoSpeak);
                  }}
                >
                  <Ionicons
                    name={isAutoSpeak ? "volume-high" : "volume-mute-outline"}
                    size={18}
                    color={isAutoSpeak ? colors.primary : colors.labelTertiary}
                  />
                </Pressable>
                <View style={styles.statusPill}>
                  <View
                    style={[
                      styles.statusDot,
                      aiState !== "idle" && styles.statusDotActive,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {aiState === "listening"
                      ? "Listening…"
                      : aiState === "thinking"
                        ? "Thinking…"
                        : aiState === "speaking"
                          ? "Speaking…"
                          : "Ready"}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Chat History */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <View
                key={idx}
                style={[
                  styles.messageBubbleWrap,
                  isUser ? styles.userBubbleWrap : styles.assistantBubbleWrap,
                ]}
              >
                {!isUser && (
                  <View style={styles.assistantAvatar}>
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={colors.primary}
                    />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {m.image_url && (
                    <Image
                      source={{ uri: m.image_url }}
                      style={styles.bubbleAttachedImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isUser
                        ? styles.userMessageText
                        : styles.assistantMessageText,
                    ]}
                  >
                    {m.content}
                  </Text>
                  {!isUser && (
                    <Pressable
                      style={styles.speakBubbleBtn}
                      hitSlop={8}
                      onPress={() => speakText(m.content)}
                    >
                      <Ionicons
                        name="volume-medium-outline"
                        size={15}
                        color={colors.primary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {/* Active Post Draft Card */}
          {activeBrief && (
            <View style={styles.briefCardOuter}>
              <BlurView intensity={20} tint="dark" style={styles.briefCardBlur}>
                <View style={styles.briefCardContent}>
                  <View style={styles.briefHeader}>
                    <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                    <Text style={styles.briefTitle}>
                      Generated LinkedIn Post Draft
                    </Text>
                  </View>
                  <Text style={styles.briefBody}>
                    {activeBrief.content_text}
                  </Text>
                  <Pressable
                    style={styles.briefPublishBtn}
                    onPress={handlePublishBrief}
                    disabled={publishing}
                  >
                    {publishing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="paper-plane"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.briefPublishBtnText}>
                          Publish to LinkedIn Now
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </BlurView>
            </View>
          )}
        </ScrollView>

        {/* Attached Image Preview */}
        {attachedImage && (
          <View style={styles.attachedPreviewRow}>
            <Image
              source={{ uri: attachedImage }}
              style={styles.attachedThumbnail}
            />
            <View style={styles.attachedTextWrap}>
              <Text style={styles.attachedTitle}>
                Image Attached (Gemini Vision)
              </Text>
              <Text style={styles.attachedSub}>
                Dexter will analyze this visual graphic
              </Text>
            </View>
            <Pressable
              style={styles.removeAttachedBtn}
              onPress={() => setAttachedImage(null)}
            >
              <Ionicons name="close-circle" size={20} color={colors.negative} />
            </Pressable>
          </View>
        )}

        {/* Quick Suggestion Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionScroll}
          contentContainerStyle={styles.suggestionContent}
        >
          {QUICK_SUGGESTIONS.map((s, i) => (
            <Pressable
              key={i}
              style={styles.suggestionChip}
              onPress={() => handleSend(s)}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBarOuter}>
          <BlurView intensity={60} tint="dark" style={styles.inputBarBlur}>
            <View style={styles.inputBar}>
              <Pressable style={styles.attachmentBtn} onPress={handlePickImage}>
                <Ionicons
                  name="image-outline"
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
              <TextInput
                style={styles.textInput}
                placeholder="Ask Dexter to draft, edit, or schedule…"
                placeholderTextColor={colors.labelTertiary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <Pressable
                style={[
                  styles.actionBtn,
                  (isVoiceActive || aiState === "speaking") &&
                    styles.actionBtnActive,
                ]}
                onPress={handleVoiceToggle}
              >
                <Ionicons
                  name={
                    aiState === "speaking"
                      ? "volume-high"
                      : isVoiceActive
                        ? "mic"
                        : "mic-outline"
                  }
                  size={20}
                  color={
                    isVoiceActive || aiState === "speaking"
                      ? "#FFFFFF"
                      : colors.primary
                  }
                />
              </Pressable>
              <Pressable
                style={[
                  styles.sendBtn,
                  !inputText.trim() && !attachedImage && styles.sendBtnDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() && !attachedImage}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },

  headerOuter: { borderBottomWidth: 0.5, borderBottomColor: colors.separator },
  headerBlur: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerEyebrow: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.labelPrimary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  audioToggleActive: {
    backgroundColor: colors.primarySurface,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
  statusDotActive: { backgroundColor: colors.primary },
  statusText: { fontSize: 12, color: colors.primary, fontWeight: "500" },

  chatScroll: { flex: 1 },
  chatContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 20,
  },
  messageBubbleWrap: {
    flexDirection: "row",
    marginVertical: 6,
    maxWidth: "85%",
  },
  userBubbleWrap: { alignSelf: "flex-end" },
  assistantBubbleWrap: {
    alignSelf: "flex-start",
    alignItems: "flex-end",
    gap: 6,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.glassHeavy,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bubbleAttachedImage: {
    width: 200,
    height: 120,
    borderRadius: radii.md,
    marginBottom: 8,
  },
  speakBubbleBtn: {
    alignSelf: "flex-end",
    marginTop: 4,
    paddingTop: 2,
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  userMessageText: { color: "#FFFFFF" },
  assistantMessageText: { color: colors.labelPrimary },

  briefCardOuter: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  briefCardBlur: { overflow: "hidden" },
  briefCardContent: { padding: spacing.md },
  briefHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  briefTitle: { fontSize: 13, color: colors.labelPrimary, fontWeight: "600" },
  briefBody: { fontSize: 13, color: colors.labelSecondary, lineHeight: 19 },
  briefPublishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0A66C2",
    paddingVertical: 10,
    borderRadius: radii.md,
    marginTop: 12,
  },
  briefPublishBtnText: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },

  attachedPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    padding: 8,
    gap: 10,
    marginBottom: 4,
  },
  attachedThumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
  },
  attachedTextWrap: { flex: 1 },
  attachedTitle: {
    fontSize: 12,
    color: colors.labelPrimary,
    fontWeight: "600",
  },
  attachedSub: { fontSize: 11, color: colors.labelSecondary },
  removeAttachedBtn: { padding: 4 },

  suggestionScroll: { maxHeight: 42, marginVertical: 4 },
  suggestionContent: { paddingHorizontal: spacing.lg, gap: 8 },
  suggestionChip: {
    backgroundColor: colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.labelSecondary,
    fontWeight: "500",
  },

  inputBarOuter: { borderTopWidth: 0.5, borderTopColor: colors.separator },
  inputBarBlur: {},
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  attachmentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorderLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.labelPrimary,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnActive: {
    backgroundColor: colors.primary,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.backgroundTertiary,
  },
});

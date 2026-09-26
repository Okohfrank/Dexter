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
  Keyboard,
  Modal,
  Switch,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SquarePen,
  Volume2,
  VolumeX,
  ImagePlus,
  Mic,
  ArrowUp,
  Send,
  X,
  Menu,
  Trash2,
  Plus,
  Search,
  CalendarClock,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import { dark, fonts, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/app";
import { useChatStore, sessionTitleFrom } from "../../src/store/chat";
import { useAuthStore } from "../../src/api/client";
import { sendChatMessage } from "../../src/api/chat";
import { publishPost, publishNow } from "../../src/api/publishing";
import { transcribeAudio } from "../../src/api/voice";
import { Icon } from "../../src/components/rnr/icon";
import { usePressFeedback } from "../../src/lib/animate";
import type { ChatMessage, ChatBrief } from "../../src/types";

type AIState = "idle" | "listening" | "thinking" | "speaking";

const QUICK_SUGGESTIONS = [
  "Draft a thought-leadership post about AI agents",
  "Write a post based on my attached graphic",
  "Brainstorm 3 growth frameworks for B2B founders",
  "Rewrite my next post to be punchier",
];

const GREETING_FOLLOW_UPS = [
  "How can Dexter help?",
  "What are we creating today?",
  "Ready to grow your LinkedIn?",
  "What's on your mind today?",
  "Let's make something worth publishing.",
];

function buildGreeting(firstName: string): { line1: string; line2: string } {
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const follow =
    GREETING_FOLLOW_UPS[Math.floor(Math.random() * GREETING_FOLLOW_UPS.length)];
  return { line1: `Good ${daypart}, ${firstName}.`, line2: follow };
}

/**
 * Converts markdown-style formatting to React Native Text components.
 * Handles **bold**, *italic*, and strips remaining markdown artifacts.
 */
function renderFormattedText(text: string, baseStyle: any) {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, or plain text segments
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|([^*]+)/g;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // **bold**
      parts.push(
        <Text key={key++} style={[baseStyle, { fontWeight: "700" }]}>
          {match[1]}
        </Text>
      );
    } else if (match[2]) {
      // *italic*
      parts.push(
        <Text key={key++} style={[baseStyle, { fontStyle: "italic" }]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      parts.push(
        <Text key={key++} style={baseStyle}>
          {match[3]}
        </Text>
      );
    }
  }
  if (parts.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return <Text style={baseStyle}>{parts}</Text>;
}

/* v2 copilot — Microsoft Copilot app structure (Mobbin ref) on the
 * Dexter dark system: top bar, big greeting empty-state, Today
 * divider, tonal user bubbles, plain assistant text, card composer. */
export default function AICopilotScreen() {
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  const [aiState, setAiState] = useState<AIState>("idle");
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello ${firstName}! I'm Dexter, your AI Social Media copilot. Ask me to draft a LinkedIn post, analyze a graphic, or refine your content strategy.`,
    },
  ]);
  const [activeBrief, setActiveBrief] = useState<ChatBrief | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [greeting] = useState(() => buildGreeting(firstName));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fbPublish = usePressFeedback();
  const fbSend = usePressFeedback();
  const sessions = useChatStore((s) => s.sessions);
  const upsertSession = useChatStore((s) => s.upsertSession);
  const removeSession = useChatStore((s) => s.removeSession);
  const clearSessions = useChatStore((s) => s.clearSessions);

  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [kbHeight, setKbHeight] = useState(0);

  // Manual keyboard padding (Android): deterministic in Expo Go and
  // dev builds regardless of windowSoftInputMode.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onFrame = (e: any) => {
      console.log("[kb] frame height:", e.endCoordinates.height);
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };
    const show = Keyboard.addListener("keyboardDidShow", onFrame);
    const change = Keyboard.addListener("keyboardDidChangeFrame", onFrame);
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKbHeight(0),
    );
    return () => {
      show.remove();
      change.remove();
      hide.remove();
    };
  }, []);

  const isFresh = messages.length <= 1;

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

  const handleNewConversation = () => {
    Speech.stop();
    setAiState("idle");
    setInputText("");
    setAttachedImage(null);
    setActiveBrief(null);
    setSessionId(null);
    setHistoryOpen(false);
    setMessages([
      {
        role: "assistant",
        content: `Hello ${firstName}! I'm Dexter, your AI Social Media copilot. Ask me to draft a LinkedIn post, analyze a graphic, or refine your content strategy.`,
      },
    ]);
  };

  const openSession = (id: string) => {
    const s = useChatStore.getState().sessions.find((prev) => prev.id === id);
    if (!s) return;
    Speech.stop();
    setAiState("idle");
    setSessionId(s.id);
    setMessages(s.messages);
    setActiveBrief(s.brief);
    setInputText("");
    setAttachedImage(null);
    setHistoryOpen(false);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow gallery access to attach images.");
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

  const persistSession = (
    id: string,
    msgs: ChatMessage[],
    brief: ChatBrief | null,
  ) => {
    upsertSession({
      id,
      title: sessionTitleFrom(msgs),
      messages: msgs,
      brief,
      updatedAt: Date.now(),
    });
  };

  const handleSend = async (textToSend?: string, opts?: { silent?: boolean }) => {
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
    const id = sessionId ?? `s_${Date.now()}`;
    setSessionId(id);
    persistSession(id, newHistory, activeBrief);
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
      const fullHistory = [...newHistory, assistantMsg];
      setMessages(fullHistory);

      if (res.brief) {
        setActiveBrief(res.brief);
      }
      persistSession(id, fullHistory, res.brief ?? activeBrief);

      setAiState("idle");
      // Suggestion taps stay silent — hearing audio right after tapping
      // a card feels like the microphone turned itself on.
      if (isAutoSpeak && !opts?.silent) {
        speakText(res.reply);
      }
    } catch (e: any) {
      const errorMsg = e.message || "Backend connection failed";
      Alert.alert("AI Communication Error", `Could not get a response from Dexter: ${errorMsg}`);
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: `Error communicating with AI: ${errorMsg}. Please check your backend connection.`,
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
      setIsVoiceActive(false);
      setAiState("idle");
    } else {
      setIsVoiceActive(true);
      setAiState("listening");
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
      Alert.alert("LinkedIn Not Connected", "Please connect your LinkedIn account first before publishing.");
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

      Alert.alert("Post is Live!", "Your post was successfully published to your live LinkedIn feed!", [
        { text: "Awesome!", onPress: () => setActiveBrief(null) },
      ]);
    } catch (e: any) {
      Alert.alert("Publish Failed", e.message || "Could not publish post.");
    } finally {
      setPublishing(false);
    }
  };

  const statusLabel =
    aiState === "listening"
      ? "Listening…"
      : aiState === "thinking"
        ? "Thinking…"
        : aiState === "speaking"
          ? "Speaking…"
          : isFresh
            ? "New conversation"
            : "Dexter Copilot";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.topBarBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Conversation history and options"
            onPress={() => setHistoryOpen(true)}
          >
            <Icon as={Menu} size={22} color={dark.ink} />
          </Pressable>
          <Text numberOfLines={1} style={styles.topBarTitle}>
            {statusLabel}
          </Text>
          <View style={styles.topBarActions}>
            <Pressable
              style={styles.topBarBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isAutoSpeak ? "Mute Dexter" : "Unmute Dexter"}
              onPress={() => {
                if (aiState === "speaking") Speech.stop();
                setIsAutoSpeak(!isAutoSpeak);
              }}
            >
              <Icon
                as={isAutoSpeak ? Volume2 : VolumeX}
                size={20}
                color={isAutoSpeak ? dark.ink : dark.inkFaint}
              />
            </Pressable>
            <Pressable
              style={styles.topBarBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="New conversation"
              onPress={handleNewConversation}
            >
              <Icon as={SquarePen} size={20} color={dark.ink} />
            </Pressable>
          </View>
        </View>

        {/* ── Empty state greeting ── */}
        {isFresh ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.emptyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.greeting}>
              {greeting.line1}{"\n"}
              <Text style={styles.greetingAccent}>{greeting.line2}</Text>
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dayDivider}>
              <Text style={styles.dayLabel}>Today</Text>
              <View style={styles.dayLine} />
            </View>

            {messages.slice(1).map((m, idx) => {
              const isUser = m.role === "user";
              if (isUser) {
                return (
                  <View key={idx} style={styles.userBubble}>
                    {m.image_url && (
                      <Image
                        source={{ uri: m.image_url }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.userText}>{m.content}</Text>
                  </View>
                );
              }
              return (
                <View key={idx} style={styles.assistantBlock}>
                  {renderFormattedText(m.content, styles.assistantText)}
                  <Pressable
                    style={styles.speakBtn}
                    hitSlop={8}
                    onPress={() => speakText(m.content)}
                    accessibilityRole="button"
                    accessibilityLabel="Read aloud"
                  >
                    <Icon as={Volume2} size={16} color={dark.accent} />
                  </Pressable>
                </View>
              );
            })}

            {aiState === "thinking" && (
              <ActivityIndicator
                color={dark.accent}
                style={{ alignSelf: "flex-start", marginTop: 8 }}
              />
            )}

            {activeBrief && (
              <View style={styles.briefCard}>
                <View style={styles.briefHeader}>
                  <View style={styles.briefIconWrap}>
                    <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                  </View>
                  <Text style={styles.briefTitle}>Generated LinkedIn Post Draft</Text>
                </View>
                <Text style={styles.briefBody}>{activeBrief.content_text}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={[styles.briefPublishBtn, { flex: 1 }, fbPublish.feedback]}
                    onPress={handlePublishBrief}
                    disabled={publishing}
                    {...fbPublish.bind}
                  >
                    {publishing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Icon as={Send} size={16} color="#FFFFFF" />
                        <Text style={styles.briefPublishBtnText}>Publish Now</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.briefPublishBtn, { flex: 1, backgroundColor: dark.card }]}
                    onPress={() => {
                      if (!activeBrief) return;
                      const linkedin = connectedAccounts.find((a) => a.platform === "linkedin");
                      if (!linkedin) {
                        Alert.alert("LinkedIn Not Connected", "Connect LinkedIn first.");
                        return;
                      }
                      Alert.alert(
                        "Schedule Post",
                        "This post will be queued for the AI-optimized best time. You can adjust the time from the dashboard.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Schedule",
                            onPress: async () => {
                              try {
                                setPublishing(true);
                                await publishPost({
                                  platform: "linkedin",
                                  content_text: activeBrief.content_text,
                                  connected_account_id: linkedin.id,
                                });
                                Alert.alert("Scheduled!", "Post queued for optimal time. Review it on your dashboard.");
                                setActiveBrief(null);
                              } catch (e: any) {
                                Alert.alert("Error", e.message || "Could not schedule post.");
                              } finally {
                                setPublishing(false);
                              }
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Icon as={CalendarClock} size={16} color={dark.accent} />
                    <Text style={[styles.briefPublishBtnText, { color: dark.accent }]}>Schedule</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Attached image preview ── */}
        {attachedImage && (
          <View style={styles.attachedRow}>
            <Image source={{ uri: attachedImage }} style={styles.attachedThumb} />
            <View style={styles.attachedBody}>
              <Text style={styles.attachedTitle}>Image attached</Text>
              <Text style={styles.attachedSub}>Dexter will analyze this visual</Text>
            </View>
            <Pressable
              style={styles.attachedRemove}
              hitSlop={8}
              onPress={() => setAttachedImage(null)}
            >
              <Icon as={X} size={18} color={dark.inkFaint} />
            </Pressable>
          </View>
        )}

        {/* ── Suggestion chips (fresh chat only) ── */}
        {isFresh && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {QUICK_SUGGESTIONS.map((s, i) => (
              <Pressable key={i} style={styles.chip} onPress={() => handleSend(s, { silent: true })}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Composer card ── */}
        <View
          style={[
            styles.composerOuter,
            Platform.OS === "android" && kbHeight > 0
              ? { marginBottom: 0, paddingBottom: kbHeight + 56 }
              : { marginBottom: insets.bottom + 100 },
          ]}
        >
          <View style={styles.composerCard}>
            <TextInput
              style={styles.composerInput}
              placeholder="Message Dexter"
              placeholderTextColor={dark.inkFaint}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline
            />
            <View style={styles.composerRow}>
              <View style={styles.composerLeft}>
                <Pressable
                  style={styles.roundBtn}
                  hitSlop={8}
                  onPress={handlePickImage}
                  accessibilityRole="button"
                  accessibilityLabel="Attach image"
                >
                  <Icon as={ImagePlus} size={20} color={dark.inkSoft} />
                </Pressable>
                <Pressable
                  style={[
                    styles.roundBtn,
                    (isVoiceActive || aiState === "speaking") && styles.roundBtnActive,
                  ]}
                  hitSlop={8}
                  onPress={handleVoiceToggle}
                  accessibilityRole="button"
                  accessibilityLabel="Voice input"
                >
                  <Icon
                    as={Mic}
                    size={20}
                    color={
                      isVoiceActive || aiState === "speaking" ? "#FFFFFF" : dark.inkSoft
                    }
                  />
                </Pressable>
              </View>
              <Pressable
                style={[
                  styles.sendBtn,
                  !inputText.trim() && !attachedImage && styles.sendBtnDisabled,
                  fbSend.feedback,
                ]}
                hitSlop={8}
                onPress={() => handleSend()}
                disabled={!inputText.trim() && !attachedImage}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                {...fbSend.bind}
              >
                <Icon
                  as={ArrowUp}
                  size={20}
                  color={
                    !inputText.trim() && !attachedImage ? dark.inkFaint : "#FFFFFF"
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>
        {/* ── History drawer (left sidebar) ── */}
        <Modal visible={historyOpen} animationType="fade" transparent>
          <View style={styles.drawerBackdrop}>
            <View style={[styles.drawerCard, { paddingTop: Math.max(insets.top, 16) }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Conversations</Text>
                <View style={styles.drawerHeaderBtns}>
                  <Pressable
                    style={styles.drawerNewBtn}
                    onPress={handleNewConversation}
                    accessibilityRole="button"
                    accessibilityLabel="Start new conversation"
                  >
                    <Icon as={Plus} size={16} color="#FFF" />
                    <Text style={styles.drawerNewText}>New</Text>
                  </Pressable>
                  <Pressable
                    style={styles.drawerCloseBtn}
                    onPress={() => setHistoryOpen(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close conversations"
                  >
                    <Icon as={X} size={18} color={dark.inkSoft} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.drawerSearch}>
                <Icon as={Search} size={16} color={dark.inkFaint} />
                <TextInput
                  style={styles.drawerSearchInput}
                  placeholder="Search chats…"
                  placeholderTextColor={dark.inkFaint}
                  value={historyQuery}
                  onChangeText={setHistoryQuery}
                />
                {historyQuery.length > 0 && (
                  <Pressable onPress={() => setHistoryQuery('')} hitSlop={8}>
                    <Icon as={X} size={16} color={dark.inkFaint} />
                  </Pressable>
                )}
              </View>

              <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
                {sessions.length === 0 && (
                  <Text style={styles.drawerEmpty}>
                    No previous chats yet — they appear here after your first message.
                  </Text>
                )}
                {sessions
                  .filter((s) =>
                    !historyQuery.trim() ||
                    s.title.toLowerCase().includes(historyQuery.trim().toLowerCase()) ||
                    s.messages.some(
                      (m) =>
                        m.role === 'user' &&
                        m.content.toLowerCase().includes(historyQuery.trim().toLowerCase()),
                    ),
                  )
                  .map((s) => {
                    const active = s.id === sessionId;
                    const turns = s.messages.filter((m) => m.role === 'user').length;
                    return (
                      <Pressable
                        key={s.id}
                        style={[styles.sessionRow, active && styles.sessionRowActive]}
                        onPress={() => openSession(s.id)}
                      >
                        <View style={styles.sessionBody}>
                          <Text style={styles.sessionTitle} numberOfLines={1}>
                            {s.title}
                          </Text>
                          <Text style={styles.sessionDate}>
                            {new Date(s.updatedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {turns > 0 ? ` • ${turns} message${turns === 1 ? '' : 's'}` : ''}
                          </Text>
                        </View>
                        <Pressable
                          hitSlop={8}
                          onPress={() => {
                            removeSession(s.id);
                            if (s.id === sessionId) handleNewConversation();
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Delete conversation"
                        >
                          <Icon as={Trash2} size={16} color={dark.inkFaint} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
              </ScrollView>

              <Text style={styles.drawerSectionLabel}>Options</Text>
              <View style={styles.drawerOptions}>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Read replies aloud</Text>
                  <Switch
                    value={isAutoSpeak}
                    onValueChange={setIsAutoSpeak}
                    trackColor={{ false: dark.hairlineStrong, true: dark.accent }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={dark.hairlineStrong}
                  />
                </View>
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    Alert.alert(
                      'Clear history?',
                      'All previous copilot conversations on this device will be removed.',
                      [
                        { text: 'Keep', style: 'cancel' },
                        {
                          text: 'Clear all',
                          style: 'destructive',
                          onPress: () => {
                            clearSessions();
                            handleNewConversation();
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Text style={[styles.optionLabel, { color: dark.negative }]}>
                    Clear all history
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.drawerScrim}
              onPress={() => setHistoryOpen(false)}
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: dark.canvas },
  container: { flex: 1 },

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
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: dark.ink,
  },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  topBarBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  greeting: {
    fontFamily: "InterTight_700Bold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: dark.ink,
  },
  greetingAccent: {
    color: dark.inkSoft,
  },

  chatContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  dayDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  dayLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.inkSoft,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: dark.hairline },

  userBubble: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    marginLeft: 40,
  },
  bubbleImage: { width: "100%", height: 160, borderRadius: 12 },
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

  briefCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  briefHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  briefIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  briefTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.ink,
  },
  briefBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: dark.inkSoft,
  },
  briefPublishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: dark.accent,
    paddingVertical: 13,
    borderRadius: 999,
    marginTop: spacing.xs,
    minHeight: 48,
  },
  briefPublishBtnText: {
    color: "#FFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },

  attachedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  attachedThumb: { width: 44, height: 44, borderRadius: 12 },
  attachedBody: { flex: 1 },
  attachedTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.ink,
  },
  attachedSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: dark.inkSoft,
  },
  attachedRemove: { padding: 4 },

  chipsScroll: { height: 60, flexGrow: 0, flexShrink: 0 },
  chipsContent: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    backgroundColor: dark.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dark.hairline,
    maxWidth: 260,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
  },

  composerOuter: {
    paddingHorizontal: spacing.lg,
  },
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
  composerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtnActive: { backgroundColor: dark.accent },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: dark.surfaceElevated },

  drawerBackdrop: { flex: 1, flexDirection: 'row' },
  drawerCard: {
    width: '84%',
    maxWidth: 340,
    height: '100%',
    backgroundColor: dark.surface,
    borderRightWidth: 1,
    borderRightColor: dark.hairline,
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
    gap: spacing.md,
  },
  drawerScrim: { flex: 1, backgroundColor: dark.overlay },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 20,
    color: dark.ink,
  },
  drawerHeaderBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  drawerNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  drawerNewText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  drawerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  drawerSearchInput: {
    flex: 1,
    paddingVertical: 12,
    color: dark.ink,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  drawerList: { flexGrow: 1, flexShrink: 1 },
  drawerEmpty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkFaint,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    marginBottom: spacing.sm,
    minHeight: 52,
  },
  sessionRowActive: { borderColor: dark.accent },
  sessionBody: { flex: 1, flexShrink: 1 },
  sessionTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: dark.ink,
  },
  sessionDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: dark.inkFaint,
    marginTop: 2,
  },
  drawerSectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.inkFaint,
    marginTop: spacing.xs,
  },
  drawerOptions: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 56,
  },
  optionLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: dark.ink,
  },
});

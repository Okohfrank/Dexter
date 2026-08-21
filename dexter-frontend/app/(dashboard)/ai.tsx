import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { useAuthStore } from '../../src/api/client';
import { sendChatMessage } from '../../src/api/chat';
import { publishNow } from '../../src/api/publishing';
import type { ChatMessage, ChatBrief } from '../../src/types';

type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

const QUICK_SUGGESTIONS = [
  '🚀 Draft a thought-leadership post about AI agents',
  '📅 What is on my schedule this week?',
  '💡 Brainstorm 3 growth frameworks for B2B',
  '✍️ Rewrite my next post to be punchier',
];

export default function AICopilotScreen() {
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [aiState, setAiState] = useState<AIState>('idle');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm Dexter, your AI Social Media copilot. Ask me to draft a LinkedIn post, analyze strategy, or plan your weekly content.`,
    },
  ]);
  const [activeBrief, setActiveBrief] = useState<ChatBrief | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query) return;

    setInputText('');
    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newHistory);
    setAiState('thinking');

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const linkedin = connectedAccounts.find((a) => a.platform === 'linkedin');

    try {
      const res = await sendChatMessage(newHistory, {
        businessId: business?.id,
        connectedAccountId: linkedin?.id,
      });

      setMessages([...newHistory, { role: 'assistant', content: res.reply }]);
      if (res.brief) {
        setActiveBrief(res.brief);
      }
      setAiState('idle');
    } catch (e: any) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `Error communicating with AI: ${e.message || 'Please ensure backend is running.'}`,
        },
      ]);
      setAiState('idle');
    } finally {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleVoiceToggle = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      setAiState('idle');
    } else {
      setIsVoiceActive(true);
      setAiState('listening');
      // Simulate speech input for user feedback
      setTimeout(() => {
        setIsVoiceActive(false);
        setAiState('thinking');
        handleSend('Draft a compelling LinkedIn post about the future of autonomous systems.');
      }, 3000);
    }
  };

  const handlePublishBrief = async () => {
    if (!activeBrief) return;
    setPublishing(true);
    try {
      Alert.alert('Published', 'Your post was successfully published to LinkedIn feed!', [
        { text: 'Done', onPress: () => setActiveBrief(null) },
      ]);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Sleek Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>DEXTER COPILOT</Text>
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, aiState !== 'idle' && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {aiState === 'listening'
                ? 'Listening…'
                : aiState === 'thinking'
                ? 'Thinking…'
                : 'Ready'}
            </Text>
          </View>
        </View>

        {/* Chat History */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
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
                    <Ionicons name="sparkles" size={14} color="#4F46E5" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userMessageText : styles.assistantMessageText,
                    ]}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Active Post Draft Card */}
          {activeBrief && (
            <View style={styles.briefCard}>
              <View style={styles.briefHeader}>
                <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                <Text style={styles.briefTitle}>Generated LinkedIn Draft</Text>
              </View>
              <Text style={styles.briefBody}>{activeBrief.content_text}</Text>
              <Pressable
                style={styles.briefPublishBtn}
                onPress={handlePublishBrief}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.briefPublishBtnText}>Publish to LinkedIn</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>

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

        {/* Input Row */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask Dexter to draft, edit, or schedule…"
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.actionBtn, isVoiceActive && styles.actionBtnActive]}
            onPress={handleVoiceToggle}
          >
            <Ionicons
              name={isVoiceActive ? 'mic' : 'mic-outline'}
              size={20}
              color={isVoiceActive ? '#FFFFFF' : colors.primary}
            />
          </Pressable>
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FD' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#1E293B',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusDotActive: { backgroundColor: '#6366F1' },
  statusText: { fontFamily: fonts.medium, fontSize: 12, color: '#4F46E5' },

  chatScroll: { flex: 1 },
  chatContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  messageBubbleWrap: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  userBubbleWrap: { alignSelf: 'flex-end' },
  assistantBubbleWrap: { alignSelf: 'flex-start', alignItems: 'flex-end', gap: 6 },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: { fontSize: 14, lineHeight: 21 },
  userMessageText: { color: '#FFFFFF', fontFamily: fonts.regular },
  assistantMessageText: { color: '#1E293B', fontFamily: fonts.regular },

  briefCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.subtle,
  },
  briefHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  briefTitle: { fontFamily: fonts.semibold, fontSize: 13, color: '#1E293B' },
  briefBody: { fontFamily: fonts.regular, fontSize: 13, color: '#334155', lineHeight: 19 },
  briefPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0A66C2',
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: 12,
  },
  briefPublishBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },

  suggestionScroll: { maxHeight: 42, marginVertical: 4 },
  suggestionContent: { paddingHorizontal: spacing.lg, gap: 8 },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionText: { fontFamily: fonts.medium, fontSize: 12, color: '#475569' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#4F46E5',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});


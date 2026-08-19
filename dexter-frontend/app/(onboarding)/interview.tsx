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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { sendChatMessage } from '../../src/api/chat';
import { useAppStore } from '../../src/store/app';
import { GlassCard, GlassPill } from '../../src/components/ui';
import type { ChatMessage, ChatBrief } from '../../src/types';

const OPENING: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! I\'m Dexter, your autonomous brand employee. Let\'s establish your Business Brain. To start, tell me about your business — what products or services do you offer, and who is your ideal target audience?',
};

export default function InterviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [messages, setMessages] = useState<ChatMessage[]>([OPENING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [brief, setBrief] = useState<ChatBrief | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
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
      if (res.is_finalized && res.brief) {
        setBrief(res.brief);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `I encountered an issue: ${e.message}. Could you try rephrasing?` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderBubble = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={14} color={colors.primaryLight} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
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
          <GlassPill label="LIVE" variant="primary" icon="radio" />
        </View>

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
            <ActivityIndicator size="small" color={colors.primaryLight} />
            <Text style={styles.typingText}>Dexter is processing your input…</Text>
          </View>
        )}

        {brief && (
          <Pressable style={styles.finalizeWrap} onPress={() => router.push('/(onboarding)/brain')}>
            <GlassCard style={styles.finalizeCard} highlighted>
              <Ionicons name="checkmark-circle" size={20} color={colors.positive} />
              <Text style={styles.finalizeText}>
                Dexter synthesized your Business Brain. Tap here to review & refine.
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </GlassCard>
          </Pressable>
        )}

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your response to Dexter…"
              placeholderTextColor={colors.textMuted}
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
  eyebrow: {
    ...typography.caption,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.heading, color: colors.textPrimary, marginTop: 2 },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.md },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '100%' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.glassSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.primaryGlassBorder,
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
    backgroundColor: colors.glassSurface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  userBubble: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  bubbleText: { ...typography.body, color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: '#FFFFFF', fontWeight: '500' },
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
  inputContainer: {
    flex: 1,
    backgroundColor: colors.glassSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
    ...shadows.glow,
  },
  sendBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
});
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
import { colors, spacing, radii, typography } from '../../src/theme';
import { sendChatMessage } from '../../src/api/chat';
import { useAppStore } from '../../src/store/app';
import type { ChatMessage, ChatBrief } from '../../src/types';

const OPENING: ChatMessage = {
  role: 'assistant',
  content:
    'Hi, I\'m Dexter! To understand your business, let me ask a few questions. Start by telling me about your business — what do you do, and who\'s it for?',
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
    listRef.current?.scrollToEnd({ animated: false });
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
        { role: 'assistant', content: `I hit a snag: ${e.message}. Try again?` },
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
            <Text style={styles.avatarText}>D</Text>
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
          <Text style={styles.eyebrow}>Step 3 of 5</Text>
          <Text style={styles.title}>Business interview</Text>
          <Text style={styles.subtitle}>
            {business ? `Interviewing for ${business.name}` : 'Answer as naturally as you like.'}
          </Text>
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
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>Dexter is thinking…</Text>
          </View>
        )}

        {brief && (
          <Pressable style={styles.finalizeCard} onPress={() => router.push('/(onboarding)/brain')}>
            <Ionicons name="checkmark-circle" size={20} color={colors.positive} />
            <Text style={styles.finalizeText}>
              Dexter drafted a post and a profile summary. Review the Business Brain →
            </Text>
          </Pressable>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer…"
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <Pressable style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend}>
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, gap: spacing.md },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '100%' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.textInverse, fontSize: 13, fontWeight: '700' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  assistantBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  userBubble: { backgroundColor: colors.primary },
  bubbleText: { ...typography.body, color: colors.textPrimary },
  userBubbleText: { color: colors.textInverse },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  typingText: { ...typography.caption, color: colors.textSecondary },
  finalizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positive,
  },
  finalizeText: { flex: 1, ...typography.caption, color: colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
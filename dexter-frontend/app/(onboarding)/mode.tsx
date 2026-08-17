import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';

export default function InterviewModeScreen() {
  const router = useRouter();
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);

  const pick = (mode: 'text' | 'voice') => {
    setInterviewMode(mode);
    router.push(mode === 'voice' ? '/(onboarding)/voice' : '/(onboarding)/interview');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Step 2 of 5</Text>
        <Text style={styles.title}>How do you want to talk to Dexter?</Text>
        <Text style={styles.subtitle}>
          Dexter asks questions about your business, audience, and goals — like a real employee would.
        </Text>

        <Pressable style={styles.card} onPress={() => pick('text')}>
          <View style={styles.cardIcon}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Text</Text>
            <Text style={styles.cardSubtitle}>
              Type your answers in a conversation. Works everywhere.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.card, styles.cardDisabled]} onPress={() => pick('voice')}>
          <View style={styles.cardIcon}>
            <Ionicons name="mic-outline" size={26} color={colors.textSecondary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Voice</Text>
            <Text style={styles.cardSubtitle}>Talk to Dexter naturally. Coming soon.</Text>
          </View>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Soon</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center', gap: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  cardDisabled: { opacity: 0.6 },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.heading, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  soonText: { color: colors.textSecondary, ...typography.caption },
});
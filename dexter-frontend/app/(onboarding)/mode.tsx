import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { GlassCard, GlassPill } from '../../src/components/ui';

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
        <Text style={styles.title}>Choose your interview mode</Text>
        <Text style={styles.subtitle}>
          Dexter asks targeted questions about your target audience, tone, and objectives to build
          your Business Brain.
        </Text>

        <Pressable onPress={() => pick('text')}>
          <GlassCard style={styles.card} elevated>
            <View style={styles.cardIcon}>
              <Ionicons name="chatbubbles" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Text Conversation</Text>
              <Text style={styles.cardSubtitle}>
                Type your responses in an interactive chat session with Dexter.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => pick('voice')}>
          <GlassCard style={styles.card} highlighted elevated>
            <View style={[styles.cardIcon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="mic-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Live Interactive Voice</Text>
                <GlassPill label="LIVE" variant="positive" />
              </View>
              <Text style={styles.cardSubtitle}>
                Fluid, real-time voice conversation with Dexter (ChatGPT Advanced Voice style).
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </GlassCard>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center', gap: spacing.lg },
  eyebrow: {
    ...typography.caption2,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.h2, color: colors.ink },
  cardSubtitle: { ...typography.caption2, color: colors.inkSoft, marginTop: 4 },
});
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
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
          Dexter asks targeted questions about your target audience, tone, and objectives to build your Business Brain.
        </Text>

        <Pressable onPress={() => pick('text')}>
          <GlassCard style={styles.card} elevated>
            <View style={styles.cardIcon}>
              <Ionicons name="chatbubbles" size={24} color={colors.primaryLight} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Text Conversation</Text>
              <Text style={styles.cardSubtitle}>
                Type your responses in an interactive chat session with Dexter.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => pick('voice')}>
          <GlassCard style={styles.card} highlighted>
            <View style={[styles.cardIcon, { backgroundColor: colors.primaryGlass }]}>
              <Ionicons name="mic" size={24} color={colors.primaryLight} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>Voice Agent</Text>
                <GlassPill label="BETA" variant="primary" />
              </View>
              <Text style={styles.cardSubtitle}>
                Speak naturally with Dexter via the MisoLabs voice pipeline.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
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
    ...typography.caption,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
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
    backgroundColor: colors.glassSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 17 },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
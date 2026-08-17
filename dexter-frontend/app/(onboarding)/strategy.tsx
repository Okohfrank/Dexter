import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import type { ContentPlan } from '../../src/types';

/** Mock strategy — the backend's strategy endpoint will replace this later (PRD §4). */
const MOCK_PLAN: ContentPlan = {
  id: 'mock-plan-1',
  business_id: 'mock',
  frequencyPerWeek: 4,
  platformMix: { linkedin: 4 },
  pillars: ['Product stories', 'Customer wins', 'Industry insights', 'Behind the scenes'],
  bestTimes: ['Tue 8:30am', 'Thu 12:00pm', 'Sat 10:00am'],
  notes:
    'Start with 4 LinkedIn posts/week. Scale to 7 and expand to Instagram once the adapter lands. Post on Tue/Thu mornings when engagement is highest, Sat for reach.',
};

export default function StrategyReviewScreen() {
  const router = useRouter();
  const setContentPlan = useAppStore((s) => s.setContentPlan);
  const setAutonomousMode = useAppStore((s) => s.setAutonomousMode);
  const autonomousMode = useAppStore((s) => s.autonomousMode);

  const [frequency, setFrequency] = useState(MOCK_PLAN.frequencyPerWeek);
  const [enabled, setEnabled] = useState(autonomousMode);

  const handleToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Autonomous Mode?',
        'Dexter will plan, schedule, and publish content on your behalf. You can override anything at any time.',
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setEnabled(true);
              setAutonomousMode(true);
              setContentPlan({ ...MOCK_PLAN, frequencyPerWeek: frequency });
              router.replace('/(dashboard)');
            },
          },
        ],
      );
    } else {
      setEnabled(false);
      setAutonomousMode(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Step 5 of 5</Text>
        <Text style={styles.title}>Here's what I'll do</Text>
        <Text style={styles.subtitle}>
          Based on your goals, here is the plan Dexter proposes. Adjust it if you like.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Posting frequency</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setFrequency((f) => Math.max(1, f - 1))}
            >
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.stepValue}>{frequency} posts / week</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setFrequency((f) => Math.min(21, f + 1))}
            >
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Content pillars</Text>
          {MOCK_PLAN.pillars.map((pillar) => (
            <View key={pillar} style={styles.pillarRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.positive} />
              <Text style={styles.pillarText}>{pillar}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Best times</Text>
          <Text style={styles.cardBodyText}>{MOCK_PLAN.bestTimes.join(' · ')}</Text>
          <Text style={styles.reasonText}>
            Why: LinkedIn engagement peaks mid-week mornings, and weekend posts catch scrollers.
          </Text>
        </View>

        <View style={[styles.card, styles.autonomyCard]}>
          <View style={styles.autonomyHeader}>
            <View style={styles.autonomyIcon}>
              <Ionicons name="rocket-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.autonomyBody}>
              <Text style={styles.cardLabel}>Autonomous Mode</Text>
              <Text style={styles.cardBodyText}>
                Hand over control. Dexter plans, posts, and learns on its own.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.textInverse}
            />
          </View>
        </View>

        <Text style={styles.hint}>
          You'll always be able to review, edit, or cancel anything Dexter schedules.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardLabel: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  cardBodyText: { ...typography.body, color: colors.textSecondary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { ...typography.heading, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  pillarText: { ...typography.body, color: colors.textPrimary },
  reasonText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  autonomyCard: { borderColor: colors.primary, borderWidth: 1.5 },
  autonomyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  autonomyIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autonomyBody: { flex: 1 },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
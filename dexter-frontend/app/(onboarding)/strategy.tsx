import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { generateContentStrategy, FALLBACK_STRATEGY } from '../../src/api/strategy';
import { GlassCard, GlassPill } from '../../src/components/ui';
import type { ContentPlan } from '../../src/types';

export default function StrategyReviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setContentPlan = useAppStore((s) => s.setContentPlan);
  const setAutonomousMode = useAppStore((s) => s.setAutonomousMode);
  const autonomousMode = useAppStore((s) => s.autonomousMode);

  const [plan, setPlan] = useState<ContentPlan>(FALLBACK_STRATEGY);
  const [frequency, setFrequency] = useState(FALLBACK_STRATEGY.frequencyPerWeek);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(autonomousMode);

  useEffect(() => {
    (async () => {
      try {
        const derived = await generateContentStrategy(business?.id);
        setPlan(derived);
        setFrequency(derived.frequencyPerWeek);
      } catch {
        setPlan(FALLBACK_STRATEGY);
      } finally {
        setLoading(false);
      }
    })();
  }, [business]);

  const handleToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Autonomous Mode?',
        'Dexter will autonomously plan, schedule, and publish content on your behalf. You can review, override, or edit any post at any time.',
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: 'Enable Autonomous Mode',
            onPress: () => {
              setEnabled(true);
              setAutonomousMode(true);
              setContentPlan({ ...plan, frequencyPerWeek: frequency });
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 5 of 5</Text>
          <Text style={styles.title}>Proposed Strategy</Text>
          <Text style={styles.subtitle}>
            Dexter derived this concrete plan from your business goals and audience profile.
          </Text>
        </View>

        {loading ? (
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Dexter is optimizing your posting strategy…</Text>
          </GlassCard>
        ) : (
          <>
            {/* Frequency Card */}
            <GlassCard style={styles.card} elevated>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.cardLabel}>Posting Frequency</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setFrequency((f) => Math.max(1, f - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.labelPrimary} />
                </Pressable>
                <View style={styles.stepValueWrap}>
                  <Text style={styles.stepValueNumber}>{frequency}</Text>
                  <Text style={styles.stepValueUnit}>posts / week</Text>
                </View>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setFrequency((f) => Math.min(21, f + 1))}
                >
                  <Ionicons name="add" size={18} color={colors.labelPrimary} />
                </Pressable>
              </View>
            </GlassCard>

            {/* Content Pillars Card */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="layers-outline" size={18} color={colors.primary} />
                <Text style={styles.cardLabel}>Content Pillars</Text>
              </View>
              <View style={styles.pillarList}>
                {plan.pillars.map((pillar, i) => (
                  <View key={i} style={styles.pillarRow}>
                    <View style={styles.pillarDot}>
                      <Ionicons name="checkmark" size={12} color={colors.positive} />
                    </View>
                    <Text style={styles.pillarText}>{pillar}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Best Times & Reasoning Card */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.cardLabel}>Target Windows & Rationale</Text>
              </View>
              <View style={styles.timesRow}>
                {plan.bestTimes.map((time, idx) => (
                  <GlassPill key={idx} label={time} variant="primary" icon="time-outline" />
                ))}
              </View>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>
                  Why: Mid-morning slots (8:30–10:15 AM) yield the highest initial impression velocity and comment rate for executive audiences.
                </Text>
              </View>
            </GlassCard>

            {/* Autonomous Mode Hand-Off Card */}
            <GlassCard style={styles.autonomyCard} elevated highlighted>
              <View style={styles.autonomyHeader}>
                <View style={styles.autonomyIconWrap}>
                  <Ionicons name="rocket" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.autonomyBody}>
                  <Text style={styles.autonomyTitle}>Autonomous Mode</Text>
                  <Text style={styles.autonomySubtitle}>
                    Hand over execution. Dexter writes, schedules, and learns autonomously.
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: colors.backgroundTertiary, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={colors.backgroundTertiary}
                />
              </View>
            </GlassCard>
          </>
        )}

        <Text style={styles.hint}>
          You maintain full supervisory control. Override or pause at any time from your dashboard.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs },
  eyebrow: {
    ...typography.caption2,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, color: colors.labelPrimary },
  subtitle: { ...typography.body, color: colors.labelSecondary },
  loadingCard: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  loadingText: {
    ...typography.caption,
    color: colors.labelSecondary,
    textAlign: 'center',
  },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardLabel: { ...typography.subheading, color: colors.labelPrimary, fontWeight: '700' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueWrap: { alignItems: 'center' },
  stepValueNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.labelPrimary,
  },
  stepValueUnit: {
    ...typography.caption2,
    color: colors.labelSecondary,
    fontSize: 11,
  },
  pillarList: { gap: spacing.sm },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pillarDot: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.positiveSurface,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: { ...typography.body, color: colors.labelPrimary, flex: 1, fontSize: 14 },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reasonBox: {
    backgroundColor: colors.glass,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  reasonText: {
    ...typography.caption,
    color: colors.labelSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  autonomyCard: {
    padding: spacing.xl,
    marginVertical: spacing.xs,
  },
  autonomyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autonomyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  autonomyBody: { flex: 1 },
  autonomyTitle: { ...typography.subheading, color: colors.labelPrimary, fontWeight: '700' },
  autonomySubtitle: { ...typography.caption2, color: colors.labelSecondary, marginTop: 2 },
  hint: {
    ...typography.caption2,
    color: colors.labelTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
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
import {
  CalendarDays,
  Clock3,
  Zap,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
} from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { usePressFeedback } from '../../src/lib/animate';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { generateContentStrategy } from '../../src/api/strategy';
import type { ContentPlan } from '../../src/types';

const MAX_FREQUENCY = 21;

/* v2 step 5 — strategy review with bottom Back / Dashboard bar.
 * Plan fetch, frequency, autonomy hand-off, and dashboard exit
 * logic unchanged. */
export default function StrategyReviewScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setContentPlan = useAppStore((s) => s.setContentPlan);
  const setAutonomousMode = useAppStore((s) => s.setAutonomousMode);
  const autonomousMode = useAppStore((s) => s.autonomousMode);

  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [frequency, setFrequency] = useState(4);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(autonomousMode);
  const fbDashboard = usePressFeedback();

  useEffect(() => {
    (async () => {
      try {
        const derived = await generateContentStrategy(business?.id);
        setPlan(derived);
        setFrequency(derived?.frequencyPerWeek ?? 4);
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
              if (plan) {
                setContentPlan({ ...plan, frequencyPerWeek: frequency });
              }
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/brain');
    }
  };

  const handleGoDashboard = () => {
    if (plan) {
      setContentPlan({ ...plan, frequencyPerWeek: frequency });
    }
    router.replace('/(dashboard)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Step 5 of 5</Text>
        <Text style={styles.title}>Proposed Strategy</Text>
        <Text style={styles.subtitle}>
          Dexter derived this concrete plan from your business goals and audience profile.
        </Text>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={dark.accent} />
            <Text style={styles.stateText}>Dexter is optimizing your posting strategy…</Text>
          </View>
        ) : !plan ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Icon as={CalendarDays} size={30} color={dark.inkFaint} />
            </View>
            <Text style={styles.emptyTitle}>No strategy available</Text>
            <Text style={styles.emptyText}>
              Connect a business and a LinkedIn account from the dashboard, then come back here to generate your plan.
            </Text>
            <Pressable style={styles.inlineBtn} onPress={handleGoDashboard}>
              <Text style={styles.inlineBtnText}>Go to Dashboard</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Frequency hero */}
            <View style={styles.card}>
              <View style={styles.cardLabelRow}>
                <Icon as={CalendarDays} size={18} color={dark.accent} />
                <Text style={styles.cardLabel}>Posting Frequency</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setFrequency((f) => Math.max(1, f - 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease frequency"
                >
                  <Icon as={Minus} size={18} color={dark.ink} />
                </Pressable>
                <View style={styles.stepValueWrap}>
                  <Text style={styles.stepValueNumber}>{frequency}</Text>
                  <Text style={styles.stepValueUnit}>posts / week</Text>
                </View>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setFrequency((f) => Math.min(MAX_FREQUENCY, f + 1))}
                  accessibilityRole="button"
                  accessibilityLabel="Increase frequency"
                >
                  <Icon as={Plus} size={18} color={dark.ink} />
                </Pressable>
              </View>
            </View>

            {/* Pillars */}
            <View style={styles.card}>
              <Text style={styles.sectionMiniLabel}>Content Pillars</Text>
              <View style={styles.pillarList}>
                {plan.pillars.map((pillar, i) => (
                  <View key={i} style={styles.pillarRow}>
                    <Text style={styles.pillarNum}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                    <Text style={styles.pillarText}>{pillar}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Windows + rationale */}
            <View style={styles.card}>
              <View style={styles.cardLabelRow}>
                <Icon as={Clock3} size={18} color={dark.accent} />
                <Text style={styles.cardLabel}>Target Windows</Text>
              </View>
              <View style={styles.timesRow}>
                {plan.bestTimes.map((time, idx) => (
                  <View key={idx} style={styles.timePill}>
                    <Text style={styles.timePillText}>{time}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonText}>
                  {plan.notes ||
                    'Why: Mid-morning slots yield the highest initial impression velocity and comment rate for executive audiences.'}
                </Text>
              </View>
            </View>

            {/* Autonomy hand-off */}
            <View style={styles.card}>
              <View style={styles.autonomyHeader}>
                <View style={styles.autonomyIconWrap}>
                  <Icon as={Zap} size={22} color="#FFF" />
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
                  trackColor={{ false: dark.hairlineStrong, true: dark.accent }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={dark.hairlineStrong}
                />
              </View>
            </View>

            <Text style={styles.hint}>
              You maintain full supervisory control. Override or pause at any time from your dashboard.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
          <Icon as={ArrowLeft} size={18} color={dark.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.stepText}>5 / 5</Text>
        <Pressable style={[styles.dashboardBtn, fbDashboard.feedback]} onPress={handleGoDashboard} {...fbDashboard.bind}>
          <Text style={styles.dashboardBtnText}>Go to Dashboard</Text>
          <Icon as={ArrowRight} size={18} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: dark.canvas },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: dark.accent,
  },
  title: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: dark.ink,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
  },
  card: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.inkSoft,
  },
  sectionMiniLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.inkSoft,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValueWrap: { alignItems: 'center' },
  stepValueNumber: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -1.2,
    color: dark.ink,
  },
  stepValueUnit: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
  },
  pillarList: { gap: spacing.md },
  pillarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  pillarNum: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 14,
    color: dark.accent,
    minWidth: 24,
    paddingTop: 2,
  },
  pillarText: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: dark.ink,
  },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timePill: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  timePillText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.ink,
  },
  reasonBox: {
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 14,
    padding: spacing.lg,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: dark.inkSoft,
  },
  autonomyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  autonomyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  autonomyBody: { flex: 1, flexShrink: 1, gap: 2 },
  autonomyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: dark.ink,
  },
  autonomySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: dark.inkSoft,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: dark.inkFaint,
    textAlign: 'center',
  },
  stateCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  stateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dark.inkSoft,
    textAlign: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: dark.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
    textAlign: 'center',
    maxWidth: 300,
  },
  inlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 24,
    minHeight: 48,
    marginTop: spacing.sm,
  },
  inlineBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: dark.hairline,
    backgroundColor: dark.canvas,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkFaint,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
    minWidth: 150,
  },
  dashboardBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

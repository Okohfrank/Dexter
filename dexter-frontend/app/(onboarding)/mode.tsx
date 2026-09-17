import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle, Mic, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';

/* v2 step 2 — interview mode cards with bottom Back nav. Tapping a
 * card navigates immediately, so the bottom bar carries Back + step. */
export default function InterviewModeScreen() {
  const router = useRouter();
  const setInterviewMode = useAppStore((s) => s.setInterviewMode);

  const pick = (mode: 'text' | 'voice') => {
    setInterviewMode(mode);
    router.push(mode === 'voice' ? '/(onboarding)/voice' : '/(onboarding)/interview');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Step 2 of 5</Text>
        <Text style={styles.title}>Choose your interview mode</Text>
        <Text style={styles.subtitle}>
          Dexter asks targeted questions about your target audience, tone, and objectives to build
          your Business Brain.
        </Text>

        <Pressable style={styles.card} onPress={() => pick('text')}>
          <View style={styles.cardIcon}>
            <Icon as={MessageCircle} size={24} color={dark.accent} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Text Conversation</Text>
            <Text style={styles.cardSubtitle}>
              Type your responses in an interactive chat session with Dexter.
            </Text>
          </View>
          <View style={styles.chevronBox}>
            <Icon as={ChevronRight} size={18} color={dark.inkFaint} />
          </View>
        </Pressable>

        <Pressable style={styles.card} onPress={() => pick('voice')}>
          <View style={styles.cardIcon}>
            <Icon as={Mic} size={24} color={dark.accent} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>Live Interactive Voice</Text>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              Fluid, real-time voice conversation with Dexter.
            </Text>
          </View>
          <View style={styles.chevronBox}>
            <Icon as={ChevronRight} size={18} color={dark.inkFaint} />
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
          <Icon as={ArrowLeft} size={18} color={dark.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.stepText}>2 / 5</Text>
        <View style={styles.spacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 18,
    padding: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, flexShrink: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: dark.ink,
  },
  livePill: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.positive,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  livePillText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: dark.positive,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: dark.inkSoft,
  },
  chevronBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  spacer: { width: 90 },
});

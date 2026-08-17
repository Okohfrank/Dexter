import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import type { BusinessBrain } from '../../src/types';

/** Mock distillation — the backend's brain endpoint will replace this later (PRD §4). */
const MOCK_BRAIN: BusinessBrain = {
  industry: 'Software / SaaS',
  products: ['AI social media assistant', 'Content scheduling platform'],
  audience: ['Founders and small business owners', 'Social media managers'],
  goals: ['Grow LinkedIn following to 1,000 in 90 days', 'Generate inbound leads from content'],
  brandVoice: 'Confident, approachable, human',
  restrictions: ['Avoid hype and clickbait', 'No sensitive political topics'],
  writingStyle: 'Short paragraphs, strong hooks, plain language',
  visualStyle: 'Clean, minimal, brand purple accents',
  preferredHashtags: ['#AI', '#ContentStrategy', '#SmallBusiness'],
  preferredCtas: ['Follow for weekly insights', 'Share your thoughts in the comments'],
};

type TextField = {
  key: 'industry' | 'brandVoice' | 'writingStyle' | 'visualStyle';
  label: string;
};

type ListField = {
  key: 'products' | 'audience' | 'goals' | 'restrictions' | 'preferredHashtags' | 'preferredCtas';
  label: string;
  list: true;
};

type Field = TextField | ListField;

const FIELDS: Field[] = [
  { key: 'industry', label: 'Industry' },
  { key: 'products', label: 'Products & services', list: true },
  { key: 'audience', label: 'Target audience', list: true },
  { key: 'goals', label: 'Goals', list: true },
  { key: 'brandVoice', label: 'Brand voice' },
  { key: 'restrictions', label: 'Restrictions', list: true },
  { key: 'writingStyle', label: 'Writing style' },
  { key: 'visualStyle', label: 'Visual style' },
  { key: 'preferredHashtags', label: 'Preferred hashtags', list: true },
  { key: 'preferredCtas', label: 'Preferred CTAs', list: true },
];

export default function BrainReviewScreen() {
  const router = useRouter();
  const storedBrain = useAppStore((s) => s.brain);
  const setBrain = useAppStore((s) => s.setBrain);
  const [brain, setBrainState] = useState<BusinessBrain>(storedBrain ?? MOCK_BRAIN);

  const update = (key: keyof BusinessBrain, value: string | string[]) => {
    setBrainState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setBrain(brain);
    if (storedBrain) {
      Alert.alert('Saved', 'Your Business Brain is up to date.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Saved', 'Your Business Brain is up to date.', [
        { text: 'Continue', onPress: () => router.push('/(onboarding)/strategy') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Step 4 of 5</Text>
        <Text style={styles.title}>Your Business Brain</Text>
        <Text style={styles.subtitle}>
          Dexter distilled your interview into this profile. It persists and drives every future
          decision — fix anything before continuing.
        </Text>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            {'list' in field ? (
              <View style={styles.chips}>
                {brain[field.key].map((item, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={brain[field.key]}
                onChangeText={(text) => update(field.key, text)}
                placeholderTextColor={colors.textSecondary}
              />
            )}
          </View>
        ))}

        <Text style={styles.hint}>
          List fields are comma-separated in the data model — editing chips is coming soon.
        </Text>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save & continue</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
        </Pressable>
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
  field: { marginTop: spacing.sm },
  label: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: colors.primaryDark },
  hint: { ...typography.caption, color: colors.textSecondary },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  saveText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { GlassCard } from '../../src/components/ui';
import type { BusinessBrain } from '../../src/types';

const EMPTY_BRAIN: BusinessBrain = {
  industry: '',
  products: [],
  audience: [],
  goals: [],
  brandVoice: '',
  restrictions: [],
  writingStyle: '',
  visualStyle: '',
  preferredHashtags: [],
  preferredCtas: [],
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
  { key: 'industry', label: 'Industry & Sector' },
  { key: 'products', label: 'Products & Core Offerings', list: true },
  { key: 'audience', label: 'Target Audience Profile', list: true },
  { key: 'goals', label: 'Primary Business Goals', list: true },
  { key: 'brandVoice', label: 'Brand Voice & Tone' },
  { key: 'restrictions', label: 'Content Restrictions & Guardrails', list: true },
  { key: 'writingStyle', label: 'Writing & Hook Style' },
  { key: 'visualStyle', label: 'Visual Design Style' },
  { key: 'preferredHashtags', label: 'Target Hashtags', list: true },
  { key: 'preferredCtas', label: 'Calls to Action (CTAs)', list: true },
];

export default function BrainReviewScreen() {
  const router = useRouter();
  const storedBrain = useAppStore((s) => s.brain);
  const setBrain = useAppStore((s) => s.setBrain);
  const [brain, setBrainState] = useState<BusinessBrain>(storedBrain ?? EMPTY_BRAIN);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});

  const updateText = (key: keyof BusinessBrain, value: string) => {
    setBrainState((prev) => ({ ...prev, [key]: value }));
  };

  const removeListItem = (key: ListField['key'], index: number) => {
    setBrainState((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const addListItem = (key: ListField['key']) => {
    const text = (newInputs[key] || '').trim();
    if (!text) return;
    setBrainState((prev) => ({
      ...prev,
      [key]: [...prev[key], text],
    }));
    setNewInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSave = () => {
    setBrain(brain);
    if (storedBrain) {
      Alert.alert('Saved', 'Your Business Brain is updated.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Saved', 'Your Business Brain is configured.', [
        { text: 'Continue to Strategy', onPress: () => router.push('/(onboarding)/strategy') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 4 of 5</Text>
          <Text style={styles.title}>Your Business Brain</Text>
          <Text style={styles.subtitle}>
            Dexter distilled your conversation into this persistent intelligence profile. Every post Dexter creates references this.
          </Text>
        </View>

        <View style={styles.fieldsContainer}>
          {FIELDS.map((field) => (
            <GlassCard key={field.key} style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Ionicons name="bulb" size={14} color={colors.primary} />
                <Text style={styles.fieldLabel}>{field.label}</Text>
              </View>

              {'list' in field ? (
                <View style={styles.listContainer}>
                  <View style={styles.chips}>
                    {brain[field.key].map((item, i) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{item}</Text>
                        <Pressable
                          style={styles.chipRemoveBtn}
                          hitSlop={8}
                          onPress={() => removeListItem(field.key, i)}
                        >
                          <Ionicons name="close" size={12} color={colors.primary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  <View style={styles.addChipRow}>
                    <TextInput
                      style={styles.addChipInput}
                      placeholder={`Add to ${field.label.toLowerCase()}…`}
                      placeholderTextColor={colors.inkFaint}
                      value={newInputs[field.key] || ''}
                      onChangeText={(t) =>
                        setNewInputs((prev) => ({ ...prev, [field.key]: t }))
                      }
                      onSubmitEditing={() => addListItem(field.key)}
                      returnKeyType="done"
                    />
                    <Pressable
                      style={[
                        styles.addChipBtn,
                        !(newInputs[field.key] || '').trim() && styles.addChipBtnDisabled,
                      ]}
                      onPress={() => addListItem(field.key)}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={brain[field.key]}
                  onChangeText={(text) => updateText(field.key, text)}
                  placeholderTextColor={colors.inkFaint}
                  placeholder={brain[field.key] ? undefined : `Add ${field.label.toLowerCase()}…`}
                />
              )}
            </GlassCard>
          ))}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save & Generate Strategy</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs },
  eyebrow: {
    ...typography.caption2,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.displaySmall, color: colors.ink },
  subtitle: { ...typography.body, color: colors.inkSoft },
  fieldsContainer: { gap: spacing.md },
  fieldCard: { gap: spacing.sm, padding: spacing.lg },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { ...typography.subheading, color: colors.ink, fontWeight: '700' },
  listContainer: { gap: spacing.sm },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.ink,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySurface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 5,
  },
  chipText: { ...typography.caption2, color: colors.primary, fontWeight: '600', fontSize: 12 },
  chipRemoveBtn: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addChipInput: {
    flex: 1,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.ink,
    fontSize: 13,
  },
  addChipBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChipBtnDisabled: { opacity: 0.3 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 15,
    marginTop: spacing.md,
    ...shadows.primaryBtn,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
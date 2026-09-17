import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Factory,
  Package,
  Users,
  Target,
  Megaphone,
  ShieldAlert,
  Hash,
  MousePointerClick,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
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
  icon: LucideIcon;
};

type ListField = {
  key: 'products' | 'audience' | 'goals' | 'restrictions' | 'preferredHashtags' | 'preferredCtas';
  label: string;
  icon: LucideIcon;
  list: true;
};

type Field = TextField | ListField;

type Section = {
  title: string;
  subtitle: string;
  fields: Field[];
};

/* Grouped IA: 10 flat cards → 3 sections (Identity / Voice & Style /
 * Goals & Guardrails). Shorter perceived length, clearer mental model. */
const SECTIONS: Section[] = [
  {
    title: 'Identity',
    subtitle: 'Who you are and who you serve',
    fields: [
      { key: 'industry', label: 'Industry & Sector', icon: Factory },
      { key: 'products', label: 'Products & Offerings', icon: Package, list: true },
      { key: 'audience', label: 'Target Audience', icon: Users, list: true },
    ],
  },
  {
    title: 'Voice & Style',
    subtitle: 'How Dexter sounds and looks',
    fields: [
      { key: 'brandVoice', label: 'Brand Voice & Tone', icon: Megaphone },
      { key: 'preferredHashtags', label: 'Target Hashtags', icon: Hash, list: true },
      { key: 'preferredCtas', label: 'Calls to Action', icon: MousePointerClick, list: true },
    ],
  },
  {
    title: 'Goals & Guardrails',
    subtitle: 'What success looks like — and limits',
    fields: [
      { key: 'goals', label: 'Business Goals', icon: Target, list: true },
      { key: 'restrictions', label: 'Content Restrictions', icon: ShieldAlert, list: true },
    ],
  },
];

/* v2 step 4 — grouped review form with bottom Back / Save bar. */
export default function BrainReviewScreen() {
  const router = useRouter();
  const storedBrain = useAppStore((s) => s.brain);
  const setBrain = useAppStore((s) => s.setBrain);
  const [brain, setBrainState] = useState<BusinessBrain>(storedBrain ?? EMPTY_BRAIN);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      setBrain(brain);
    } finally {
      setSaving(false);
    }
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/interview');
    }
  };

  const renderField = (field: Field) => (
    <View key={field.key} style={styles.fieldBlock}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconBox}>
          <Icon as={field.icon} size={16} color={dark.accent} />
        </View>
        <Text style={styles.fieldLabel}>{field.label}</Text>
      </View>

      {'list' in field ? (
        <View style={styles.listContainer}>
          {(brain[field.key].length > 0) && (
            <View style={styles.chips}>
              {brain[field.key].map((item, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <Pressable
                    style={styles.chipRemoveBtn}
                    hitSlop={8}
                    onPress={() => removeListItem(field.key, i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item}`}
                  >
                    <Icon as={X} size={12} color={dark.inkSoft} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addChipRow}>
            <TextInput
              style={styles.addChipInput}
              placeholder={`Add to ${field.label.toLowerCase()}…`}
              placeholderTextColor={dark.inkFaint}
              value={newInputs[field.key] || ''}
              onChangeText={(t) =>
                setNewInputs((prev) => ({ ...prev, [field.key]: t }))
              }
              onSubmitEditing={() => addListItem(field.key)}
              returnKeyType="done"
            />
            <Pressable
              style={styles.addChipBtn}
              onPress={() => addListItem(field.key)}
              disabled={!(newInputs[field.key] || '').trim()}
              accessibilityRole="button"
              accessibilityLabel={`Add to ${field.label}`}
            >
              <Icon as={Plus} size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={brain[field.key]}
          onChangeText={(text) => updateText(field.key, text)}
          placeholderTextColor={dark.inkFaint}
          placeholder={brain[field.key] ? undefined : `Add ${field.label.toLowerCase()}…`}
          multiline
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Step 4 of 5</Text>
        <Text style={styles.title}>Your Business Brain</Text>
        <Text style={styles.subtitle}>
          Dexter distilled your conversation into this profile. Review it — every post references this.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            <View style={styles.sectionDivider} />
            {section.fields.map(renderField)}
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
          <Icon as={ArrowLeft} size={18} color={dark.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.stepText}>4 / 5</Text>
        <Pressable
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.saveText}>Save & Continue</Text>
              <Icon as={ArrowRight} size={18} color="#FFF" />
            </>
          )}
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
  sectionCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.2,
    color: dark.ink,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
    marginTop: -8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: dark.hairline,
  },
  fieldBlock: { gap: spacing.sm },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fieldIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: dark.ink,
  },
  listContainer: { gap: spacing.sm },
  input: {
    backgroundColor: dark.surfaceSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: dark.ink,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dark.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.ink,
  },
  chipRemoveBtn: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addChipInput: {
    flex: 1,
    flexShrink: 1,
    backgroundColor: dark.surfaceSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    color: dark.ink,
    fontFamily: fonts.regular,
    fontSize: 13,
    minHeight: 48,
  },
  addChipBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.accent,
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
  saveBtn: {
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
  saveText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { generateNextPost } from '../../src/api/strategy';
import { Card, Pill } from '../../src/components/ui';

export default function CreateScreen() {
  const business = useAppStore((s) => s.business);
  const contentPlan = useAppStore((s) => s.contentPlan);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ content_text: string; scheduled_for?: string } | null>(null);

  const pillars = contentPlan?.pillars ?? [
    'Founder Thought Leadership',
    'Product Deep-dives',
    'Industry Frameworks',
    'Customer Wins',
  ];

  const handleGenerate = async () => {
    if (!business) {
      Alert.alert('Business Needed', 'Complete onboarding first to set up your business profile.');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateNextPost(business.id, topic.trim() || undefined);
      setResult(res);
      Alert.alert('Post Scheduled', 'Dexter autonomously crafted and queued your next LinkedIn post. View it in the Home tab.');
    } catch (e: any) {
      Alert.alert('Generation Note', e.message || 'Make sure your LinkedIn account is linked.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.subtitle}>
            Generate your next high-impact LinkedIn post with AI-driven content strategy.
          </Text>
        </View>

        {/* Topic Override */}
        <Card style={styles.topicCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Topic (Optional)</Text>
          </View>
          <TextInput
            style={styles.topicInput}
            placeholder="e.g. 'Why most founders fail at LinkedIn' or leave blank for AI-picked topic"
            placeholderTextColor={colors.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline
          />
        </Card>

        {/* Content Pillars Quick Reference */}
        <Card style={styles.pillarsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Active Content Pillars</Text>
          </View>
          <View style={styles.pillarChips}>
            {pillars.map((p, i) => (
              <Pressable key={i} onPress={() => setTopic(p)}>
                <Pill label={p} variant="primary" />
              </Pressable>
            ))}
          </View>
          <Text style={styles.hintText}>Tap a pillar to use as your topic</Text>
        </Card>

        {/* Generate Button */}
        <Pressable
          style={[styles.generateBtn, generating && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generate Autonomous Post</Text>
            </>
          )}
        </Pressable>

        {/* Result Preview */}
        {result && (
          <Card style={styles.resultCard} highlighted>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={18} color={colors.positive} />
              <Text style={styles.sectionTitle}>Post Queued</Text>
            </View>
            <Text style={styles.resultText} numberOfLines={6}>{result.content_text}</Text>
            {result.scheduled_for && (
              <Text style={styles.resultSchedule}>
                Scheduled for {new Date(result.scheduled_for).toLocaleString()}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { gap: spacing.xs },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },

  topicCard: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '700' },
  topicInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  pillarsCard: { gap: spacing.md },
  pillarChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hintText: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 16,
    ...shadows.primaryBtn,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.bold,
  },

  resultCard: { gap: spacing.sm },
  resultText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  resultSchedule: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});

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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { generateNextPost } from '../../src/api/strategy';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { listConnectedAccounts, mockConnectAccount } from '../../src/api/oauth';
import { publishNow } from '../../src/api/publishing';
import { Card, Pill } from '../../src/components/ui';

export default function CreateScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const setConnectedAccounts = useAppStore((s) => s.setConnectedAccounts);
  const contentPlan = useAppStore((s) => s.contentPlan);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ id?: string; content_text: string; scheduled_for?: string } | null>(null);

  const pillars = contentPlan?.pillars ?? [
    'Founder Thought Leadership',
    'Product Deep-dives',
    'Industry Frameworks',
    'Customer Wins',
  ];

  const ensureBusinessAndAccount = async () => {
    let biz = business;
    if (!biz) {
      const list = await listBusinesses().catch(() => []);
      if (list.length > 0) {
        biz = list[0];
      } else {
        biz = await createBusiness({ name: 'Dexter AI Studio' });
      }
      setBusiness(biz);
    }

    let accs = connectedAccounts;
    if (!accs.some((a) => a.platform === 'linkedin')) {
      const serverAccs = await listConnectedAccounts(biz.id).catch(() => []);
      if (serverAccs.length > 0) {
        accs = serverAccs;
        setConnectedAccounts(accs);
      }
    }
    return biz;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const biz = await ensureBusinessAndAccount();
      const res = await generateNextPost(biz.id, topic.trim() || undefined);
      setResult(res as any);
    } catch (e: any) {
      Alert.alert('Generation Error', e.message || 'Could not generate post from backend.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishCreatedPost = async () => {
    if (!result?.id) return;
    setPublishing(true);
    try {
      await publishNow(result.id);
      Alert.alert('Published!', 'Post has been published to your LinkedIn feed.', [
        { text: 'View Schedule', onPress: () => router.push('/(dashboard)') },
      ]);
    } catch (e: any) {
      Alert.alert('Publishing Failed', e.message || 'Could not publish post. Please make sure your LinkedIn account is connected.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
          <Text style={styles.subtitle}>
            Have Dexter craft your next high-converting LinkedIn post with custom strategy.
          </Text>
        </View>

        {/* Topic Input */}
        <Card style={styles.topicCard} elevated>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Custom Topic or Angle (Optional)</Text>
          </View>
          <TextInput
            style={styles.topicInput}
            placeholder="e.g. 'Why founders should build in public in 2026' or leave empty for AI-chosen topic…"
            placeholderTextColor={colors.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline
          />
        </Card>

        {/* Content Pillars */}
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
          <Text style={styles.hintText}>Tap any pillar to apply as the prompt</Text>
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
              <Text style={styles.generateBtnText}>Draft & Queue Post with Dexter</Text>
            </>
          )}
        </Pressable>

        {/* Generated Result Card */}
        {result && (
          <Card style={styles.resultCard} elevated highlighted>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.positive} />
              <Text style={styles.sectionTitle}>Post Drafted & Scheduled</Text>
            </View>
            <Text style={styles.resultText}>{result.content_text}</Text>
            {result.scheduled_for && (
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
                <Text style={styles.resultSchedule}>
                  Scheduled for {new Date(result.scheduled_for).toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.resultActions}>
              <Pressable
                style={styles.publishNowBtn}
                onPress={handlePublishCreatedPost}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.publishNowText}>Publish to LinkedIn Now</Text>
                  </>
                )}
              </Pressable>
              <Pressable style={styles.viewFeedBtn} onPress={() => router.push('/(dashboard)')}>
                <Text style={styles.viewFeedText}>View in Upcoming Feed</Text>
              </Pressable>
            </View>
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

  resultCard: { gap: spacing.md, padding: spacing.xl },
  resultText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultSchedule: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  resultActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  publishNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 12,
    ...shadows.primaryBtn,
  },
  publishNowText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  viewFeedBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewFeedText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
});

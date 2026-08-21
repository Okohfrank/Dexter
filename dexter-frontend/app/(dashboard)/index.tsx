import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import { getScheduledPosts, cancelPost, publishNow } from '../../src/api/publishing';
import { getPublishedPosts, getLearningInsights } from '../../src/api/analytics';
import { SocialPostPreview } from '../../src/components/SocialPostPreview';
import { Card, Pill } from '../../src/components/ui';
import type { ScheduledPost, PublishedPost, LearningInsight } from '../../src/types';

type Tab = 'planned' | 'published' | 'learned';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const autonomousMode = useAppStore((s) => s.autonomousMode);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [tab, setTab] = useState<Tab>('planned');
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [published, setPublished] = useState<PublishedPost[]>([]);
  const [learnings, setLearnings] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const linkedin = connectedAccounts.find((a) => a.platform === 'linkedin');
      if (linkedin) {
        const posts = await getScheduledPosts(linkedin.id);
        setScheduled(posts || []);
      } else {
        setScheduled([]);
      }

      const pub = await getPublishedPosts(business?.id);
      setPublished(pub || []);

      const lrn = await getLearningInsights(business?.id);
      setLearnings(lrn || []);
    } catch {
      // Keep state clean
    } finally {
      setLoading(false);
    }
  }, [connectedAccounts, business]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const authorName = user?.full_name ?? 'Founder';
  const authorHeadline = business?.name
    ? `Founder & CEO • ${business.name}`
    : 'Founder & CEO';

  const handleCancel = (id: string) => {
    Alert.alert('Cancel post?', 'Dexter will remove this from the publishing queue.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel post',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelPost(id);
            setScheduled((prev) => prev.filter((p) => p.id !== id));
          } catch (e: any) {
            Alert.alert('Cancel failed', e.message);
          }
        },
      },
    ]);
  };

  const handlePublishNow = (id: string) => {
    Alert.alert('Publish now?', 'Override the schedule and publish immediately to LinkedIn.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          try {
            await publishNow(id);
            Alert.alert('Published', 'Post is live.');
            await loadData();
          } catch (e: any) {
            Alert.alert('Publish failed', e.message);
          }
        },
      },
    ]);
  };

  const formatWhen = (iso: string) => {
    if (!iso) return 'Scheduled';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Scheduled';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Pill
              label={autonomousMode ? 'AUTONOMOUS ACTIVE' : 'SUPERVISED'}
              variant={autonomousMode ? 'positive' : 'warning'}
              icon={autonomousMode ? 'radio' : 'pause'}
            />
            <Text style={styles.title}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `${business?.name ?? 'Your business'} is operating autonomously.`
                : 'Dexter is standing by for instructions.'}
            </Text>
          </View>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          {(
            [
              ['planned', 'Upcoming', 'calendar'],
              ['published', 'Published', 'checkmark-done'],
              ['learned', 'Insights', 'bulb'],
            ] as [Tab, string, keyof typeof Ionicons.glyphMap][]
          ).map(([key, label, icon]) => (
            <Pressable
              key={key}
              style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
              onPress={() => setTab(key)}
            >
              <Ionicons
                name={icon}
                size={14}
                color={tab === key ? '#FFFFFF' : colors.textSecondary}
              />
              <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        )}

        {/* Planned Posts Tab */}
        {tab === 'planned' && (
          <View style={styles.feedContainer}>
            {scheduled.length === 0 && !loading ? (
              <Card style={styles.emptyCard} elevated>
                <Ionicons name="sparkles" size={36} color={colors.primary} />
                <Text style={styles.emptyTitle}>Queue is Clear</Text>
                <Text style={styles.emptySubtitle}>
                  No scheduled posts yet. Head to the Create tab to have Dexter craft your next post.
                </Text>
              </Card>
            ) : (
              scheduled.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <SocialPostPreview
                    post={post}
                    authorName={authorName}
                    authorHeadline={authorHeadline}
                    platform="linkedin"
                    formattedTime={formatWhen(post.scheduled_for)}
                  />

                  {/* Dexter's Decision Card */}
                  <Card style={styles.decisionCard}>
                    <View style={styles.decisionHeader}>
                      <Ionicons name="sparkles" size={15} color={colors.primary} />
                      <Text style={styles.decisionLabel}>Dexter's Decision</Text>
                    </View>
                    <Text style={styles.reasonText}>
                      Scheduled for {formatWhen(post.scheduled_for)} because engagement peaks for your B2B audience during this window.
                    </Text>
                    <View style={styles.postActions}>
                      <Pressable style={styles.ghostBtn} onPress={() => handleCancel(post.id)}>
                        <Text style={styles.ghostBtnText}>Skip</Text>
                      </Pressable>
                      <Pressable
                        style={styles.ghostBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/(dashboard)/edit-post',
                            params: { post: JSON.stringify(post) },
                          })
                        }
                      >
                        <Text style={styles.ghostBtnText}>Edit / Swap</Text>
                      </Pressable>
                      <Pressable style={styles.solidBtn} onPress={() => handlePublishNow(post.id)}>
                        <Text style={styles.solidBtnText}>Publish now</Text>
                      </Pressable>
                    </View>
                  </Card>
                </View>
              ))
            )}
          </View>
        )}

        {/* Published Posts Tab */}
        {tab === 'published' && (
          <View style={styles.feedContainer}>
            {published.length === 0 && !loading ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Published Posts Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Posts published autonomously by Dexter or via 'Publish now' will appear here with engagement analytics.
                </Text>
              </Card>
            ) : (
              published.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  {post.caption_variant ? (
                    <View style={styles.variantBadgeWrap}>
                      <Pill label={`Pillar: ${post.caption_variant}`} variant="primary" />
                    </View>
                  ) : null}
                  <SocialPostPreview
                    post={post}
                    authorName={authorName}
                    authorHeadline={authorHeadline}
                    platform={post.platform}
                    formattedTime={formatWhen(post.published_at)}
                  />
                </View>
              ))
            )}
          </View>
        )}

        {/* Learned Insights Tab */}
        {tab === 'learned' && (
          <View style={styles.feedContainer}>
            {learnings.length === 0 && !loading ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="bulb-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Insights Accumulating</Text>
                <Text style={styles.emptySubtitle}>
                  Dexter is observing audience interactions. Actionable growth learnings will appear as your posts gain impressions.
                </Text>
              </Card>
            ) : (
              learnings.map((l) => (
                <Card key={l.id} style={styles.learnCard} elevated>
                  <View style={styles.learnHeader}>
                    <Ionicons name="bulb" size={18} color={colors.warning} />
                    <Text style={styles.learnDate}>{formatWhen(l.generated_at)}</Text>
                  </View>
                  <Text style={styles.learnSummary}>{l.summary}</Text>
                  <View style={styles.goalPill}>
                    <Ionicons name="flag-outline" size={12} color={colors.positive} />
                    <Text style={styles.goalText}>{l.relatedGoal}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, gap: spacing.xs },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  tabBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  feedContainer: { gap: spacing.lg },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 320,
  },

  postWrapper: { gap: spacing.sm },
  decisionCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decisionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reasonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  postActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  solidBtnText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },

  variantBadgeWrap: { marginBottom: 2 },
  learnCard: { gap: spacing.sm, padding: spacing.lg },
  learnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  learnDate: { ...typography.caption, color: colors.textMuted },
  learnSummary: { ...typography.body, color: colors.textPrimary, fontSize: 14, lineHeight: 22 },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.positiveSurface,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  goalText: { ...typography.caption, color: colors.positive, fontWeight: '600' },
});
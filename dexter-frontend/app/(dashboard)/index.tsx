import React, { useEffect, useState } from 'react';
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
import { getPublishedPosts, getLearningInsights, FALLBACK_PUBLISHED_POSTS, FALLBACK_LEARNING_INSIGHTS } from '../../src/api/analytics';
import { SocialPostPreview } from '../../src/components/SocialPostPreview';
import { GlassCard, GlassPill } from '../../src/components/ui';
import type { ScheduledPost, PublishedPost, LearningInsight } from '../../src/types';

const MOCK_SCHEDULED: ScheduledPost[] = [
  {
    id: 'mock-s-1',
    content_text:
      'We didn\'t build an AI employee. We built the tool that lets your brand post like one. Here\'s what that means for your content strategy: consistency, clarity, and autonomous execution. #AI #Founders #Automation',
    scheduled_for: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
    status: 'queued',
    platform_post_type: 'linkedin',
    media_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
    media_type: 'image',
    author_name: 'Alex Mercer',
    author_headline: 'Founder & CEO • Dexter AI',
  },
  {
    id: 'mock-s-2',
    content_text:
      'Posting consistently beats posting perfectly every time. 4x a week, at the right hours, is worth more than one viral piece a month. #ContentStrategy #Growth #B2B',
    scheduled_for: new Date(Date.now() + 1000 * 60 * 60 * 78).toISOString(),
    status: 'queued',
    platform_post_type: 'linkedin',
    author_name: 'Alex Mercer',
    author_headline: 'Founder & CEO • Dexter AI',
  },
];

type Tab = 'planned' | 'published' | 'learned';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const business = useAppStore((s) => s.business);
  const autonomousMode = useAppStore((s) => s.autonomousMode);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);

  const [tab, setTab] = useState<Tab>('planned');
  const [scheduled, setScheduled] = useState<ScheduledPost[]>(MOCK_SCHEDULED);
  const [published, setPublished] = useState<PublishedPost[]>(FALLBACK_PUBLISHED_POSTS);
  const [learnings, setLearnings] = useState<LearningInsight[]>(FALLBACK_LEARNING_INSIGHTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const linkedin = connectedAccounts.find((a) => a.platform === 'linkedin');
        if (linkedin) {
          const posts = await getScheduledPosts(linkedin.id);
          if (posts && posts.length > 0) setScheduled(posts);
        }
        const pub = await getPublishedPosts(business?.id);
        setPublished(pub);

        const lrn = await getLearningInsights(business?.id);
        setLearnings(lrn);
      } catch {
        // Fallbacks preserved
      } finally {
        setLoading(false);
      }
    })();
  }, [connectedAccounts, business]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const authorName = user?.full_name ?? 'Alex Mercer';
  const authorHeadline = business?.name ? `Founder & CEO • ${business.name}` : 'Founder & CEO • Dexter AI';

  const handleLogout = () => {
    clearAuth();
    useAppStore.getState().reset();
    router.replace('/(auth)/login');
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel post?', 'Dexter will not publish this post.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel post',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelPost(id);
            setScheduled((prev) => prev.filter((p) => p.id !== id));
          } catch {
            setScheduled((prev) => prev.filter((p) => p.id !== id));
          }
        },
      },
    ]);
  };

  const handlePublishNow = (id: string) => {
    Alert.alert('Publish now?', 'Override the schedule and publish immediately.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          try {
            await publishNow(id);
            Alert.alert('Published', 'Post is live.');
            setScheduled((prev) => prev.filter((p) => p.id !== id));
          } catch (e: any) {
            Alert.alert('Failed', e.message);
          }
        },
      },
    ]);
  };

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
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
            <View style={styles.badgeRow}>
              <GlassPill
                label={autonomousMode ? 'AUTONOMOUS ACTIVE' : 'SUPERVISED'}
                variant={autonomousMode ? 'positive' : 'warning'}
                icon={autonomousMode ? 'radio' : 'pause'}
              />
            </View>
            <Text style={styles.title}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `${business?.name ?? 'Your business'} is operating autonomously.`
                : 'Dexter is standing by for instructions.'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.avatarBtn} onPress={() => router.push('/(dashboard)/media')}>
              <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.avatarBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Business Brain Quick Access Card */}
        <Pressable onPress={() => router.push('/(onboarding)/brain')}>
          <GlassCard style={styles.quickCard} elevated>
            <View style={styles.quickIconWrap}>
              <Ionicons name="hardware-chip-outline" size={20} color={colors.primaryLight} />
            </View>
            <View style={styles.quickBody}>
              <Text style={styles.quickTitle}>Business Brain</Text>
              <Text style={styles.quickSubtitle}>Review or modify how Dexter understands your brand.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </GlassCard>
        </Pressable>

        {/* Frosted Segmented Tabs */}
        <View style={styles.tabsContainer}>
          {(
            [
              ['planned', 'Planning', 'calendar'],
              ['published', 'Published', 'checkmark-done'],
              ['learned', 'Learned', 'bulb'],
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

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

        {/* Planned Posts Tab */}
        {tab === 'planned' && (
          <View style={styles.feedContainer}>
            {scheduled.map((post) => (
              <View key={post.id} style={styles.postWrapper}>
                <SocialPostPreview
                  post={post}
                  authorName={authorName}
                  authorHeadline={authorHeadline}
                  platform="linkedin"
                  formattedTime={formatWhen(post.scheduled_for)}
                />

                {/* Dexter Reasoning & Actions Bento Box */}
                <GlassCard style={styles.decisionCard} elevated>
                  <View style={styles.decisionHeader}>
                    <Ionicons name="sparkles" size={15} color={colors.primaryLight} />
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
                </GlassCard>
              </View>
            ))}
          </View>
        )}

        {/* Published Posts Tab */}
        {tab === 'published' && (
          <View style={styles.feedContainer}>
            {published.map((post) => (
              <View key={post.id} style={styles.postWrapper}>
                <View style={styles.variantBadgeWrap}>
                  <GlassPill label={`Pillar: ${post.caption_variant}`} variant="primary" />
                </View>
                <SocialPostPreview
                  post={post}
                  authorName={authorName}
                  authorHeadline={authorHeadline}
                  platform={post.platform}
                  formattedTime={formatWhen(post.published_at)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Learned Insights Tab */}
        {tab === 'learned' && (
          <View style={styles.feedContainer}>
            {learnings.map((l) => (
              <GlassCard key={l.id} style={styles.learnCard} elevated>
                <View style={styles.learnHeader}>
                  <Ionicons name="bulb" size={18} color={colors.primaryLight} />
                  <Text style={styles.learnDate}>{formatWhen(l.generated_at)}</Text>
                </View>
                <Text style={styles.learnSummary}>{l.summary}</Text>
                <View style={styles.goalPill}>
                  <Ionicons name="flag-outline" size={12} color={colors.positive} />
                  <Text style={styles.goalText}>{l.relatedGoal}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1 },
  badgeRow: { marginBottom: spacing.xs },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.glassSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  quickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryGlass,
    borderWidth: 1,
    borderColor: colors.primaryGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBody: { flex: 1 },
  quickTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '700' },
  quickSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glassSurface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
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
    color: colors.primaryLight,
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
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassSurfaceElevated,
  },
  ghostBtnText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.positiveBg,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  goalText: { ...typography.caption, color: colors.positive, fontWeight: '600' },
});
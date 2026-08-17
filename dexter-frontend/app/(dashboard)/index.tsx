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
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import { getScheduledPosts, cancelPost, publishNow } from '../../src/api/publishing';
import type { ScheduledPost, PublishedPost, LearningInsight } from '../../src/types';

const MOCK_SCHEDULED: ScheduledPost[] = [
  {
    id: 'mock-s-1',
    content_text:
      'We didn\'t build an AI employee. We built the tool that lets your brand post like one. Here\'s what that means for your content…',
    scheduled_for: new Date(Date.now() + 1000 * 60 * 60 * 30).toISOString(),
    status: 'queued',
    platform_post_type: 'text',
  },
  {
    id: 'mock-s-2',
    content_text:
      'Posting consistently beats posting perfectly. 4x a week, at the right hours, is worth more than one viral piece a month.',
    scheduled_for: new Date(Date.now() + 1000 * 60 * 60 * 78).toISOString(),
    status: 'queued',
    platform_post_type: 'text',
  },
];

const MOCK_PUBLISHED: PublishedPost[] = [
  {
    id: 'mock-p-1',
    platform: 'linkedin',
    content_text: 'AI is not replacing your social media manager — it\'s hiring you one.',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    caption_variant: 'Professional / thought-leadership',
    performance: { impressions: 1840, likes: 212, comments: 34, shares: 41, clicks: 97 },
  },
  {
    id: 'mock-p-2',
    platform: 'linkedin',
    content_text: 'The 3 mistakes every small business makes with LinkedIn (and how to fix them).',
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    caption_variant: 'Professional / how-to',
    performance: { impressions: 920, likes: 88, comments: 12, shares: 19, clicks: 53 },
  },
];

const MOCK_LEARNINGS: LearningInsight[] = [
  {
    id: 'mock-l-1',
    generated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    summary:
      'Posts with a question in the first line get 2.3x more comments. I\'m starting more posts with questions.',
    relatedGoal: 'Grow LinkedIn following to 1,000 in 90 days',
  },
  {
    id: 'mock-l-2',
    generated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    summary:
      'Tuesday 8:30am posts outperform the week\'s average by 40%. Engaged comments (not likes) are the strongest signal of growth.',
    relatedGoal: 'Grow LinkedIn following to 1,000 in 90 days',
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const linkedin = connectedAccounts.find((a) => a.platform === 'linkedin');
      if (!linkedin) return;
      setLoading(true);
      try {
        const posts = await getScheduledPosts(linkedin.id);
        if (posts.length > 0) setScheduled(posts);
      } catch {
        // Keep mocks when the backend has no scheduled posts yet.
      } finally {
        setLoading(false);
      }
    })();
  }, [connectedAccounts]);

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  const handleLogout = () => {
    clearAuth();
    useAppStore.getState().reset();
    router.replace('/(auth)/login');
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel post?', 'Dexter will not publish this one.', [
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
            Alert.alert('Published', 'It\'s live.');
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.title}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `Autonomous mode is ON — ${business?.name ?? 'your business'} runs itself.`
                : 'Dexter is standing by.'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.avatar} onPress={() => router.push('/(dashboard)/media')}>
              <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.avatar} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.quickAction} onPress={() => router.push('/(onboarding)/brain')}>
          <View style={styles.quickIcon}>
            <Ionicons name="construct-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.quickBody}>
            <Text style={styles.quickTitle}>Business Brain</Text>
            <Text style={styles.quickSubtitle}>Review or edit how Dexter understands your business.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <View style={styles.tabs}>
          {(
            [
              ['planned', 'Planning'],
              ['published', 'Published'],
              ['learned', 'Learned'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

        {tab === 'planned' && (
          <>
            {scheduled.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.platformPill}>
                    <Ionicons name="logo-linkedin" size={13} color={colors.primary} />
                    <Text style={styles.platformText}>LinkedIn</Text>
                  </View>
                  <Text style={styles.postStatus}>{post.status}</Text>
                </View>
                <Text style={styles.postText}>{post.content_text}</Text>
                <View style={styles.postMeta}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.postMetaText}>{formatWhen(post.scheduled_for)}</Text>
                </View>
                <Text style={styles.reasonText}>
                  Why: mid-week mornings have the highest engagement for your audience.
                </Text>
                <View style={styles.postActions}>
                  <Pressable style={styles.ghostBtn} onPress={() => handleCancel(post.id)}>
                    <Text style={styles.ghostText}>Skip</Text>
                  </Pressable>
                  <Pressable
                    style={styles.ghostBtn}
                    onPress={() => router.push({ pathname: '/(dashboard)/edit-post', params: { post: JSON.stringify(post) } })}
                  >
                    <Text style={styles.ghostText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.solidBtn} onPress={() => handlePublishNow(post.id)}>
                    <Text style={styles.solidText}>Publish now</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Text style={styles.mockNote}>
              Showing sample posts — live data appears once a LinkedIn account is connected and
              Dexter starts planning.
            </Text>
          </>
        )}

        {tab === 'published' && (
          <>
            {MOCK_PUBLISHED.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.platformPill}>
                    <Ionicons name="logo-linkedin" size={13} color={colors.primary} />
                    <Text style={styles.platformText}>LinkedIn</Text>
                  </View>
                  <Text style={styles.variantText}>{post.caption_variant}</Text>
                </View>
                <Text style={styles.postText}>{post.content_text}</Text>
                <Text style={styles.postMetaText}>{formatWhen(post.published_at)}</Text>
                <View style={styles.statsRow}>
                  <Stat icon="eye-outline" value={post.performance.impressions} label="views" />
                  <Stat icon="heart-outline" value={post.performance.likes} label="likes" />
                  <Stat icon="chatbubble-outline" value={post.performance.comments} label="comments" />
                  <Stat icon="share-social-outline" value={post.performance.shares} label="shares" />
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'learned' && (
          <>
            {MOCK_LEARNINGS.map((l) => (
              <View key={l.id} style={styles.postCard}>
                <View style={styles.learnHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                  <Text style={styles.learnDate}>{formatWhen(l.generated_at)}</Text>
                </View>
                <Text style={styles.postText}>{l.summary}</Text>
                <View style={styles.goalPill}>
                  <Ionicons name="flag-outline" size={12} color={colors.primaryDark} />
                  <Text style={styles.goalText}>{l.relatedGoal}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBody: { flex: 1 },
  quickTitle: { ...typography.subheading, color: colors.textPrimary },
  quickSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.pill },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse, fontWeight: '700' },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  platformText: { ...typography.caption, color: colors.primaryDark },
  postStatus: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  variantText: { ...typography.caption, color: colors.textSecondary },
  postText: { ...typography.body, color: colors.textPrimary, fontSize: 15 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postMetaText: { ...typography.caption, color: colors.textSecondary },
  reasonText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontStyle: 'italic',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  postActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostText: { ...typography.subheading, color: colors.textPrimary },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  solidText: { ...typography.subheading, color: colors.textInverse },
  mockNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...typography.subheading, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  learnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  learnDate: { ...typography.caption, color: colors.textSecondary },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.positiveBg,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  goalText: { ...typography.caption, color: colors.primaryDark },
});
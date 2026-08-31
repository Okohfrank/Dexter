import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import * as WebBrowser from 'expo-web-browser';
import { getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { getScheduledPosts, cancelPost, publishNow } from '../../src/api/publishing';
import { getPublishedPosts, getLearningInsights, getPerformanceSummary } from '../../src/api/analytics';
import { listConnectedAccounts } from '../../src/api/oauth';
import { generateNextPost } from '../../src/api/strategy';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { SocialPostPreview } from '../../src/components/SocialPostPreview';
import { GlassCard, SegmentedControl, StatusDot, PulseDot } from '../../src/components/ui';
import type { ScheduledPost, PublishedPost, LearningInsight, PerformanceSummary } from '../../src/types';

type Tab = 'planned' | 'published' | 'learned';

const formatNum = (n: number): string => {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US');
};

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const autonomousMode = useAppStore((s) => s.autonomousMode);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const setConnectedAccounts = useAppStore((s) => s.setConnectedAccounts);

  const [tab, setTab] = useState<Tab>('planned');
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [published, setPublished] = useState<PublishedPost[]>([]);
  const [learnings, setLearnings] = useState<LearningInsight[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingQuick, setGeneratingQuick] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let biz = useAppStore.getState().business;
      if (!biz) {
        const bList = await listBusinesses().catch(() => []);
        if (bList.length > 0) {
          biz = bList[0];
          setBusiness(biz);
        } else {
          biz = await createBusiness({ name: 'My Company' }).catch(() => null) ?? {
            id: 'biz_main',
            user_id: 'u1',
            name: 'Dexter AI Studio',
            industry: 'AI & Growth',
            is_active: true,
            created_at: new Date().toISOString(),
          };
          setBusiness(biz);
        }
      }

      let accounts = useAppStore.getState().connectedAccounts;
      if (biz && accounts.length === 0) {
        accounts = await listConnectedAccounts(biz.id).catch(() => []);
        if (accounts.length > 0) {
          setConnectedAccounts(accounts);
        }
      }

      const linkedin = accounts.find((a) => a.platform === 'linkedin');
      if (linkedin) {
        const posts = await getScheduledPosts(linkedin.id).catch(() => []);
        setScheduled(posts || []);
      } else {
        setScheduled([]);
      }

      try {
        const pub = await getPublishedPosts(biz?.id);
        setPublished(pub || []);
      } catch {}

      try {
        const lrn = await getLearningInsights(biz?.id);
        setLearnings(lrn || []);
      } catch {}

      try {
        const s = await getPerformanceSummary(biz?.id);
        setSummary(s);
      } catch {}
    } catch {
      // Keep state clean
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setBusiness, setConnectedAccounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuickConnect = async () => {
    setConnecting(true);
    try {
      let biz = business;
      if (!biz) {
        const bList = await listBusinesses().catch(() => []);
        if (bList.length > 0) {
          biz = bList[0];
          setBusiness(biz);
        } else {
          biz = await createBusiness({ name: 'My Company' });
          setBusiness(biz);
        }
      }
      const { authorization_url } = await getLinkedInAuthorizationUrl(biz.id);
      await WebBrowser.openBrowserAsync(authorization_url);
      const accs = await listConnectedAccounts(biz.id).catch(() => []);
      setConnectedAccounts(accs);
      const liveAccount = accs.find((a) => a.platform === 'linkedin');
      if (liveAccount) {
        Alert.alert('LinkedIn Connected!', `Successfully linked as ${liveAccount.display_name}.`);
      } else {
        Alert.alert('Authorization', 'No LinkedIn profile was authenticated.');
      }
      await loadData();
    } catch (e: any) {
      Alert.alert('Connection Error', e.message || 'Could not connect LinkedIn.');
    } finally {
      setConnecting(false);
    }
  };

  const handleQuickGenerate = async () => {
    setGeneratingQuick(true);
    try {
      let biz = business;
      if (!biz) {
        biz = await createBusiness({ name: 'Dexter AI Studio' });
        setBusiness(biz);
      }
      await generateNextPost(biz.id);
      Alert.alert('Post Drafted & Queued', 'Dexter autonomously scheduled your next post.');
      await loadData();
    } catch (e: any) {
      Alert.alert('Generation Note', e.message);
    } finally {
      setGeneratingQuick(false);
    }
  };

  const rawName = user?.full_name?.trim() || 'Founder';
  const firstName = rawName.split(' ')[0] || 'Founder';
  const authorName = rawName || 'Founder';
  const authorHeadline = business?.name
    ? `Founder & CEO • ${business.name}`
    : 'Founder & CEO';

  const linkedinConnected = connectedAccounts.some((a) => a.platform === 'linkedin');

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

  const reach = summary?.total_impressions ?? null;
  const engagements = summary?.total_engagements ?? null;
  const rate = summary?.avg_engagement_rate_pct ?? null;

  const stats = [
    {
      icon: 'trending-up' as const,
      label: 'Total Reach',
      value: reach != null ? formatNum(reach) : '—',
      meta: 'lifetime impressions',
      tone: colors.primary,
      delta: null as string | null,
    },
    {
      icon: 'heart' as const,
      label: 'Engagements',
      value: engagements != null ? formatNum(engagements) : '—',
      meta: 'likes + comments + reposts',
      tone: '#D97A9A',
      delta: null as string | null,
    },
    {
      icon: 'pulse' as const,
      label: 'Engagement Rate',
      value: rate != null ? `${rate}%` : '—',
      meta: 'across published posts',
      tone: colors.positive,
      delta: null as string | null,
    },
    {
      icon: 'time' as const,
      label: 'Queued Posts',
      value: String(scheduled.length),
      meta: autonomousMode ? 'autonomous window' : 'awaiting approval',
      tone: colors.energy,
      delta: null as string | null,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `${business?.name ?? 'Your business'} is operating autonomously.`
                : 'Dexter is standing by for instructions.'}
            </Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={loadData} hitSlop={8}>
            <Ionicons name="refresh" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>

        {/* ── Hero Card (§8.1) ────────────────────────── */}
        <View style={[styles.heroCard, shadows.md]}>
          <View style={styles.heroLeft}>
            <View style={styles.heroEyebrowRow}>
              {generatingQuick || loading ? <PulseDot active size={10} /> : <StatusDot active={autonomousMode} color={autonomousMode ? colors.positive : colors.inkFaint} />}
              <Text style={styles.heroEyebrow}>
                {autonomousMode ? 'Autonomous Active' : 'Supervised Mode'}
              </Text>
            </View>
            <Text style={styles.heroStat}>{String(scheduled.length)}</Text>
            <Text style={styles.heroStatLabel}>Posts queued for publishing</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroMiniRow}>
              <Ionicons name={autonomousMode ? 'radio' : 'pause'} size={14} color={autonomousMode ? colors.positive : colors.inkSoft} />
              <Text style={styles.heroMiniText}>
                {autonomousMode ? 'Planning & publishing live' : 'You approve every post'}
              </Text>
            </View>
            <View style={styles.heroMiniRow}>
              <Ionicons name="link" size={14} color={colors.inkFaint} />
              <Text style={styles.heroMiniTextMuted}>
                {linkedinConnected ? 'LinkedIn linked' : 'LinkedIn not linked'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stat Grid (§3.3) ────────────────────────── */}
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, shadows.subtle]}>
              <View style={[styles.statIcon, { backgroundColor: colors.primarySurface }]}>
                <Ionicons name={s.icon} size={17} color={s.tone} />
              </View>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <View style={styles.statMetaRow}>
                {s.delta ? (
                  <View style={[styles.deltaPill, { backgroundColor: colors.positiveFill }]}>
                    <Text style={[styles.deltaText, { color: colors.positive }]}>{s.delta}</Text>
                  </View>
                ) : null}
                <Text style={styles.statMeta}>{s.meta}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Missing Channel Banner ──────────────────── */}
        {!linkedinConnected && (
          <GlassCard style={styles.channelBanner}>
            <View style={styles.channelBannerHeader}>
              <Ionicons name="logo-linkedin" size={20} color={colors.primary} />
              <Text style={styles.channelBannerTitle}>Link LinkedIn Account</Text>
            </View>
            <Text style={styles.channelBannerText}>
              Connect your account so Dexter can draft and publish thought-leadership posts for you.
            </Text>
            <Pressable
              style={[styles.channelBannerBtn, connecting && { opacity: 0.6 }]}
              onPress={handleQuickConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.channelBannerBtnText}>Connect LinkedIn</Text>
              )}
            </Pressable>
          </GlassCard>
        )}

        {/* ── Segmented Tabs ──────────────────────────── */}
        <SegmentedControl
          segments={[
            { key: 'planned' as Tab, label: 'Upcoming', icon: 'calendar' },
            { key: 'published' as Tab, label: 'Published', icon: 'checkmark-done' },
            { key: 'learned' as Tab, label: 'Insights', icon: 'bulb' },
          ]}
          selected={tab}
          onChange={setTab}
        />

        {loading && !refreshing && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        )}

        {/* ── Planned Posts Tab ───────────────────────── */}
        {tab === 'planned' && (
          <View style={styles.feedContainer}>
            {scheduled.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={34} color={colors.inkFaint} />
                <Text style={styles.emptyTitle}>Queue is clear</Text>
                <Text style={styles.emptySubtitle}>
                  No posts scheduled yet — ask Dexter to draft one now.
                </Text>
                <Pressable style={styles.emptyActionBtn} onPress={handleQuickGenerate} disabled={generatingQuick}>
                  {generatingQuick ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color={colors.surface} />
                      <Text style={styles.emptyActionText}>Draft Next Post with Dexter</Text>
                    </>
                  )}
                </Pressable>
              </GlassCard>
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
                  <GlassCard style={styles.decisionCard}>
                    <View style={styles.decisionHeader}>
                      <Ionicons name="pulse" size={15} color={colors.primary} />
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
              ))
            )}
          </View>
        )}

        {/* ── Published Posts Tab ─────────────────────── */}
        {tab === 'published' && (
          <View style={styles.feedContainer}>
            {published.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={34} color={colors.inkFaint} />
                <Text style={styles.emptyTitle}>Nothing published yet</Text>
                <Text style={styles.emptySubtitle}>
                  Posts published by Dexter or via "Publish now" appear here with engagement analytics.
                </Text>
              </GlassCard>
            ) : (
              published.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
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

        {/* ── Learned Insights Tab ────────────────────── */}
        {tab === 'learned' && (
          <View style={styles.feedContainer}>
            {learnings.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="bulb-outline" size={34} color={colors.inkFaint} />
                <Text style={styles.emptyTitle}>Insights accumulating</Text>
                <Text style={styles.emptySubtitle}>
                  Dexter is observing audience interactions. Growth learnings appear as posts gain impressions.
                </Text>
              </GlassCard>
            ) : (
              learnings.map((l) => (
                <GlassCard key={l.id} style={styles.learnCard} elevated>
                  <View style={styles.learnHeader}>
                    <Ionicons name="bulb" size={18} color={colors.energy} />
                    <Text style={styles.learnDate}>{formatWhen(l.generated_at)}</Text>
                  </View>
                  <Text style={styles.learnSummary}>{l.summary}</Text>
                  <View style={styles.goalPill}>
                    <Ionicons name="flag-outline" size={12} color={colors.positive} />
                    <Text style={styles.goalText}>{l.relatedGoal}</Text>
                  </View>
                </GlassCard>
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
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl + 64 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, gap: spacing.xs },
  title: { ...typography.displaySmall, marginTop: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.inkSoft, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero Card ──
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  heroLeft: { flex: 1, gap: spacing.xs },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: {
    ...typography.label,
    color: colors.primary,
    fontSize: 11,
  },
  heroStat: {
    ...typography.displayMedium,
    marginTop: spacing.xs,
    fontSize: 40,
    lineHeight: 44,
  },
  heroStatLabel: {
    ...typography.bodySmall,
    color: colors.inkSoft,
    marginTop: 2,
  },
  heroRight: { gap: spacing.sm, paddingTop: spacing.xs },
  heroMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMiniText: { ...typography.caption, color: colors.inkSoft },
  heroMiniTextMuted: { ...typography.caption, color: colors.inkFaint },

  // ── Stat Grid ──
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.2%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: { ...typography.label, fontSize: 11 },
  statValue: { ...typography.stat, marginTop: spacing.xs },
  statMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statMeta: { ...typography.caption2, color: colors.inkFaint, flex: 1 },
  deltaPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deltaText: { ...typography.caption2, fontWeight: '700' },

  // ── Channel Banner ──
  channelBanner: { gap: spacing.sm },
  channelBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  channelBannerTitle: { ...typography.h3, color: colors.ink },
  channelBannerText: { ...typography.bodySmall, color: colors.inkSoft, lineHeight: 19 },
  channelBannerBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  channelBannerBtnText: { color: colors.surface, fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // ── Feed ──
  feedContainer: { gap: spacing.lg },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  emptyTitle: { ...typography.h2, color: colors.ink, marginTop: spacing.xs },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    ...shadows.primaryBtn,
  },
  emptyActionText: {
    color: colors.surface,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  postWrapper: { gap: spacing.sm },
  decisionCard: { gap: spacing.sm },
  decisionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  decisionLabel: {
    ...typography.label,
    color: colors.primary,
    fontSize: 11,
  },
  reasonText: {
    ...typography.bodySmall,
    color: colors.ink,
    lineHeight: 20,
  },
  postActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghostBtnText: { ...typography.caption, color: colors.ink, fontFamily: 'Inter_600SemiBold' },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  solidBtnText: { ...typography.caption, color: colors.surface, fontFamily: 'Inter_700Bold' },

  learnCard: { gap: spacing.sm },
  learnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  learnDate: { ...typography.caption2, color: colors.inkFaint },
  learnSummary: { ...typography.bodySmall, color: colors.ink, lineHeight: 21 },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.positiveFill,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  goalText: { ...typography.caption2, color: colors.positive, fontFamily: 'Inter_600SemiBold' },
});
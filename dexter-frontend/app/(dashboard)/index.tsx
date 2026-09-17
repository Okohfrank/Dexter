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
import { Svg, Polyline, Polygon } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { dark, fonts, spacing, radii, typography } from '../../src/theme';
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
import { PulseDot } from '../../src/components/ui';
import type { ScheduledPost, PublishedPost, LearningInsight, PerformanceSummary } from '../../src/types';

type Tab = 'planned' | 'published' | 'learned';

const formatNum = (n: number): string => {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US');
};

/* Data-driven sparkline (react-native-svg). Real per-post series only —
 * returns null when fewer than 2 points rather than faking data. */
function Sparkline({
  data,
  color,
  width = 128,
  height = 36,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data
    .map(
      (v, i) =>
        `${(pad + i * stepX).toFixed(1)},${(
          height -
          pad -
          ((v - min) / span) * (height - pad * 2)
        ).toFixed(1)}`,
    )
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Polygon
        points={`${pad},${height} ${pts} ${width - pad},${height}`}
        fill={color}
        fillOpacity={0.14}
      />
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

  const impressionsSeries = published.map((p) => p.performance?.impressions ?? 0);
  const engagementSeries = published.map(
    (p) =>
      (p.performance?.likes ?? 0) +
      (p.performance?.comments ?? 0) +
      (p.performance?.shares ?? 0),
  );
  const rateSeries = published.map((p) => {
    const imp = p.performance?.impressions ?? 0;
    if (!imp) return 0;
    return (
      ((p.performance?.likes ?? 0) +
        (p.performance?.comments ?? 0) +
        (p.performance?.shares ?? 0)) /
      imp *
      100
    );
  });

  const stats = [
    {
      icon: 'trending-up' as const,
      label: 'Total Reach',
      value: reach != null ? formatNum(reach) : '—',
      meta: 'lifetime impressions',
      tone: dark.ink,
      spark: dark.inkSoft,
      series: impressionsSeries,
    },
    {
      icon: 'heart' as const,
      label: 'Engagements',
      value: engagements != null ? formatNum(engagements) : '—',
      meta: 'likes + comments + reposts',
      tone: '#E88BB0',
      spark: '#E88BB0',
      series: engagementSeries,
    },
    {
      icon: 'pulse' as const,
      label: 'Engagement Rate',
      value: rate != null ? `${rate}%` : '—',
      meta: 'across published posts',
      tone: dark.positive,
      spark: dark.positive,
      series: rateSeries,
    },
    {
      icon: 'time' as const,
      label: 'Queued Posts',
      value: String(scheduled.length),
      meta: autonomousMode ? 'autonomous window' : 'awaiting approval',
      tone: dark.accent,
      spark: dark.accent,
      series: [] as number[],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dark.inkSoft} />}
      >
        {/* ── Header: quiet greeting eyebrow ─────────── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `${business?.name ?? 'Your business'} is operating autonomously.`
                : 'Dexter is standing by for instructions.'}
            </Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={loadData} hitSlop={8}>
            <Ionicons name="refresh" size={18} color={dark.inkSoft} />
          </Pressable>
        </View>

        {/* ── Hero: oversized numeral + ambient glow ──── */}
        <View style={styles.heroCard}>
          <View style={styles.glowDisc} />
          <BlurView intensity={50} tint="dark" style={styles.glowBlur} />
          <View style={styles.heroContent}>
            <View style={styles.heroEyebrowRow}>
              {generatingQuick || loading ? (
                <PulseDot active size={10} color={dark.accent} />
              ) : (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: autonomousMode ? dark.positive : dark.inkFaint },
                  ]}
                />
              )}
              <Text style={styles.heroEyebrow}>
                {autonomousMode ? 'Autonomous Active' : 'Supervised Mode'}
              </Text>
            </View>
            <Text style={styles.heroStat}>{String(scheduled.length)}</Text>
            <Text style={styles.heroStatLabel}>Posts queued for publishing</Text>
            <View style={styles.heroFoot}>
              <View style={styles.heroMiniRow}>
                <Ionicons name={autonomousMode ? 'radio' : 'pause'} size={14} color={autonomousMode ? dark.positive : dark.inkSoft} />
                <Text style={styles.heroMiniText}>
                  {autonomousMode ? 'Planning & publishing live' : 'You approve every post'}
                </Text>
              </View>
              <View style={styles.heroMiniRow}>
                <Ionicons name="link" size={14} color={dark.inkFaint} />
                <Text style={styles.heroMiniTextMuted}>
                  {linkedinConnected ? 'LinkedIn linked' : 'LinkedIn not linked'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Stat strip: snap-scroll tiles + sparklines ─ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={176}
          decelerationRate="fast"
          contentContainerStyle={styles.statStrip}
        >
          {stats.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon} size={17} color={s.tone} />
              </View>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Sparkline data={s.series} color={s.spark} />
              <Text style={styles.statMeta}>{s.meta}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Missing Channel Banner ──────────────────── */}
        {!linkedinConnected && (
          <View style={styles.card}>
            <View style={styles.channelBannerHeader}>
              <Ionicons name="logo-linkedin" size={20} color={dark.accent} />
              <Text style={styles.channelBannerTitle}>Link LinkedIn Account</Text>
            </View>
            <Text style={styles.channelBannerText}>
              Connect your account so Dexter can draft and publish thought-leadership posts for you.
            </Text>
            <Pressable
              style={[styles.accentBtn, connecting && { opacity: 0.6 }]}
              onPress={handleQuickConnect}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.accentBtnText}>Connect LinkedIn</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* ── Segmented Tabs ──────────────────────────── */}
        <View style={styles.segTrack}>
          {(
            [
              { key: 'planned' as Tab, label: 'Upcoming', icon: 'calendar' },
              { key: 'published' as Tab, label: 'Published', icon: 'checkmark-done' },
              { key: 'learned' as Tab, label: 'Insights', icon: 'bulb' },
            ]
          ).map((seg) => {
            const active = seg.key === tab;
            return (
              <Pressable
                key={seg.key}
                style={[styles.seg, active && styles.segActive]}
                onPress={() => setTab(seg.key)}
              >
                <Ionicons
                  name={seg.icon as any}
                  size={14}
                  color={active ? dark.ink : dark.inkSoft}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.segLabel, active && styles.segLabelActive]}>
                  {seg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !refreshing && (
          <ActivityIndicator color={dark.accent} style={{ marginTop: spacing.xl }} />
        )}

        {/* ── Planned Posts Tab ───────────────────────── */}
        {tab === 'planned' && (
          <View style={styles.feedContainer}>
            {scheduled.length === 0 && !loading ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="calendar-outline" size={34} color={dark.inkFaint} />
                <Text style={styles.emptyTitle}>Queue is clear</Text>
                <Text style={styles.emptySubtitle}>
                  No posts scheduled yet — ask Dexter to draft one now.
                </Text>
                <Pressable style={styles.accentBtn} onPress={handleQuickGenerate} disabled={generatingQuick}>
                  {generatingQuick ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.accentBtnText}>Draft Next Post with Dexter</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              scheduled.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <SocialPostPreview
                    tone="dark"
                    post={post}
                    authorName={authorName}
                    authorHeadline={authorHeadline}
                    platform="linkedin"
                    formattedTime={formatWhen(post.scheduled_for)}
                  />

                  {/* Dexter's Decision Card */}
                  <View style={styles.card}>
                    <View style={styles.decisionHeader}>
                      <Ionicons name="pulse" size={15} color={dark.accent} />
                      <Text style={styles.decisionLabel}>Dexter&apos;s Decision</Text>
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
                      <Pressable style={styles.accentBtnSmall} onPress={() => handlePublishNow(post.id)}>
                        <Text style={styles.accentBtnTextSmall}>Publish now</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Published Posts Tab ─────────────────────── */}
        {tab === 'published' && (
          <View style={styles.feedContainer}>
            {published.length === 0 && !loading ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="checkmark-done-circle-outline" size={34} color={dark.inkFaint} />
                <Text style={styles.emptyTitle}>Nothing published yet</Text>
                <Text style={styles.emptySubtitle}>
                  Posts published by Dexter or via &quot;Publish now&quot; appear here with engagement analytics.
                </Text>
              </View>
            ) : (
              published.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  <SocialPostPreview
                    tone="dark"
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
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="bulb-outline" size={34} color={dark.inkFaint} />
                <Text style={styles.emptyTitle}>Insights accumulating</Text>
                <Text style={styles.emptySubtitle}>
                  Dexter is observing audience interactions. Growth learnings appear as posts gain impressions.
                </Text>
              </View>
            ) : (
              learnings.map((l) => (
                <View key={l.id} style={styles.card}>
                  <View style={styles.learnHeader}>
                    <Ionicons name="bulb" size={18} color={dark.warning} />
                    <Text style={styles.learnDate}>{formatWhen(l.generated_at)}</Text>
                  </View>
                  <Text style={styles.learnSummary}>{l.summary}</Text>
                  <View style={styles.goalPill}>
                    <Ionicons name="flag-outline" size={12} color={dark.positive} />
                    <Text style={styles.goalText}>{l.relatedGoal}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: dark.canvas },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    // Keeps the last feed item clear of the floating tab bar and its bottom gap.
    paddingBottom: spacing.huge + spacing.xxxxl + spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, gap: spacing.xs },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.inkSoft,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: dark.inkSoft,
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Shared card: tonal surface + hairline, no shadow ──
  card: {
    backgroundColor: dark.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: dark.hairline,
    padding: spacing.xl,
    gap: spacing.sm,
  },

  // ── Hero: glow canvas + oversized numeral ──
  heroCard: {
    position: 'relative',
    backgroundColor: dark.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: dark.hairline,
    overflow: 'hidden',
  },
  glowDisc: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: dark.accent,
    opacity: 0.28,
  },
  glowBlur: {
    position: 'absolute',
    top: -130,
    right: -90,
    width: 320,
    height: 320,
  },
  heroContent: {
    padding: spacing.xl,
    gap: spacing.xs,
  },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.accent,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  heroStat: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 64,
    lineHeight: 66,
    letterSpacing: -2,
    color: dark.ink,
    marginTop: spacing.sm,
  },
  heroStatLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
    marginTop: 2,
  },
  heroFoot: { gap: spacing.sm, paddingTop: spacing.sm },
  heroRight: { gap: spacing.sm, paddingTop: spacing.xs },
  heroMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMiniText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: dark.inkSoft,
  },
  heroMiniTextMuted: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: dark.inkFaint,
  },

  // ── Stat strip: tall snap tiles ──
  statStrip: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  statTile: {
    width: 164,
    backgroundColor: dark.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: dark.hairline,
    padding: spacing.lg,
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: dark.inkFaint,
  },
  statValue: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: dark.ink,
    marginTop: spacing.xs,
  },
  statMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: dark.inkFaint,
    marginTop: 2,
  },

  // ── Channel Banner / accent buttons ──
  channelBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  channelBannerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  channelBannerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: dark.inkSoft,
  },
  accentBtn: {
    backgroundColor: dark.accent,
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    minHeight: 48,
  },
  accentBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  accentBtnSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: dark.accent,
  },
  accentBtnTextSmall: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },

  // ── Segmented ──
  segTrack: {
    flexDirection: 'row',
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: radii.pill,
    padding: 4,
  },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  segActive: { backgroundColor: dark.surfaceElevated },
  segLabel: { fontFamily: fonts.medium, fontSize: 14, color: dark.inkSoft },
  segLabelActive: { fontFamily: fonts.semibold, color: dark.ink },

  // ── Feed ──
  feedContainer: { gap: spacing.lg },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: dark.ink,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: dark.inkSoft,
    textAlign: 'center',
    maxWidth: 300,
  },

  postWrapper: { gap: spacing.sm },
  decisionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  decisionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.accent,
  },
  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.ink,
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
    borderColor: dark.hairline,
    backgroundColor: dark.surfaceElevated,
  },
  ghostBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: dark.ink,
  },

  learnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  learnDate: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: dark.inkFaint,
  },
  learnSummary: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.ink,
    lineHeight: 21,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  goalText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: dark.positive,
  },
});

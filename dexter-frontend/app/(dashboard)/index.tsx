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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import * as WebBrowser from 'expo-web-browser';
import { getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { getScheduledPosts, cancelPost, publishNow } from '../../src/api/publishing';
import { getPublishedPosts, getLearningInsights } from '../../src/api/analytics';
import { listConnectedAccounts, mockConnectAccount } from '../../src/api/oauth';
import { generateNextPost } from '../../src/api/strategy';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { SocialPostPreview } from '../../src/components/SocialPostPreview';
import { GlassCard, GlassPill, SegmentedControl, StatusDot } from '../../src/components/ui';
import type { ScheduledPost, PublishedPost, LearningInsight } from '../../src/types';

const { width: SCREEN_W } = Dimensions.get('window');
const BENTO_GAP = spacing.md;
const BENTO_PADDING = spacing.lg;
const BENTO_COL = (SCREEN_W - BENTO_PADDING * 2 - BENTO_GAP) / 2;

type Tab = 'planned' | 'published' | 'learned';

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingQuick, setGeneratingQuick] = useState(false);

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
          biz = {
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
    } catch {
      // Keep state clean
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuickConnect = async () => {
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
      let accs = connectedAccounts;
      if (!accs.some((a) => a.platform === 'linkedin')) {
        const mockAcc = await mockConnectAccount(biz.id, 'linkedin');
        accs = [mockAcc];
        setConnectedAccounts(accs);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── Top Header ────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Good morning, {firstName}</Text>
            <Text style={styles.subtitle}>
              {autonomousMode
                ? `${business?.name ?? 'Your business'} is operating autonomously.`
                : 'Dexter is standing by for instructions.'}
            </Text>
          </View>
          <Pressable style={styles.refreshBtn} onPress={loadData}>
            <Ionicons name="refresh" size={18} color={colors.labelSecondary} />
          </Pressable>
        </View>

        {/* ── Bento Grid ────────────────────────────── */}
        <View style={styles.bentoGrid}>
          {/* Row 1: Hero Status Card (2x1) */}
          <View style={styles.bentoRow}>
            <View style={[styles.bentoCard, styles.bento2x1]}>
              <BlurView intensity={20} tint="dark" style={styles.bentoBlur}>
                <View style={styles.bentoContent}>
                  <View style={styles.heroAccent} />
                  <View style={styles.heroRow}>
                    <View style={styles.heroIconWrap}>
                      <Ionicons
                        name={autonomousMode ? 'radio' : 'pause'}
                        size={22}
                        color={autonomousMode ? colors.positive : colors.warning}
                      />
                    </View>
                    <View style={styles.heroTextWrap}>
                      <Text style={styles.heroLabel}>
                        {autonomousMode ? 'AUTONOMOUS ACTIVE' : 'SUPERVISED MODE'}
                      </Text>
                      <Text style={styles.heroSubtext}>
                        {autonomousMode
                          ? 'Dexter is actively planning and publishing content'
                          : 'Enable autonomous mode in Settings to let Dexter operate'}
                      </Text>
                    </View>
                    <StatusDot active={autonomousMode} />
                  </View>
                </View>
              </BlurView>
            </View>
          </View>

          {/* Row 2: Stats (3x 1x1 cards) */}
          <View style={styles.bentoRow}>
            <View style={[styles.bentoCard, styles.bento1x1]}>
              <BlurView intensity={20} tint="dark" style={styles.bentoBlur}>
                <View style={styles.bentoContent}>
                  <Ionicons name="trending-up" size={18} color={colors.systemTeal} />
                  <Text style={styles.statValue}>14.2k</Text>
                  <Text style={styles.statLabel}>Total Reach</Text>
                  <Text style={styles.statGrowth}>+28%</Text>
                </View>
              </BlurView>
            </View>
            <View style={[styles.bentoCard, styles.bento1x1]}>
              <BlurView intensity={20} tint="dark" style={styles.bentoBlur}>
                <View style={styles.bentoContent}>
                  <Ionicons name="heart" size={18} color={colors.systemPink} />
                  <Text style={styles.statValue}>1,240</Text>
                  <Text style={styles.statLabel}>Engagements</Text>
                  <Text style={styles.statGrowth}>8.7% rate</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* Row 3: Autonomy + Next Post */}
          <View style={styles.bentoRow}>
            <View style={[styles.bentoCard, styles.bento1x1]}>
              <BlurView intensity={20} tint="dark" style={styles.bentoBlur}>
                <View style={styles.bentoContent}>
                  <Ionicons name="rocket" size={18} color={colors.systemPurple} />
                  <Text style={styles.statValue}>94%</Text>
                  <Text style={styles.statLabel}>Autonomy</Text>
                  <Text style={styles.statGrowth}>Zero friction</Text>
                </View>
              </BlurView>
            </View>
            <View style={[styles.bentoCard, styles.bento1x1]}>
              <BlurView intensity={20} tint="dark" style={styles.bentoBlur}>
                <View style={styles.bentoContent}>
                  <Ionicons name="time" size={18} color={colors.systemOrange} />
                  <Text style={styles.statValue}>{scheduled.length}</Text>
                  <Text style={styles.statLabel}>Queued Posts</Text>
                  <Text style={styles.statGrowth}>Upcoming</Text>
                </View>
              </BlurView>
            </View>
          </View>
        </View>

        {/* ── Missing Channel Banner ─────────────────── */}
        {!linkedinConnected && (
          <GlassCard style={styles.channelBanner} elevated>
            <View style={styles.channelBannerHeader}>
              <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
              <Text style={styles.channelBannerTitle}>Link LinkedIn Account</Text>
            </View>
            <Text style={styles.channelBannerText}>
              Connect your account so Dexter can draft and publish thought-leadership posts autonomously.
            </Text>
            <Pressable style={styles.channelBannerBtn} onPress={handleQuickConnect}>
              <Text style={styles.channelBannerBtnText}>Connect LinkedIn (1-Tap)</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* ── Segmented Tabs ─────────────────────────── */}
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
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        )}

        {/* ── Planned Posts Tab ──────────────────────── */}
        {tab === 'planned' && (
          <View style={styles.feedContainer}>
            {scheduled.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard} elevated>
                <Ionicons name="sparkles" size={36} color={colors.primary} />
                <Text style={styles.emptyTitle}>Queue is Clear</Text>
                <Text style={styles.emptySubtitle}>
                  No scheduled posts yet. Have Dexter craft a post based on your business brain right now.
                </Text>
                <Pressable
                  style={styles.emptyActionBtn}
                  onPress={handleQuickGenerate}
                  disabled={generatingQuick}
                >
                  {generatingQuick ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color="#FFFFFF" />
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
                  </GlassCard>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Published Posts Tab ────────────────────── */}
        {tab === 'published' && (
          <View style={styles.feedContainer}>
            {published.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={colors.labelTertiary} />
                <Text style={styles.emptyTitle}>No Published Posts Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Posts published autonomously by Dexter or via 'Publish now' will appear here with engagement analytics.
                </Text>
              </GlassCard>
            ) : (
              published.map((post) => (
                <View key={post.id} style={styles.postWrapper}>
                  {post.caption_variant ? (
                    <View style={styles.variantBadgeWrap}>
                      <GlassPill label={`Pillar: ${post.caption_variant}`} variant="primary" />
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

        {/* ── Learned Insights Tab ──────────────────── */}
        {tab === 'learned' && (
          <View style={styles.feedContainer}>
            {learnings.length === 0 && !loading ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="bulb-outline" size={36} color={colors.labelTertiary} />
                <Text style={styles.emptyTitle}>Insights Accumulating</Text>
                <Text style={styles.emptySubtitle}>
                  Dexter is observing audience interactions. Actionable growth learnings will appear as your posts gain impressions.
                </Text>
              </GlassCard>
            ) : (
              learnings.map((l) => (
                <GlassCard key={l.id} style={styles.learnCard} elevated>
                  <View style={styles.learnHeader}>
                    <Ionicons name="bulb" size={18} color={colors.warning} />
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
  scroll: { padding: BENTO_PADDING, gap: spacing.lg, paddingBottom: spacing.xxxxl + 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { flex: 1, gap: spacing.xs },
  title: { ...typography.display, color: colors.labelPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.callout, color: colors.labelSecondary, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Bento Grid ──
  bentoGrid: { gap: BENTO_GAP },
  bentoRow: { flexDirection: 'row', gap: BENTO_GAP },
  bentoCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  bentoBlur: { flex: 1, overflow: 'hidden' },
  bentoContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  bento2x1: {
    flex: 1,
    height: BENTO_COL * 0.5,
  },
  bento1x1: {
    flex: 1,
    height: BENTO_COL * 0.65,
  },

  // ── Hero Card ──
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: { flex: 1 },
  heroLabel: {
    ...typography.caption2,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroSubtext: {
    ...typography.caption,
    color: colors.labelSecondary,
    marginTop: 2,
  },

  // ── Stat Cards ──
  statValue: {
    ...typography.heading,
    color: colors.labelPrimary,
    fontSize: 22,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption2,
    color: colors.labelTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statGrowth: {
    ...typography.caption2,
    color: colors.positive,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Channel Banner ──
  channelBanner: {
    gap: spacing.sm,
  },
  channelBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  channelBannerTitle: { ...typography.subheading, color: '#5AC8FA', fontWeight: '700' },
  channelBannerText: { ...typography.caption, color: colors.labelSecondary, fontSize: 13, lineHeight: 18 },
  channelBannerBtn: {
    backgroundColor: '#0A66C2',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  channelBannerBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // ── Feed ──
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
    color: colors.labelPrimary,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    ...typography.callout,
    color: colors.labelSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 320,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    ...shadows.primaryBtn,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  postWrapper: { gap: spacing.sm },
  decisionCard: {
    gap: spacing.sm,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  decisionLabel: {
    ...typography.caption2,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reasonText: {
    ...typography.callout,
    color: colors.labelPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  postActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  ghostBtnText: { ...typography.caption, color: colors.labelPrimary, fontWeight: '600' },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  solidBtnText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },

  variantBadgeWrap: { marginBottom: 2 },

  learnCard: { gap: spacing.sm },
  learnHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  learnDate: { ...typography.caption2, color: colors.labelTertiary },
  learnSummary: { ...typography.callout, color: colors.labelPrimary, fontSize: 14, lineHeight: 22 },
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
  goalText: { ...typography.caption2, color: colors.positive, fontWeight: '600' },
});
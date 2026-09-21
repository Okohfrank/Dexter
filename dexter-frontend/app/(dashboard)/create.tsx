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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Clock3, Send, X, ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing } from '../../src/theme';
import { usePressFeedback } from '../../src/lib/animate';
import { useAppStore } from '../../src/store/app';
import { useAuthStore } from '../../src/api/client';
import { generateNextPost } from '../../src/api/strategy';
import { listBusinesses, createBusiness } from '../../src/api/business';
import { listConnectedAccounts } from '../../src/api/oauth';
import { publishNow } from '../../src/api/publishing';

/* v2 create — Digg composer shell + Instagram option rows and sticky
 * action button, on the Dexter dark system. Flow unchanged:
 * topic → pillars → draft & queue → publish now / view feed. */
export default function CreateScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const setConnectedAccounts = useAppStore((s) => s.setConnectedAccounts);
  const contentPlan = useAppStore((s) => s.contentPlan);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ id?: string; content_text: string; scheduled_for?: string } | null>(null);
  const fbShare = usePressFeedback();
  const fbPublish = usePressFeedback();
  const fbFeed = usePressFeedback();

  const authorName = user?.full_name?.trim() || 'Founder';
  const authorHeadline = business?.name
    ? `Founder & CEO • ${business.name}`
    : 'Founder & CEO';

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

  const handleCancel = () => {
    setTopic('');
    setResult(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top bar (Digg) ── */}
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>New post</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Author row (Digg) ── */}
          <View style={styles.authorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>
                {authorName}
              </Text>
              <Text style={styles.authorHeadline} numberOfLines={1}>
                {authorHeadline}
              </Text>
            </View>
          </View>

          {/* ── Topic composer (Digg body) ── */}
          <TextInput
            style={styles.topicInput}
            placeholder="What should Dexter write about?"
            placeholderTextColor={dark.inkFaint}
            value={topic}
            onChangeText={setTopic}
            multiline
          />

          {/* ── Pillar chips (Instagram action chips) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {pillars.map((p, i) => (
              <Pressable key={i} style={styles.pillarChip} onPress={() => setTopic(p)}>
                <Icon as={Sparkles} size={14} color={dark.accent} />
                <Text style={styles.pillarChipText} numberOfLines={1}>
                  {p}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.hintText}>Tap a pillar to use it as the prompt</Text>

          {/* ── Details (Instagram option rows) ── */}
          <View style={styles.detailsCard}>
            <Pressable
              style={styles.detailRow}
              onPress={() => router.push('/(onboarding)')}
              accessibilityRole="button"
              accessibilityLabel="Manage connections"
            >
              <View style={styles.detailIconBox}>
                <Ionicons name="logo-linkedin" size={18} color={dark.accent} />
              </View>
              <View style={styles.detailBody}>
                <Text style={styles.detailLabel}>Posting to</Text>
                <Text style={styles.detailSub}>LinkedIn account</Text>
              </View>
              <Icon as={ChevronRight} size={18} color={dark.inkFaint} />
            </Pressable>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Icon as={Clock3} size={18} color={dark.inkSoft} />
              </View>
              <View style={styles.detailBody}>
                <Text style={styles.detailLabel}>Schedule</Text>
                <Text style={styles.detailSub}>Automatic — Dexter picks the best window</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Icon as={Sparkles} size={18} color={dark.inkSoft} />
              </View>
              <View style={styles.detailBody}>
                <Text style={styles.detailLabel}>Pillar</Text>
                <Text style={styles.detailSub} numberOfLines={1}>
                  {topic.trim() || 'AI-chosen topic'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Draft action ── */}
          <Pressable
            style={[styles.shareBtn, fbShare.feedback]}
            onPress={handleGenerate}
            disabled={generating}
            {...fbShare.bind}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon as={Sparkles} size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>Draft with Dexter</Text>
              </>
            )}
          </Pressable>

          {/* ── Draft result card (Digg preview card) ── */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultIconBox}>
                  <Icon as={Sparkles} size={16} color={dark.positive} />
                </View>
                <Text style={styles.resultTitle}>Drafted & scheduled</Text>
                <Pressable
                  style={styles.dismissBtn}
                  hitSlop={8}
                  onPress={() => setResult(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss draft"
                >
                  <Icon as={X} size={16} color={dark.inkFaint} />
                </Pressable>
              </View>
              <Text style={styles.resultText}>{result.content_text}</Text>
              {result.scheduled_for && (
                <View style={styles.scheduleRow}>
                  <Icon as={Clock3} size={14} color={dark.accent} />
                  <Text style={styles.scheduleText}>
                    Scheduled for {new Date(result.scheduled_for).toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.resultActions}>
                <Pressable
                  style={[styles.publishBtn, fbPublish.feedback]}
                  onPress={handlePublishCreatedPost}
                  disabled={publishing}
                  {...fbPublish.bind}
                >
                  {publishing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Icon as={Send} size={16} color="#FFF" />
                      <Text style={styles.publishBtnText}>Publish to LinkedIn Now</Text>
                    </>
                  )}
                </Pressable>
                <Pressable style={[styles.feedBtn, fbFeed.feedback]} onPress={() => router.push('/(dashboard)')} {...fbFeed.bind}>
                  <Text style={styles.feedBtnText}>View in Upcoming Feed</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: dark.canvas },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: dark.inkSoft,
  },
  topBarTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 18,
    letterSpacing: -0.2,
    color: dark.ink,
  },
  topBarSpacer: { width: 60 },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 18,
    color: dark.ink,
  },
  authorInfo: { flex: 1 },
  authorName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  authorHeadline: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
    marginTop: 1,
  },

  topicInput: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.3,
    color: dark.ink,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  chipsScroll: { height: 52, flexGrow: 0, flexShrink: 0 },
  chipsContent: { alignItems: 'center', gap: spacing.sm, paddingRight: 20 },
  pillarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    maxWidth: 260,
  },
  pillarChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
  },
  hintText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    fontStyle: 'italic',
    color: dark.inkFaint,
  },

  detailsCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 64,
  },
  detailIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailBody: { flex: 1, flexShrink: 1 },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: dark.ink,
  },
  detailSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
    marginTop: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: dark.hairline,
    marginLeft: 64,
    marginRight: spacing.lg,
  },

  resultCard: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resultIconBox: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: dark.ink,
  },
  dismissBtn: { padding: 4 },
  resultText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: dark.ink,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.accent,
  },
  resultActions: { gap: spacing.sm, marginTop: spacing.xs },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 13,
    minHeight: 48,
  },
  publishBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  feedBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingVertical: 12,
    minHeight: 48,
  },
  feedBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: dark.ink,
  },

  stickyBar: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 17,
    minHeight: 58,
  },
  shareBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});

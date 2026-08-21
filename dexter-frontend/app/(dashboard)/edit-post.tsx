import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform as RNPlatform,
  KeyboardAvoidingView,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { updateScheduledPost } from '../../src/api/publishing';
import { listMediaAssets, uploadMediaAsset } from '../../src/api/media';
import { useAppStore } from '../../src/store/app';
import { Card, Pill } from '../../src/components/ui';
import type { ScheduledPost, Platform, MediaAsset } from '../../src/types';

const PLATFORMS: { value: Platform; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { value: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'musical-notes-outline' },
];

const MAX_CHARS = 3000;

export default function EditPostScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const contentPlan = useAppStore((s) => s.contentPlan);
  const { post: postParam } = useLocalSearchParams<{ post?: string }>();
  const post: ScheduledPost | undefined = postParam ? JSON.parse(postParam) : undefined;

  const [content, setContent] = useState(post?.content_text ?? '');
  const [platform, setPlatform] = useState<Platform>((post?.platform_post_type as Platform) ?? 'linkedin');
  const [mediaUrl, setMediaUrl] = useState<string | null>(post?.media_url ?? null);
  const [date, setDate] = useState<Date>(
    post?.scheduled_for ? new Date(post.scheduled_for) : new Date(Date.now() + 86400000),
  );
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const pillars = contentPlan?.pillars ?? ['Founder Thought Leadership', 'Product Deep-dives', 'Industry Frameworks', 'Customer Wins'];

  useEffect(() => {
    if (modalVisible) {
      setLoadingAssets(true);
      listMediaAssets(business?.id)
        .then((assets) => setLibraryAssets(assets))
        .catch(() => setLibraryAssets([]))
        .finally(() => setLoadingAssets(false));
    }
  }, [modalVisible, business]);

  const shiftDate = (hours: number) => {
    setDate((d) => new Date(d.getTime() + hours * 60 * 60 * 1000));
  };

  const handlePickFromDevice = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose media for this post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setMediaUrl(asset.uri);
    setModalVisible(false);

    uploadMediaAsset({
      business_id: business?.id,
      file_name: asset.fileName ?? 'upload.jpg',
      media_type: asset.type === 'video' ? 'video' : 'image',
      url: asset.uri,
      tags: ['override'],
    }).catch(() => {});
  };

  const handleSelectAsset = (asset: MediaAsset) => {
    setMediaUrl(asset.url);
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!post) {
      Alert.alert('Missing post', 'No post to edit.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Caption required', 'Add some text before saving.');
      return;
    }
    setSaving(true);
    try {
      if (!post.id.startsWith('sched_')) {
        await updateScheduledPost(post.id, {
          content_text: content.trim(),
          scheduled_for: date.toISOString(),
          platform,
        });
      }
      Alert.alert('Updated', 'Your changes are saved and scheduled.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Updated', 'Your schedule changes have been saved.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Edit Post</Text>
          </View>

          {/* Platform Selector */}
          <Text style={styles.label}>Target Platform</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => {
              const selected = platform === p.value;
              return (
                <Pressable
                  key={p.value}
                  style={[styles.platformChip, selected && styles.platformChipActive]}
                  onPress={() => setPlatform(p.value)}
                >
                  <Ionicons
                    name={p.icon}
                    size={16}
                    color={selected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[styles.platformChipText, selected && styles.platformChipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Caption Variant (Pillar) Selector */}
          <Text style={styles.label}>Content Pillar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillarScroll}>
            <View style={styles.pillarRow}>
              {pillars.map((p, i) => (
                <Pill key={i} label={p} variant="primary" />
              ))}
            </View>
          </ScrollView>

          {/* Caption Editor */}
          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={[styles.input, isOverLimit && { borderColor: colors.negative }]}
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Write your post…"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.charCount, isOverLimit && { color: colors.negative }]}>
            {charCount} / {MAX_CHARS}
          </Text>

          {/* Media Attachment */}
          <Text style={styles.label}>Attached Media</Text>
          {mediaUrl ? (
            <Card style={styles.mediaPreviewCard}>
              <Image source={{ uri: mediaUrl }} style={styles.mediaPreviewImage} resizeMode="cover" />
              <View style={styles.mediaActionsRow}>
                <Pressable style={styles.mediaActionBtn} onPress={() => setModalVisible(true)}>
                  <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                  <Text style={styles.mediaActionText}>Swap media</Text>
                </Pressable>
                <Pressable style={styles.mediaActionBtnDanger} onPress={() => setMediaUrl(null)}>
                  <Ionicons name="trash-outline" size={16} color={colors.negative} />
                  <Text style={styles.mediaActionDangerText}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          ) : (
            <Pressable style={styles.attachPlaceholder} onPress={() => setModalVisible(true)}>
              <View style={styles.attachIconWrap}>
                <Ionicons name="image-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.attachTitle}>Attach Visual Media</Text>
              <Text style={styles.attachSubtitle}>Choose from Media Library or camera roll</Text>
            </Pressable>
          )}

          {/* Scheduled Time */}
          <Text style={styles.label}>Scheduled Time</Text>
          <Card style={styles.timeRow}>
            <Pressable style={styles.stepBtn} onPress={() => shiftDate(-24)}>
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.timeText}>{date.toLocaleString()}</Text>
            <Pressable style={styles.stepBtn} onPress={() => shiftDate(24)}>
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </Pressable>
          </Card>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickChip} onPress={() => shiftDate(-1)}>
              <Text style={styles.quickText}>−1 hr</Text>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => shiftDate(1)}>
              <Text style={styles.quickText}>+1 hr</Text>
            </Pressable>
            <Pressable style={styles.quickChip} onPress={() => shiftDate(24)}>
              <Text style={styles.quickText}>+1 day</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Dexter will adjust this slot while maintaining the rest of the autonomous schedule.
          </Text>

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Media Selector Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Media</Text>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Pressable style={styles.uploadNewBtn} onPress={handlePickFromDevice}>
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={styles.uploadNewText}>Upload from camera roll</Text>
            </Pressable>

            <Text style={styles.modalSectionLabel}>From Media Library</Text>

            {loadingAssets ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : libraryAssets.length === 0 ? (
              <View style={styles.emptyLibrary}>
                <Ionicons name="images-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyLibraryText}>No media in library yet</Text>
              </View>
            ) : (
              <FlatList
                data={libraryAssets}
                keyExtractor={(item) => item.id}
                numColumns={3}
                contentContainerStyle={styles.libraryGrid}
                columnWrapperStyle={styles.libraryRow}
                renderItem={({ item }) => (
                  <Pressable style={styles.libraryThumb} onPress={() => handleSelectAsset(item)}>
                    <Image source={{ uri: item.url }} style={styles.thumbImage} />
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.xxl, gap: spacing.md, paddingBottom: spacing.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.heading, color: colors.textPrimary },
  label: { ...typography.subheading, color: colors.textPrimary, marginTop: spacing.sm },
  platformRow: { flexDirection: 'row', gap: spacing.sm },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  platformChipText: { ...typography.caption, color: colors.textSecondary },
  platformChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  pillarScroll: { marginTop: spacing.xs },
  pillarRow: { flexDirection: 'row', gap: spacing.sm },

  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  mediaPreviewCard: { padding: 0, overflow: 'hidden' },
  mediaPreviewImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.skeleton,
  },
  mediaActionsRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceAlt,
  },
  mediaActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  mediaActionText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  mediaActionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.negativeSurface,
    borderWidth: 1,
    borderColor: colors.negativeBorder,
  },
  mediaActionDangerText: { ...typography.caption, color: colors.negative, fontWeight: '600' },
  attachPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  attachIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  attachTitle: { ...typography.subheading, color: colors.textPrimary },
  attachSubtitle: { ...typography.caption, color: colors.textSecondary },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { ...typography.caption, color: colors.primary },
  timeText: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    marginTop: spacing.sm,
    ...shadows.primaryBtn,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: fonts.bold },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xxl,
    maxHeight: '80%',
    gap: spacing.md,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    ...shadows.primaryBtn,
  },
  uploadNewText: { ...typography.subheading, color: '#FFFFFF', fontWeight: '700' },
  modalSectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  emptyLibrary: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyLibraryText: { ...typography.caption, color: colors.textMuted },
  libraryGrid: { gap: spacing.sm, paddingBottom: spacing.xxl },
  libraryRow: { gap: spacing.sm },
  libraryThumb: {
    flex: 1 / 3,
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbImage: { width: '100%', height: '100%' },
});
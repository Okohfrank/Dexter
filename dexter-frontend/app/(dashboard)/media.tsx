import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { listMediaAssets, uploadMediaAsset } from '../../src/api/media';
import { Card, Pill } from '../../src/components/ui';
import type { MediaAsset } from '../../src/types';

const PRESET_TAGS = ['All', 'Product', 'Brand', 'Team', 'Event', 'Video'];

export default function MediaLibraryScreen() {
  const business = useAppStore((s) => s.business);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('All');

  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await listMediaAssets(business?.id);
        setAssets(list);
      } catch {
        // Keep fallback
      } finally {
        setLoading(false);
      }
    })();
  }, [business]);

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow media access to add photos and videos to your library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    setUploading(true);
    try {
      const newAssets: MediaAsset[] = [];
      for (const asset of result.assets) {
        const isVid = asset.type === 'video';
        const defaultTags = isVid ? ['Video'] : ['Photo'];
        const created = await uploadMediaAsset({
          business_id: business?.id,
          file_name: asset.fileName ?? (isVid ? 'video.mp4' : 'image.jpg'),
          media_type: isVid ? 'video' : 'image',
          url: asset.uri,
          tags: defaultTags,
        });
        newAssets.push(created);
      }
      setAssets((prev) => [...newAssets, ...prev]);
    } catch {
      Alert.alert('Upload failed', 'Could not add the selected media.');
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = (id: string) => {
    Alert.alert('Remove media?', 'Dexter will stop using this in future posts.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setAssets((prev) => prev.filter((a) => a.id !== id)),
      },
    ]);
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (!tag || !editingAsset) return;
    const updated = {
      ...editingAsset,
      tags: [...new Set([...editingAsset.tags, tag])],
    };
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAsset(updated);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingAsset) return;
    const updated = {
      ...editingAsset,
      tags: editingAsset.tags.filter((t) => t !== tagToRemove),
    };
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setEditingAsset(updated);
  };

  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search.trim() ||
      a.file_name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesTag =
      activeTag === 'All' ||
      (activeTag === 'Video' ? a.media_type === 'video' : a.tags.includes(activeTag));

    return matchesSearch && matchesTag;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Media Library</Text>
          <Text style={styles.subtitle}>Dexter auto-selects from here when planning visuals.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={pickAndUpload} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="add" size={22} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by filename or tag…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Tag Filters */}
      <View style={styles.tagFiltersRow}>
        {PRESET_TAGS.map((tag) => {
          const isSelected = activeTag === tag;
          return (
            <Pressable
              key={tag}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setActiveTag(tag)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No media found</Text>
              <Text style={styles.emptyText}>
                {search || activeTag !== 'All'
                  ? 'Try adjusting your search or tag filters.'
                  : 'Add images, videos, and brand assets for Dexter to use.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.assetCard} onPress={() => setEditingAsset(item)}>
              <View style={styles.assetImageWrap}>
                <Image source={{ uri: item.url }} style={styles.assetImage} />
                {item.media_type === 'video' && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={12} color="#FFFFFF" />
                  </View>
                )}
                <Pressable style={styles.removeBtn} onPress={() => removeAsset(item.id)}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={styles.assetName} numberOfLines={1}>
                {item.file_name}
              </Text>
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Edit Tags Modal */}
      <Modal visible={!!editingAsset} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Asset Tags</Text>
              <Pressable style={styles.closeBtn} onPress={() => setEditingAsset(null)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            {editingAsset && (
              <View style={styles.modalBody}>
                <Image source={{ uri: editingAsset.url }} style={styles.modalAssetImage} />
                <Text style={styles.modalAssetName}>{editingAsset.file_name}</Text>

                <Text style={styles.modalLabel}>Tags for Dexter</Text>
                <View style={styles.modalChips}>
                  {editingAsset.tags.map((tag) => (
                    <View key={tag} style={styles.modalChip}>
                      <Text style={styles.modalChipText}>{tag}</Text>
                      <Pressable onPress={() => handleRemoveTag(tag)} hitSlop={6}>
                        <Ionicons name="close-circle" size={14} color={colors.primary} />
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.addTagInputRow}>
                  <TextInput
                    style={styles.addTagInput}
                    placeholder="Add tag (e.g. Product, Event)…"
                    placeholderTextColor={colors.textMuted}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                  <Pressable style={styles.addTagConfirmBtn} onPress={handleAddTag}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  headerTitle: { flex: 1 },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  tagFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  loading: { marginTop: spacing.xxxl },
  grid: { padding: spacing.xxl, gap: spacing.md },
  gridRow: { gap: spacing.md },
  assetCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  assetImageWrap: { position: 'relative' },
  assetImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.skeleton,
  },
  videoBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', fontSize: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  tag: {
    backgroundColor: colors.primarySurface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { ...typography.caption, color: colors.primary, fontSize: 10 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyTitle: { ...typography.heading, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xxl,
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
  modalBody: { gap: spacing.sm },
  modalAssetImage: {
    width: '100%',
    height: 140,
    borderRadius: radii.md,
    backgroundColor: colors.skeleton,
  },
  modalAssetName: { ...typography.subheading, color: colors.textPrimary },
  modalLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase' },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySurface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalChipText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  addTagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  addTagConfirmBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
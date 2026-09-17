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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Search, Plus, X, Info, Video, Tag, ImagePlus } from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { listMediaAssets, uploadMediaAsset } from '../../src/api/media';
import type { MediaAsset } from '../../src/types';

const PRESET_TAGS = ['All', 'Product', 'Brand', 'Team', 'Event', 'Video'];

/* v2 media — Meta Quest Gallery structure (Mobbin ref) on the Dexter
 * dark system: title header, status banner, section header, pure
 * 2-col photo grid, bottom-sheet tag editor. */
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
      mediaTypes: ['images', 'videos'],
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Media Library</Text>
        <Pressable
          style={styles.addBtn}
          onPress={pickAndUpload}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Add media"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon as={Plus} size={22} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* ── Status banner ── */}
      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>
          {assets.length === 0
            ? 'No assets yet — add visuals for Dexter to use'
            : `${assets.length} asset${assets.length === 1 ? '' : 's'} • Dexter picks visuals from here`}
        </Text>
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="About media library"
          onPress={() =>
            Alert.alert(
              'Media Library',
              'Dexter auto-selects visuals from this library when planning posts. Tap an asset to manage its tags.',
            )
          }
        >
          <Icon as={Info} size={20} color={dark.inkSoft} />
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <Icon as={Search} size={16} color={dark.inkFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by filename or tag…"
          placeholderTextColor={dark.inkFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Icon as={X} size={18} color={dark.inkFaint} />
          </Pressable>
        )}
      </View>

      {/* ── Tag filters ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {PRESET_TAGS.map((tag) => {
          const isSelected = activeTag === tag;
          return (
            <Pressable
              key={tag}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setActiveTag(tag)}
            >
              <Text
                style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={dark.accent} style={styles.loading} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <Text style={styles.sectionCount}>
                {filtered.length} item{filtered.length === 1 ? '' : 's'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icon as={ImagePlus} size={30} color={dark.inkFaint} />
              </View>
              <Text style={styles.emptyTitle}>No media found</Text>
              <Text style={styles.emptyText}>
                {search || activeTag !== 'All'
                  ? 'Try adjusting your search or tag filters.'
                  : 'Add images, videos, and brand assets for Dexter to use.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.assetCell} onPress={() => setEditingAsset(item)}>
              <View style={styles.assetImageWrap}>
                <Image source={{ uri: item.url }} style={styles.assetImage} />
                {item.media_type === 'video' && (
                  <View style={styles.videoBadge}>
                    <Icon as={Video} size={11} color="#FFF" />
                  </View>
                )}
                <Pressable style={styles.removeBtn} onPress={() => removeAsset(item.id)}>
                  <Icon as={X} size={13} color="#FFF" />
                </Pressable>
              </View>
              <Text style={styles.assetName} numberOfLines={1}>
                {item.file_name}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* ── Tag editor sheet ── */}
      <Modal visible={!!editingAsset} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asset Tags</Text>
              <Pressable style={styles.closeBtn} onPress={() => setEditingAsset(null)}>
                <Icon as={X} size={18} color={dark.ink} />
              </Pressable>
            </View>

            {editingAsset && (
              <View style={styles.modalBody}>
                <Image source={{ uri: editingAsset.url }} style={styles.modalAssetImage} />
                <Text style={styles.modalAssetName} numberOfLines={1}>
                  {editingAsset.file_name}
                </Text>

                <Text style={styles.modalLabel}>Tags for Dexter</Text>
                <View style={styles.modalChips}>
                  {editingAsset.tags.map((tag) => (
                    <View key={tag} style={styles.modalChip}>
                      <Icon as={Tag} size={12} color={dark.accent} />
                      <Text style={styles.modalChipText}>{tag}</Text>
                      <Pressable onPress={() => handleRemoveTag(tag)} hitSlop={6}>
                        <Icon as={X} size={14} color={dark.inkFaint} />
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.addTagRow}>
                  <TextInput
                    style={styles.addTagInput}
                    placeholder="Add tag (e.g. Product, Event)…"
                    placeholderTextColor={dark.inkFaint}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    onSubmitEditing={handleAddTag}
                  />
                  <Pressable style={styles.addTagBtn} onPress={handleAddTag}>
                    <Icon as={Plus} size={18} color="#FFF" />
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
  safeArea: { flex: 1, backgroundColor: dark.canvas },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 30,
    letterSpacing: -0.8,
    color: dark.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  statusText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: dark.inkSoft,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: dark.surfaceSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: dark.ink,
    fontSize: 14,
    fontFamily: fonts.regular,
  },

  tagsScroll: { height: 52, flexGrow: 0, flexShrink: 0, marginTop: spacing.md },
  tagsContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  filterChipActive: {
    backgroundColor: dark.accent,
    borderColor: dark.accent,
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
  },
  filterChipTextActive: { color: '#FFF', fontFamily: fonts.semibold },

  loading: { marginTop: spacing.xxxl },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 140,
    gap: spacing.md,
  },
  gridRow: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.4,
    color: dark.ink,
  },
  sectionCount: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkFaint,
  },

  assetCell: { flex: 1, gap: spacing.sm },
  assetImageWrap: { position: 'relative' },
  assetImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: dark.inkSoft,
  },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: dark.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
    textAlign: 'center',
    maxWidth: 260,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: dark.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: dark.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: dark.hairline,
    padding: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: dark.hairlineStrong,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 20,
    color: dark.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: dark.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { gap: spacing.sm },
  modalAssetImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: dark.surfaceSunken,
  },
  modalAssetName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  modalLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: dark.inkFaint,
    marginTop: spacing.sm,
  },
  modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dark.surfaceSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 8,
  },
  modalChipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.ink,
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: dark.surfaceSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    color: dark.ink,
    fontSize: 13,
    fontFamily: fonts.regular,
    minHeight: 48,
  },
  addTagBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

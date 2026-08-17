import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAppStore } from '../../src/store/app';
import { listMediaAssets, uploadMediaAsset } from '../../src/api/media';
import type { MediaAsset } from '../../src/types';

export default function MediaLibraryScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await listMediaAssets(business?.id);
        setAssets(list);
      } catch {
        // Keep empty list if the mock source fails.
      } finally {
        setLoading(false);
      }
    })();
  }, [business]);

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add media to your library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    setUploading(true);
    try {
      const newAssets: MediaAsset[] = [];
      for (const asset of result.assets) {
        const created = await uploadMediaAsset({
          business_id: business?.id,
          file_name: asset.fileName ?? 'upload.jpg',
          media_type: 'image',
          url: asset.uri,
          tags: [],
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

  const filtered = filter.trim()
    ? assets.filter(
        (a) =>
          a.file_name.toLowerCase().includes(filter.toLowerCase()) ||
          a.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())),
      )
    : assets;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Media Library</Text>
          <Text style={styles.subtitle}>
            Dexter pulls from here when it picks visuals for your posts.
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={pickAndUpload} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="add" size={24} color={colors.textInverse} />
          )}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or tag…"
          placeholderTextColor={colors.textSecondary}
          value={filter}
          onChangeText={setFilter}
        />
        {filter.length > 0 && (
          <Pressable onPress={() => setFilter('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
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
              <Ionicons name="images-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No media yet</Text>
              <Text style={styles.emptyText}>
                Add images, videos, and brand assets for Dexter to use.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.assetCard}>
              <View style={styles.assetImageWrap}>
                <Image source={{ uri: item.url }} style={styles.assetImage} />
                <Pressable style={styles.removeBtn} onPress={() => removeAsset(item.id)}>
                  <Ionicons name="close" size={14} color={colors.textInverse} />
                </Pressable>
              </View>
              <Text style={styles.assetName} numberOfLines={1}>
                {item.file_name}
              </Text>
              {item.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {item.tags.slice(0, 3).map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}

      <Text style={styles.mockNote}>
        Showing sample media — your uploaded photos appear here, and the backend will later
        auto-select from this library.
      </Text>
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
  headerTitle: { flex: 1 },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
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
    backgroundColor: colors.surfaceAlt,
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { ...typography.caption, color: colors.primaryDark, fontSize: 10 },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxxl },
  emptyTitle: { ...typography.heading, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  mockNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
});
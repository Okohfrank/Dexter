import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { updateScheduledPost } from '../../src/api/publishing';
import type { ScheduledPost, Platform } from '../../src/types';

const PLATFORMS: { value: Platform; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { value: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'musical-notes-outline' },
];

export default function EditPostScreen() {
  const router = useRouter();
  const { post: postParam } = useLocalSearchParams<{ post?: string }>();
  const post: ScheduledPost | undefined = postParam ? JSON.parse(postParam) : undefined;

  const [content, setContent] = useState(post?.content_text ?? '');
  const [platform, setPlatform] = useState<Platform>(post?.platform_post_type as Platform ?? 'linkedin');
  const [date, setDate] = useState<Date>(
    post?.scheduled_for ? new Date(post.scheduled_for) : new Date(Date.now() + 86400000),
  );
  const [saving, setSaving] = useState(false);

  const shiftDate = (hours: number) => {
    setDate((d) => new Date(d.getTime() + hours * 60 * 60 * 1000));
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
      const updated = await updateScheduledPost(post.id, {
        content_text: content.trim(),
        scheduled_for: date.toISOString(),
        platform,
      });
      Alert.alert('Updated', 'Your changes are saved and scheduled.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Edit post</Text>
          </View>

          <Text style={styles.label}>Platform</Text>
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
                    color={selected ? colors.textInverse : colors.textSecondary}
                  />
                  <Text style={[styles.platformChipText, selected && styles.platformChipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Caption</Text>
          <TextInput
            style={styles.input}
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="Write your post…"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>Schedule</Text>
          <View style={styles.timeRow}>
            <Pressable style={styles.stepBtn} onPress={() => shiftDate(-24)}>
              <Ionicons name="remove" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.timeText}>{date.toLocaleString()}</Text>
            <Pressable style={styles.stepBtn} onPress={() => shiftDate(24)}>
              <Ionicons name="add" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
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
            You're editing an existing plan — Dexter will keep the rest of its schedule as-is.
          </Text>

          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.xxl, gap: spacing.md, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
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
  platformChipTextActive: { color: colors.textInverse, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
  quickText: { ...typography.caption, color: colors.primaryDark },
  timeText: { flex: 1, ...typography.body, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  saveText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
});
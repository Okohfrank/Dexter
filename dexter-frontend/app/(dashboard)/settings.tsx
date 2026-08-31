import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import { GlassCard, GlassPill } from '../../src/components/ui';

type SettingRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const business = useAppStore((s) => s.business);
  const autonomousMode = useAppStore((s) => s.autonomousMode);
  const setAutonomousMode = useAppStore((s) => s.setAutonomousMode);

  const handleLogout = () => {
    Alert.alert('Sign out?', 'You will need to log in again to access Dexter.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          useAppStore.getState().reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleToggleAutonomous = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Autonomous Mode?',
        'Dexter will autonomously plan, schedule, and publish content. You can override any time.',
        [
          { text: 'Not yet', style: 'cancel' },
          { text: 'Enable', onPress: () => setAutonomousMode(true) },
        ],
      );
    } else {
      setAutonomousMode(false);
    }
  };

  const settingRows: SettingRow[] = [
    {
      icon: 'hardware-chip-outline',
      label: 'Business Brain',
      subtitle: 'Review or update how Dexter understands your brand',
      onPress: () => router.push('/(onboarding)/brain'),
    },
    {
      icon: 'bar-chart-outline',
      label: 'Content Strategy',
      subtitle: 'Posting frequency, pillars, and scheduling windows',
      onPress: () => router.push('/(onboarding)/strategy'),
    },
    {
      icon: 'link-outline',
      label: 'Connected Accounts',
      subtitle: 'Manage LinkedIn and other platform connections',
      onPress: () => router.push('/(onboarding)'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlassCard style={styles.profileCard} elevated>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name ?? 'Founder'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            {business && (
              <GlassPill label={business.name} variant="primary" />
            )}
          </View>
        </GlassCard>

        {/* Autonomous Mode Toggle */}
        <GlassCard style={styles.autonomyCard} highlighted={autonomousMode}>
          <View style={styles.autonomyRow}>
            <View style={styles.autonomyIconWrap}>
              <Ionicons
                name={autonomousMode ? 'rocket' : 'rocket-outline'}
                size={22}
                color={autonomousMode ? colors.energy : colors.primary}
              />
            </View>
            <View style={styles.autonomyBody}>
              <Text style={styles.autonomyTitle}>Autonomous Mode</Text>
              <Text style={styles.autonomySubtitle}>
                {autonomousMode
                  ? 'Dexter is actively creating and publishing content'
                  : 'Enable to let Dexter operate independently'}
              </Text>
            </View>
            <Switch
              value={autonomousMode}
              onValueChange={handleToggleAutonomous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.border}
            />
          </View>
        </GlassCard>

        {/* Settings List */}
        <Text style={styles.sectionLabel}>Configuration</Text>
        {settingRows.map((row, i) => (
          <Pressable key={i} onPress={row.onPress}>
            <GlassCard style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Ionicons name={row.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>{row.label}</Text>
                {row.subtitle && <Text style={styles.settingSubtitle}>{row.subtitle}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </GlassCard>
          </Pressable>
        ))}

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.negative} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Dexter v1.0.0 • Autonomous Brand Agent</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxxl + 60 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  avatarText: {
    ...typography.heading,
    color: colors.surface,
  },
  profileInfo: { flex: 1, gap: spacing.xs },
  profileName: { ...typography.h2, color: colors.ink },
  profileEmail: { ...typography.caption, color: colors.inkSoft },

  autonomyCard: {},
  autonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autonomyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  autonomyBody: { flex: 1 },
  autonomyTitle: { ...typography.subheading, color: colors.ink, fontWeight: '700' },
  autonomySubtitle: { ...typography.caption2, color: colors.inkSoft, marginTop: 2 },

  sectionLabel: {
    ...typography.label,
    marginTop: spacing.sm,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingBody: { flex: 1 },
  settingLabel: { ...typography.subheading, color: colors.ink, fontWeight: '600' },
  settingSubtitle: { ...typography.caption2, color: colors.inkSoft, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.negativeBorder,
    backgroundColor: colors.negativeSurface,
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.h3,
    color: colors.negative,
  },

  versionText: {
    ...typography.caption2,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});

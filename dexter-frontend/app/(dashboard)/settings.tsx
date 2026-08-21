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
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import { Card, Pill } from '../../src/components/ui';

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
        <Card style={styles.profileCard} elevated>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name ?? 'Founder'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            {business && (
              <Pill label={business.name} variant="primary" />
            )}
          </View>
        </Card>

        {/* Autonomous Mode Toggle */}
        <Card style={styles.autonomyCard} highlighted={autonomousMode}>
          <View style={styles.autonomyRow}>
            <View style={styles.autonomyIconWrap}>
              <Ionicons
                name={autonomousMode ? 'rocket' : 'rocket-outline'}
                size={22}
                color={autonomousMode ? '#FFFFFF' : colors.primary}
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
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Settings List */}
        <Text style={styles.sectionLabel}>Configuration</Text>
        {settingRows.map((row, i) => (
          <Pressable key={i} onPress={row.onPress}>
            <Card style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Ionicons name={row.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.settingBody}>
                <Text style={styles.settingLabel}>{row.label}</Text>
                {row.subtitle && <Text style={styles.settingSubtitle}>{row.subtitle}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
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
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  profileInfo: { flex: 1, gap: spacing.xs },
  profileName: { ...typography.heading, color: colors.textPrimary, fontSize: 18 },
  profileEmail: { ...typography.caption, color: colors.textSecondary },

  autonomyCard: { padding: spacing.lg },
  autonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  autonomyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  autonomyBody: { flex: 1 },
  autonomyTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '700' },
  autonomySubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: spacing.sm,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
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
  settingLabel: { ...typography.subheading, color: colors.textPrimary, fontWeight: '600' },
  settingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

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
    color: colors.negative,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.semibold,
  },

  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

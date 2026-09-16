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
import { colors, spacing, radii, shadows, typography } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';
import { GlassCard } from '../../src/components/ui';

type SettingRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function GroupedNavigationRow({
  row,
  hasDivider = false,
}: {
  row: SettingRow;
  hasDivider?: boolean;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.label}
        onPress={row.onPress}
        style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}
      >
        <Ionicons name={row.icon} size={20} color={colors.inkSoft} />
        <View style={styles.settingBody}>
          <Text style={styles.settingLabel}>{row.label}</Text>
          {row.subtitle && (
            <Text numberOfLines={1} style={styles.settingSubtitle}>
              {row.subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
      </Pressable>
      {hasDivider && <View style={styles.rowDivider} />}
    </>
  );
}

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
      return;
    }
    setAutonomousMode(false);
  };

  const configurationRows: SettingRow[] = [
    {
      icon: 'hardware-chip-outline',
      label: 'Business Brain',
      subtitle: 'How Dexter understands your brand',
      onPress: () => router.push('/(onboarding)/brain'),
    },
    {
      icon: 'bar-chart-outline',
      label: 'Content Strategy',
      subtitle: 'Pillars, cadence, and scheduling windows',
      onPress: () => router.push('/(onboarding)/strategy'),
    },
  ];

  const connectedAccountsRow: SettingRow = {
    icon: 'link-outline',
    label: 'Connected Accounts',
    subtitle: 'Manage LinkedIn and platform connections',
    onPress: () => router.push('/(onboarding)'),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text numberOfLines={1} style={styles.profileName}>
              {user?.full_name ?? 'Founder'}
            </Text>
            <Text numberOfLines={1} style={styles.profileSubtitle}>
              {user?.email ?? business?.name ?? 'Your Dexter workspace'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </GlassCard>

        <SettingsSection label="Configuration">
          {configurationRows.map((row, index) => (
            <GroupedNavigationRow
              key={row.label}
              row={row}
              hasDivider={index < configurationRows.length - 1}
            />
          ))}
        </SettingsSection>

        <SettingsSection label="Automation">
          <View style={styles.autonomyRow}>
            <Ionicons name="rocket-outline" size={20} color={colors.inkSoft} />
            <View style={styles.settingBody}>
              <Text style={styles.settingLabel}>Autonomous Mode</Text>
              <Text numberOfLines={1} style={styles.settingSubtitle}>
                {autonomousMode
                  ? 'Dexter is creating and publishing content'
                  : 'Let Dexter operate independently'}
              </Text>
            </View>
            <Switch
              value={autonomousMode}
              onValueChange={handleToggleAutonomous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>
        </SettingsSection>

        <SettingsSection label="Accounts">
          <GroupedNavigationRow row={connectedAccountsRow} />
        </SettingsSection>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.negative} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.versionText}>Dexter v1.0.0 â€¢ Autonomous Brand Agent</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge + spacing.xxxxl + spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: spacing.huge,
    height: spacing.huge,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.ink },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3, color: colors.ink },
  profileSubtitle: { ...typography.caption, color: colors.inkSoft, marginTop: spacing.xs },

  section: { marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    minHeight: spacing.huge + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.xl,
  },
  settingBody: { flex: 1 },
  settingLabel: { ...typography.h3, color: colors.ink },
  settingSubtitle: { ...typography.caption2, color: colors.inkSoft, marginTop: spacing.xs },
  autonomyRow: {
    minHeight: spacing.huge + spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

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
    marginBottom: spacing.xl,
  },
  logoutText: { ...typography.h3, color: colors.negative },
  versionText: {
    ...typography.caption2,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});

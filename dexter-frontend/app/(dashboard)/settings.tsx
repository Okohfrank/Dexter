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
import {
  Brain,
  BarChart3,
  Link2,
  Zap,
  LogOut,
  Info,
  ChevronRight,
  CircleUserRound,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts, spacing, radii } from '../../src/theme';
import { useAuthStore } from '../../src/api/client';
import { useAppStore } from '../../src/store/app';

/* v2 settings — Claude-style grouped list (Mobbin ref) on the Dexter
 * dark system: email pill, autopilot hero, Account/App row groups. */
type SettingRow = {
  icon: LucideIcon;
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

function GroupedRow({
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
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowIconBox}>
          <Icon as={row.icon} size={22} color={dark.inkSoft} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          {row.subtitle && (
            <Text numberOfLines={1} style={styles.rowSubtitle}>
              {row.subtitle}
            </Text>
          )}
        </View>
        <Icon as={ChevronRight} size={18} color={dark.inkFaint} />
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

  const accountRows: SettingRow[] = [
    {
      icon: Brain,
      label: 'Business Brain',
      subtitle: 'How Dexter understands your brand',
      onPress: () => router.push('/(onboarding)/brain'),
    },
    {
      icon: BarChart3,
      label: 'Content Strategy',
      subtitle: 'Pillars, cadence, and scheduling windows',
      onPress: () => router.push('/(onboarding)/strategy'),
    },
    {
      icon: Link2,
      label: 'Connected Accounts',
      subtitle: 'Manage LinkedIn and platform connections',
      onPress: () => router.push('/(onboarding)'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable
            style={styles.infoBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="About Dexter"
            onPress={() =>
              Alert.alert('Dexter v1.0.0', 'Autonomous Brand Agent')
            }
          >
            <Icon as={Info} size={20} color={dark.ink} />
          </Pressable>
        </View>

        {/* ── Email pill ── */}
        <View style={styles.emailPill}>
          <Text numberOfLines={1} style={styles.emailText}>
            {user?.email ?? business?.name ?? 'Your Dexter workspace'}
          </Text>
        </View>

        {/* ── Autopilot hero ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Put Dexter on autopilot</Text>
          <Text style={styles.heroSubtitle}>
            {autonomousMode
              ? 'Dexter is planning and publishing for you right now.'
              : 'Upgrade to autonomous mode and let Dexter run your LinkedIn.'}
          </Text>
          <Pressable
            style={styles.heroBtn}
            onPress={() => handleToggleAutonomous(!autonomousMode)}
          >
            <Text style={styles.heroBtnText}>
              {autonomousMode ? 'Pause autopilot' : 'Enable autopilot'}
            </Text>
          </Pressable>
        </View>

        {/* ── Account group ── */}
        <SettingsSection label="Account">
          <View style={styles.row}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{user?.full_name ?? 'Founder'}</Text>
              <Text numberOfLines={1} style={styles.rowSubtitle}>
                {business?.name ?? 'Your Dexter workspace'}
              </Text>
            </View>
            <Icon as={CircleUserRound} size={20} color={dark.inkFaint} />
          </View>
          <View style={styles.rowDivider} />
          {accountRows.map((row, index) => (
            <GroupedRow
              key={row.label}
              row={row}
              hasDivider={index < accountRows.length - 1}
            />
          ))}
        </SettingsSection>

        {/* ── App group ── */}
        <SettingsSection label="App">
          <View style={styles.row}>
            <View style={styles.rowIconBox}>
              <Icon as={Zap} size={22} color={dark.inkSoft} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Autonomous Mode</Text>
              <Text numberOfLines={1} style={styles.rowSubtitle}>
                {autonomousMode
                  ? 'Dexter is creating and publishing content'
                  : 'Let Dexter operate independently'}
              </Text>
            </View>
            <Switch
              value={autonomousMode}
              onValueChange={handleToggleAutonomous}
              trackColor={{ false: dark.hairlineStrong, true: dark.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={dark.hairlineStrong}
            />
          </View>
          <View style={styles.rowDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowIconBox}>
              <Icon as={LogOut} size={22} color={dark.negative} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowLabel, { color: dark.negative }]}>
                Sign Out
              </Text>
            </View>
          </Pressable>
        </SettingsSection>

        <Text style={styles.versionText}>Dexter v1.0.0 • Autonomous Brand Agent</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: dark.canvas },
  scroll: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge + spacing.xxxxl + spacing.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerSide: { width: 44 },
  headerTitle: {
    fontFamily: 'InterTight_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.3,
    color: dark.ink,
  },
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emailPill: {
    backgroundColor: dark.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dark.hairline,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emailText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: dark.ink,
  },

  heroCard: {
    backgroundColor: dark.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: dark.hairline,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
    color: dark.ink,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: dark.inkSoft,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  heroBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  section: { marginBottom: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.inkSoft,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  groupCard: {
    backgroundColor: dark.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: dark.hairline,
    overflow: 'hidden',
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  rowPressed: { opacity: 0.7 },
  rowIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: dark.hairline,
    marginLeft: 64,
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: dark.ink,
  },
  rowSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
    marginTop: 2,
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
  },
  avatarText: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 18,
    color: dark.ink,
  },

  versionText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: dark.inkFaint,
    textAlign: 'center',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { createBusiness, listBusinesses } from '../../src/api/business';
import { getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { listConnectedAccounts } from '../../src/api/oauth';
import { useAppStore } from '../../src/store/app';
import { GlassCard, GlassPill } from '../../src/components/ui';
import type { Platform } from '../../src/types';

type PlatformCard = {
  platform: Platform;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  available: boolean;
  blurb: string;
};

const PLATFORMS: PlatformCard[] = [
  {
    platform: 'linkedin',
    title: 'LinkedIn',
    icon: 'logo-linkedin',
    available: true,
    blurb: 'Executive network. Dexter posts thought-leadership and industry frameworks.',
  },
  {
    platform: 'instagram',
    title: 'Instagram',
    icon: 'logo-instagram',
    available: false,
    blurb: 'Visual brand storytelling & carousels. Adapter in progress.',
  },
  {
    platform: 'tiktok',
    title: 'TikTok',
    icon: 'musical-notes-outline',
    available: false,
    blurb: 'Short-form high-velocity video clips. Adapter in progress.',
  },
];

export default function ConnectScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const setConnectedAccounts = useAppStore((s) => s.setConnectedAccounts);

  const [businessName, setBusinessName] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await listBusinesses();
        if (list.length > 0) {
          setBusiness(list[0]);
          const accounts = await listConnectedAccounts(list[0].id);
          setConnectedAccounts(accounts);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    })();
  }, [setBusiness, setConnectedAccounts]);

  const refreshAccounts = async (businessId: string) => {
    const accounts = await listConnectedAccounts(businessId);
    setConnectedAccounts(accounts);
    return accounts;
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      let biz = business;
      if (!biz) {
        const name = businessName.trim();
        if (!name) {
          Alert.alert('Business name', 'Tell us your business name first.');
          return;
        }
        biz = await createBusiness({ name });
        setBusiness(biz);
      }
      const { authorization_url } = await getLinkedInAuthorizationUrl(biz.id);
      await WebBrowser.openBrowserAsync(authorization_url);
      await refreshAccounts(biz.id);
      Alert.alert(
        'LinkedIn',
        connectedAccounts.some((a) => a.platform === 'linkedin')
          ? 'LinkedIn is successfully connected.'
          : 'If you completed sign-in, your account status will refresh here.',
      );
    } catch (e: any) {
      Alert.alert('Connect failed', e.message);
    } finally {
      setConnecting(false);
    }
  };

  const linkedinConnected = connectedAccounts.some((a) => a.platform === 'linkedin');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 1 of 5</Text>
          <Text style={styles.title}>Connect your channels</Text>
          <Text style={styles.subtitle}>
            Dexter operates as your autonomous social employee and requires posting access.
          </Text>
        </View>

        {!business && (
          <View style={styles.field}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Studio"
              placeholderTextColor={colors.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        )}

        <View style={styles.platformList}>
          {PLATFORMS.map((card) => {
            const account = connectedAccounts.find((a) => a.platform === card.platform);
            const isConnected = card.available && !!account;
            const tokenExpired = card.available && account?.token_status === 'expired';

            return (
              <GlassCard
                key={card.platform}
                style={[styles.card, !card.available && styles.cardDisabled]}
                elevated={isConnected}
              >
                <View
                  style={[
                    styles.cardIcon,
                    isConnected && !tokenExpired && styles.cardIconConnected,
                    tokenExpired && styles.cardIconWarning,
                  ]}
                >
                  <Ionicons
                    name={tokenExpired ? 'warning' : isConnected ? 'checkmark-circle' : card.icon}
                    size={22}
                    color={
                      tokenExpired
                        ? colors.negative
                        : isConnected
                        ? colors.positive
                        : colors.primaryLight
                    }
                  />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    {isConnected && (
                      <GlassPill label="CONNECTED" variant="positive" />
                    )}
                  </View>
                  <Text style={styles.cardSubtitle}>{card.blurb}</Text>
                  {tokenExpired && (
                    <Text style={styles.expiredText}>
                      Token expired — reconnect to resume autonomous posting.
                    </Text>
                  )}
                </View>

                {card.available ? (
                  <Pressable
                    style={[
                      styles.connectBtn,
                      isConnected && !tokenExpired && styles.connectedBtn,
                      tokenExpired && styles.reconnectBtn,
                    ]}
                    onPress={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          isConnected && !tokenExpired && styles.connectedBtnText,
                        ]}
                      >
                        {tokenExpired ? 'Reconnect' : isConnected ? 'Active' : 'Connect'}
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <GlassPill label="SOON" variant="default" />
                )}
              </GlassCard>
            );
          })}
        </View>

        {!linkedinConnected && (
          <Text style={styles.hint}>
            You can proceed to configure your Business Brain now and link LinkedIn at any time.
          </Text>
        )}

        <Pressable style={styles.continueBtn} onPress={() => router.push('/(onboarding)/mode')}>
          <Text style={styles.continueText}>Continue to Interview</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs },
  eyebrow: {
    ...typography.caption,
    color: colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  field: { marginTop: spacing.sm },
  label: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.glassSurface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  platformList: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardDisabled: { opacity: 0.5 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.glassSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconConnected: {
    backgroundColor: colors.positiveBg,
    borderColor: colors.positiveBorder,
  },
  cardIconWarning: {
    backgroundColor: colors.negativeBg,
    borderColor: colors.negativeBorder,
  },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '700' },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  expiredText: { ...typography.caption, color: colors.negative, marginTop: 4, fontWeight: '600' },
  connectBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 84,
    alignItems: 'center',
    ...shadows.glow,
  },
  connectedBtn: {
    backgroundColor: colors.glassSurfaceElevated,
    borderWidth: 1,
    borderColor: colors.positiveBorder,
    elevation: 0,
    shadowOpacity: 0,
  },
  connectBtnText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },
  connectedBtnText: { color: colors.positive },
  reconnectBtn: { backgroundColor: colors.negative },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    ...shadows.glow,
  },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: fonts.bold },
});
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
import { colors, spacing, radii, typography, shadows } from '../../src/theme';
import { createBusiness, listBusinesses } from '../../src/api/business';
import { getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { listConnectedAccounts } from '../../src/api/oauth';
import { useAppStore } from '../../src/store/app';
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
    blurb: 'Professional network. Dexter posts thought-leadership content here.',
  },
  {
    platform: 'instagram',
    title: 'Instagram',
    icon: 'logo-instagram',
    available: false,
    blurb: 'Friendly, storytelling content. Coming soon.',
  },
  {
    platform: 'tiktok',
    title: 'TikTok',
    icon: 'musical-notes-outline',
    available: false,
    blurb: 'Short, high-energy clips. Coming soon.',
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
        // Not logged in or no business yet — fine, user will create one below.
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
      // Backend handles the callback + token exchange; reflect new status.
      await refreshAccounts(biz.id);
      Alert.alert(
        'LinkedIn',
        connectedAccounts.some((a) => a.platform === 'linkedin')
          ? 'LinkedIn is connected.'
          : 'If you completed sign-in, your account should appear here.',
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Step 1 of 5</Text>
        <Text style={styles.title}>Connect your accounts</Text>
        <Text style={styles.subtitle}>
          Dexter posts on your behalf, so it needs access to your social accounts.
        </Text>

        {!business && (
          <View style={styles.field}>
            <Text style={styles.label}>Business name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Studio"
              placeholderTextColor={colors.textSecondary}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
        )}

        {PLATFORMS.map((card) => {
          const account = connectedAccounts.find((a) => a.platform === card.platform);
          const isConnected = card.available && !!account;
          const tokenExpired = card.available && account?.token_status === 'expired';
          return (
            <View key={card.platform} style={[styles.card, !card.available && styles.cardDisabled]}>
              <View style={[styles.cardIcon, (isConnected && !tokenExpired) && styles.cardIconConnected, tokenExpired && styles.cardIconWarning]}>
                <Ionicons
                  name={tokenExpired ? 'warning' : isConnected ? 'checkmark-circle' : card.icon}
                  size={22}
                  color={tokenExpired ? colors.negative : isConnected ? colors.positive : colors.primary}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.blurb}</Text>
                {tokenExpired && (
                  <Text style={styles.expiredText}>
                    Connection expired — reconnect to resume posting.
                  </Text>
                )}
              </View>
              {card.available ? (
                <Pressable
                  style={[styles.connectBtn, isConnected && !tokenExpired && styles.connectedBtn, tokenExpired && styles.reconnectBtn]}
                  onPress={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Text style={[styles.connectBtnText, isConnected && !tokenExpired && styles.connectedBtnText, tokenExpired && styles.reconnectBtnText]}>
                      {tokenExpired ? 'Reconnect' : isConnected ? 'Connected' : 'Connect'}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Soon</Text>
                </View>
              )}
            </View>
          );
        })}

        {!linkedinConnected && (
          <Text style={styles.hint}>
            You can continue without connecting — LinkedIn is recommended but not required to try the flow.
          </Text>
        )}

        <Pressable style={styles.continueBtn} onPress={() => router.push('/(onboarding)/mode')}>
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.footerNote}>
          Instagram and TikTok adapters light up automatically once available — no redesign needed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  field: { marginTop: spacing.lg },
  label: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
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
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardDisabled: { opacity: 0.6 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconConnected: { backgroundColor: colors.positiveBg },
  cardIconWarning: { backgroundColor: colors.negativeBg },
  expiredText: { ...typography.caption, color: colors.negative, marginTop: 2 },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.subheading, color: colors.textPrimary },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  connectBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 88,
    alignItems: 'center',
  },
  connectedBtn: { backgroundColor: colors.positiveBg, borderWidth: 1, borderColor: colors.positive },
  connectBtnText: { color: colors.textInverse, ...typography.caption, fontWeight: '700' },
  connectedBtnText: { color: colors.positive },
  reconnectBtn: { backgroundColor: colors.negative, borderWidth: 1, borderColor: colors.negative },
  reconnectBtnText: { color: colors.textInverse },
  soonBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  soonText: { color: colors.textSecondary, ...typography.caption },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  continueText: { color: colors.textInverse, fontSize: 16, fontWeight: '600' },
  footerNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
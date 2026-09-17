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
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Icon } from '../../src/components/rnr/icon';
import { Input } from '../../src/components/rnr/input';
import { dark, fonts, spacing } from '../../src/theme';
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

const PLATFORM_BRAND: Record<Platform, string> = {
  linkedin: '#0A66C2',
  instagram: '#E1306C',
  tiktok: '#000000',
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

/* v2 step 1 — dark connect screen with bottom Back / Continue bar.
 * NOTE: fixed inverted `linkedinConnected` flag (was `!linkedinAccount`,
 * showing "authenticated & ready" when nothing was linked). */
export default function ConnectScreen() {
  const router = useRouter();
  const business = useAppStore((s) => s.business);
  const setBusiness = useAppStore((s) => s.setBusiness);
  const connectedAccounts = useAppStore((s) => s.connectedAccounts);
  const setConnectedAccounts = useAppStore((s) => s.setConnectedAccounts);
  const [businessName, setBusinessName] = useState(business?.name ?? '');
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await listBusinesses();
        if (list.length > 0) {
          setBusiness(list[0]);
          setBusinessName(list[0].name);
          const accounts = await listConnectedAccounts(list[0].id);
          setConnectedAccounts(accounts);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [setBusiness, setConnectedAccounts]);

  const ensureBusiness = async () => {
    if (business) return business;
    const name = businessName.trim() || 'My Company';
    try {
      const biz = await createBusiness({ name });
      setBusiness(biz);
      return biz;
    } catch {
      const fallbackBiz = {
        id: 'biz_onboarding_demo',
        user_id: 'u1',
        name,
        industry: 'B2B SaaS / Growth',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setBusiness(fallbackBiz);
      return fallbackBiz;
    }
  };

  const refreshAccounts = async (businessId: string) => {
    try {
      const accounts = await listConnectedAccounts(businessId);
      setConnectedAccounts(accounts);
      return accounts;
    } catch {
      return connectedAccounts;
    }
  };

  const handleConnectLive = async () => {
    setConnecting(true);
    try {
      const biz = await ensureBusiness();
      const { authorization_url } = await getLinkedInAuthorizationUrl(biz.id);
      await WebBrowser.openBrowserAsync(authorization_url);
      const accs = await refreshAccounts(biz.id);
      const liveAccount = accs.find((a) => a.platform === 'linkedin');
      if (liveAccount) {
        Alert.alert(
          'LinkedIn Connected!',
          `Successfully authenticated as ${liveAccount.display_name || 'LinkedIn User'}. Dexter is now authorized to create and manage posts.`,
        );
      } else {
        Alert.alert(
          'Authorization Note',
          'No LinkedIn profile was authenticated. If you saw an error in the browser (like redirect_uri mismatch), please check your LinkedIn Developer Portal settings.',
        );
      }
    } catch (e: any) {
      Alert.alert('LinkedIn Connection Error', e.message || 'Could not initiate LinkedIn OAuth.');
    } finally {
      setConnecting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  const linkedinAccount = connectedAccounts.find((a) => a.platform === 'linkedin');
  const linkedinConnected = !!linkedinAccount;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Step 1 of 5</Text>
        <Text style={styles.title}>Connect your channels</Text>
        <Text style={styles.subtitle}>
          Dexter operates as your autonomous brand agent and publishes on your behalf.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Company / Brand Name</Text>
          <Input
            placeholder="e.g. Acme SaaS Studio"
            placeholderTextColor={dark.inkFaint}
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.platformList}>
          {loading ? (
            <ActivityIndicator color={dark.accent} style={{ marginVertical: 24 }} />
          ) : (
            PLATFORMS.map((card) => {
              const account = connectedAccounts.find((a) => a.platform === card.platform);
              const isConnected = card.available && !!account;
              const tokenExpired = card.available && account?.token_status === 'expired';
              return (
                <View
                  key={card.platform}
                  style={[styles.card, !card.available && styles.cardDisabled]}
                >
                <View style={styles.cardTopRow}>
                  <View style={styles.brandBox}>
                    {tokenExpired ? (
                      <Icon as={AlertTriangle} size={24} color={dark.warning} />
                    ) : isConnected ? (
                      <Icon as={CheckCircle2} size={24} color={dark.positive} />
                    ) : (
                      <Ionicons
                        name={card.icon}
                        size={26}
                        color={PLATFORM_BRAND[card.platform]}
                      />
                    )}
                  </View>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text
                      style={[
                        styles.cardStatus,
                        isConnected && styles.cardStatusConnected,
                      ]}
                    >
                      {!card.available
                        ? 'Coming soon'
                        : isConnected && account?.display_name
                          ? `Connected as ${account.display_name.split(' ')[0]}`
                          : isConnected
                            ? 'Connected'
                            : 'Available now'}
                    </Text>
                  </View>
                  {card.available ? (
                    <Pressable
                      style={[
                        styles.connectBtn,
                        isConnected && !tokenExpired && styles.connectedBtn,
                        tokenExpired && styles.reconnectBtn,
                      ]}
                      onPress={handleConnectLive}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text
                          style={[
                            styles.connectBtnText,
                            isConnected && !tokenExpired && styles.connectedBtnText,
                          ]}
                        >
                          {tokenExpired ? 'Reconnect' : isConnected ? 'Manage' : 'Connect'}
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonPillText}>SOON</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>{card.blurb}</Text>
                {tokenExpired && (
                  <Text style={styles.expiredText}>
                    Token expired — reconnect to resume autonomous posting.
                  </Text>
                )}
              </View>
              );
            })
          )}
        </View>

        {linkedinConnected ? (
          <View style={styles.successNoteWrap}>
            <Icon as={CheckCircle2} size={16} color={dark.positive} />
            <Text style={styles.successNoteText}>
              LinkedIn channel is authenticated & ready for autonomous posting.
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>
            You can also connect later from Dashboard Settings if you prefer to proceed first.
          </Text>
        )}
      </ScrollView>

      {/* ── Bottom nav: Back / step / Continue (consistent pattern) ── */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={8}>
          <Icon as={ArrowLeft} size={18} color={dark.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.stepText}>1 / 5</Text>
        <Pressable
          style={styles.continueBtn}
          onPress={async () => {
            await ensureBusiness();
            router.push('/(onboarding)/mode');
          }}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Icon as={ArrowRight} size={18} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: dark.canvas },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: spacing.md,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: dark.accent,
  },
  title: {
    fontFamily: 'InterTight_700Bold',
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: dark.ink,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: dark.inkSoft,
  },
  field: { marginTop: spacing.xs },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkSoft,
    marginBottom: 8,
  },
  platformList: { gap: 12, marginTop: spacing.sm },
  card: {
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  cardDisabled: { opacity: 0.55 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitleBlock: { flex: 1, flexShrink: 1, gap: 1 },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: dark.ink,
  },
  cardStatus: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: dark.inkFaint,
  },
  cardStatusConnected: { color: dark.positive },
  soonPill: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  soonPillText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: dark.inkFaint,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: dark.inkSoft,
  },
  expiredText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: dark.warning,
  },
  connectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 40,
    flexShrink: 0,
  },
  connectBtnText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  connectedBtn: {
    backgroundColor: dark.surfaceElevated,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  connectedBtnText: { color: dark.ink },
  reconnectBtn: { backgroundColor: dark.warning },
  successNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: dark.surface,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  successNoteText: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: dark.positive,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: dark.inkFaint,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: dark.hairline,
    backgroundColor: dark.canvas,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  backText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: dark.ink,
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: dark.inkFaint,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dark.accent,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
    minWidth: 150,
  },
  continueText: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});

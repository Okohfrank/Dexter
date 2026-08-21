import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows, fonts } from '../../src/theme';
import { createBusiness, listBusinesses } from '../../src/api/business';
import { getLinkedInAuthorizationUrl } from '../../src/api/auth';
import { listConnectedAccounts, mockConnectAccount } from '../../src/api/oauth';
import { useAppStore } from '../../src/store/app';
import { Card, Pill } from '../../src/components/ui';
import type { Platform } from '../../src/types';

type PlatformCard = { platform: Platform; title: string; icon: keyof typeof Ionicons.glyphMap; available: boolean; blurb: string };

const PLATFORMS: PlatformCard[] = [
  { platform: 'linkedin', title: 'LinkedIn', icon: 'logo-linkedin', available: true, blurb: 'Executive network. Dexter posts thought-leadership and industry frameworks.' },
  { platform: 'instagram', title: 'Instagram', icon: 'logo-instagram', available: false, blurb: 'Visual brand storytelling & carousels. Adapter in progress.' },
  { platform: 'tiktok', title: 'TikTok', icon: 'musical-notes-outline', available: false, blurb: 'Short-form high-velocity video clips. Adapter in progress.' },
];

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
      } catch {} finally { setLoading(false); }
    })();
  }, [setBusiness, setConnectedAccounts]);

  const ensureBusiness = async () => {
    if (business) return business;
    const name = businessName.trim() || 'My Company';
    const biz = await createBusiness({ name });
    setBusiness(biz);
    return biz;
  };

  const refreshAccounts = async (businessId: string) => {
    const accounts = await listConnectedAccounts(businessId);
    setConnectedAccounts(accounts);
    return accounts;
  };

  const handleConnectLive = async () => {
    setConnecting(true);
    try {
      const biz = await ensureBusiness();
      const { authorization_url } = await getLinkedInAuthorizationUrl(biz.id);
      await WebBrowser.openBrowserAsync(authorization_url);
      const accs = await refreshAccounts(biz.id);
      if (accs.some((a) => a.platform === 'linkedin')) {
        Alert.alert('LinkedIn Connected', 'Your LinkedIn profile has been linked to Dexter.');
      } else {
        // Offer instant demo connect if user closed browser
        Alert.alert(
          'Connect LinkedIn Account',
          'Would you like to connect a Demo/Sandbox profile for instant testing?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Connect Demo Profile',
              onPress: handleConnectDemo,
            },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert(
        'OAuth Note',
        'Could not complete live LinkedIn authorization. Would you like to use a Demo/Sandbox account to test all features?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Demo Profile', onPress: handleConnectDemo },
        ],
      );
    } finally { setConnecting(false); }
  };

  const handleConnectDemo = async () => {
    setConnecting(true);
    try {
      const biz = await ensureBusiness();
      const newAcc = await mockConnectAccount(biz.id, 'linkedin');
      setConnectedAccounts([newAcc, ...connectedAccounts.filter((a) => a.platform !== 'linkedin')]);
      Alert.alert('LinkedIn Connected', `Connected as ${newAcc.display_name}. Dexter is ready to draft and schedule posts.`);
    } catch (e: any) {
      Alert.alert('Connection Error', e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    Alert.alert(
      'Connect LinkedIn',
      'Choose how you would like to connect your LinkedIn account to Dexter:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Demo / Sandbox Profile (Instant)', onPress: handleConnectDemo },
        { text: 'Live LinkedIn Account (OAuth)', onPress: handleConnectLive },
      ],
    );
  };

  const linkedinAccount = connectedAccounts.find((a) => a.platform === 'linkedin');
  const linkedinConnected = !!linkedinAccount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Step 1 of 5</Text>
          <Text style={styles.title}>Connect your channels</Text>
          <Text style={styles.subtitle}>Dexter operates as your autonomous brand agent and publishes on your behalf.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Company / Brand Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme SaaS Studio"
            placeholderTextColor={colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.platformList}>
          {PLATFORMS.map((card) => {
            const account = connectedAccounts.find((a) => a.platform === card.platform);
            const isConnected = card.available && !!account;
            const tokenExpired = card.available && account?.token_status === 'expired';
            return (
              <Card key={card.platform} style={[styles.card, !card.available && styles.cardDisabled]} elevated={isConnected}>
                <View style={[styles.cardIcon, isConnected && !tokenExpired && styles.cardIconConnected, tokenExpired && styles.cardIconWarning]}>
                  <Ionicons name={tokenExpired ? 'warning' : isConnected ? 'checkmark-circle' : card.icon} size={22} color={tokenExpired ? colors.negative : isConnected ? colors.positive : colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    {isConnected && <Pill label={account?.display_name ? `CONNECTED: ${account.display_name.split(' ')[0]}` : 'CONNECTED'} variant="positive" />}
                  </View>
                  <Text style={styles.cardSubtitle}>{card.blurb}</Text>
                  {tokenExpired && <Text style={styles.expiredText}>Token expired — reconnect to resume autonomous posting.</Text>}
                </View>
                {card.available ? (
                  <Pressable style={[styles.connectBtn, isConnected && !tokenExpired && styles.connectedBtn, tokenExpired && styles.reconnectBtn]} onPress={handleConnect} disabled={connecting}>
                    {connecting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                      <Text style={[styles.connectBtnText, isConnected && !tokenExpired && styles.connectedBtnText]}>
                        {tokenExpired ? 'Reconnect' : isConnected ? 'Manage' : 'Connect'}
                      </Text>
                    )}
                  </Pressable>
                ) : <Pill label="SOON" variant="default" />}
              </Card>
            );
          })}
        </View>

        {linkedinConnected ? (
          <View style={styles.successNoteWrap}>
            <Ionicons name="shield-checkmark" size={16} color={colors.positive} />
            <Text style={styles.successNoteText}>LinkedIn channel is authenticated & ready for autonomous posting.</Text>
          </View>
        ) : (
          <Text style={styles.hint}>You can also connect later from Dashboard Settings if you prefer to proceed first.</Text>
        )}

        <Pressable
          style={styles.continueBtn}
          onPress={async () => {
            await ensureBusiness();
            router.push('/(onboarding)/mode');
          }}
        >
          <Text style={styles.continueText}>Continue to Interview</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xxl, gap: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { gap: spacing.xs },
  eyebrow: { ...typography.caption, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
  field: { marginTop: spacing.xs },
  label: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  platformList: { gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  cardDisabled: { opacity: 0.5 },
  cardIcon: { width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.primarySurface, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  cardIconConnected: { backgroundColor: colors.positiveSurface, borderColor: colors.positiveBorder },
  cardIconWarning: { backgroundColor: colors.negativeSurface, borderColor: colors.negativeBorder },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.subheading, color: colors.textPrimary, fontWeight: '700' },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  expiredText: { ...typography.caption, color: colors.negative, marginTop: 4, fontWeight: '600' },
  connectBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minWidth: 84, alignItems: 'center', ...shadows.primaryBtn },
  connectedBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.positiveBorder, elevation: 0, shadowOpacity: 0 },
  connectBtnText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },
  connectedBtnText: { color: colors.positive },
  reconnectBtn: { backgroundColor: colors.negative },
  successNoteWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.positiveSurface, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.positiveBorder },
  successNoteText: { ...typography.caption, color: colors.positive, fontWeight: '600', flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 14, marginTop: spacing.md, ...shadows.primaryBtn },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: fonts.bold },
});
import React from 'react';
import { StyleSheet, Platform, Pressable, View, Text, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Keep the pill inset from both screen edges so it never touches the extreme ends.
const NAVBAR_INSET = Math.max(24, (SCREEN_WIDTH - 360) / 2);

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isSpecial?: boolean;
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'ai', title: 'Copilot', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { name: 'create', title: 'Create', icon: 'create-outline', iconActive: 'create-outline', isSpecial: true },
  { name: 'media', title: 'Media', icon: 'images-outline', iconActive: 'images' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.surface,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarButton: tab.isSpecial
              ? (props) => (
                  <Pressable
                    {...props}
                    style={({ pressed }) => [
                      styles.specialTabButton,
                      pressed && styles.specialTabButtonPressed,
                    ]}
                  />
                )
              : undefined,
            tabBarIcon: ({ focused }) => {
              if (tab.isSpecial) {
                return (
                  <View style={styles.specialButtonContainer}>
                    <View style={styles.specialButton}>
                      <Ionicons name={tab.icon} size={23} color={colors.ink} />
                    </View>
                  </View>
                );
              }
              return (
                <View style={[styles.tabContent, focused && styles.tabContentActive]}>
                  <Ionicons
                    name={focused ? tab.iconActive : tab.icon}
                    size={20}
                    color={focused ? colors.ink : colors.surface}
                  />
                  {focused && <Text style={styles.activeTabLabel}>{tab.title}</Text>}
                </View>
              );
            },
          }}
        />
      ))}
      {/* Push screens hidden from tab list */}
      <Tabs.Screen
        name="edit-post"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: NAVBAR_INSET,
    right: NAVBAR_INSET,
    height: 68,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    overflow: 'visible',
    borderWidth: 0,
    ...shadows.lg,
    elevation: 8,
  },
  tabItem: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  tabContent: {
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'transparent',
  },
  tabContentActive: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  activeTabLabel: {
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  specialButtonContainer: {
    width: 56,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -14 }],
  },
  specialTabButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialTabButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  specialButton: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    ...shadows.md,
    elevation: 6,
  },
});

import React from 'react';
import { StyleSheet, Platform, View, Text, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Keep width comfortably inset from both edges (capsule floating dock)
const NAVBAR_INSET = Math.max(28, (SCREEN_WIDTH - 360) / 2);

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  isSpecial?: boolean;
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'ai', title: 'Explore', icon: 'compass-outline', iconActive: 'compass' },
  { name: 'create', title: 'Create', icon: 'swap-horizontal', iconActive: 'swap-horizontal', isSpecial: true },
  { name: 'media', title: 'Analyze', icon: 'analytics-outline', iconActive: 'analytics' },
  { name: 'settings', title: 'Jobs', icon: 'briefcase-outline', iconActive: 'briefcase' },
];

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
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
            tabBarIcon: ({ focused }) => {
              if (tab.isSpecial) {
                return (
                  <View style={styles.specialButtonContainer}>
                    <View style={styles.specialButton}>
                      <Ionicons name="swap-horizontal" size={22} color={colors.surface} />
                    </View>
                  </View>
                );
              }
              return (
                <View style={[styles.tabContent, focused && styles.tabContentActive]}>
                  <Ionicons
                    name={focused ? tab.iconActive : tab.icon}
                    size={21}
                    color={focused ? colors.ink : colors.inkFaint}
                  />
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
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
    overflow: 'visible',
    ...shadows.lg,
    elevation: 12,
  },
  tabItem: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tabContentActive: {
    backgroundColor: colors.surface,
  },
  specialButtonContainer: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.primaryBtn,
  },
});
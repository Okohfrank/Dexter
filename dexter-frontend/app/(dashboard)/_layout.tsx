import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, fonts, shadows } from '../../src/theme';

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'ai', title: 'Dexter AI', icon: 'sparkles-outline', iconActive: 'sparkles' },
  { name: 'create', title: 'Create', icon: 'add-circle-outline', iconActive: 'add-circle' },
  { name: 'media', title: 'Library', icon: 'images-outline', iconActive: 'images' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View style={focused ? styles.activeIconWrap : undefined}>
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={22}
                  color={focused ? colors.primary : colors.textMuted}
                />
              </View>
            ),
          }}
        />
      ))}
      {/* Hide edit-post from tabs — it's a push screen, not a tab */}
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.sm,
    ...shadows.elevated,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    gap: 2,
  },
  activeIconWrap: {
    backgroundColor: colors.primarySurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
});

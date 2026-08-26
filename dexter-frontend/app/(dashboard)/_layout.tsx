import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../src/theme';

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
        tabBarInactiveTintColor: colors.labelTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? colors.primary : colors.labelTertiary}
              />
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
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0.5,
    borderTopColor: colors.separator,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.sm,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
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
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...shadows.lg,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
    ...shadows.primaryBtn,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
});

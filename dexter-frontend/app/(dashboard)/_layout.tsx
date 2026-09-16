import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radii } from '../../src/theme';

type TabDef = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  descriptors: Record<
    string,
    {
      options: {
        tabBarAccessibilityLabel?: string;
        tabBarButtonTestID?: string;
      };
    }
  >;
  navigation: {
    emit: (event: {
      type: 'tabPress' | 'tabLongPress';
      target: string;
      canPreventDefault?: boolean;
    }) => unknown;
    navigate: (name: string, params?: object) => void;
  };
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'create', title: 'Create', icon: 'receipt-outline' },
  { name: 'ai', title: 'Copilot', icon: 'scan-outline' },
  { name: 'media', title: 'Media', icon: 'card-outline' },
  { name: 'settings', title: 'Settings', icon: 'person-outline' },
];

function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Exactly <= 70% of the screen width, clamped on wider displays
  const navBarWidth = Math.min(screenWidth * 0.70, 360);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    TABS.forEach((tab) => {
      if (!state.routes.some((route) => route.name === tab.name)) {
        console.warn(`[DashboardLayout] Missing tab route: ${tab.name}`);
      }
    });
  }, [state.routes]);

  return (
    <View
      style={[
        styles.tabBarWrapper,
        { bottom: Math.max(insets.bottom, 12) + 6 },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.tabBar, { width: navBarWidth }]}>
        {TABS.map((tab) => {
          const route = state.routes.find((candidate) => candidate.name === tab.name);
          const focused = route?.key === state.routes[state.index]?.key;
          const options = route ? descriptors[route.key]?.options : undefined;

          const handlePress = () => {
            if (!route) return;

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            const prevented =
              typeof event === 'object' &&
              event !== null &&
              'defaultPrevented' in event &&
              (event as { defaultPrevented?: boolean }).defaultPrevented;

            if (!focused && !prevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={{ selected: focused, disabled: !route }}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.title}
              testID={options?.tabBarButtonTestID}
              disabled={!route}
              onPress={handlePress}
              onLongPress={() => {
                if (route) {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }
              }}
              style={({ pressed }) => [
                styles.tabButton,
                focused ? styles.tabButtonActive : styles.tabButtonInactive,
                !route && styles.tabButtonDisabled,
                pressed && styles.tabButtonPressed,
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={19}
                color={focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
              />
              {focused && (
                <Text numberOfLines={1} style={styles.activeTabLabel}>
                  {tab.title}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function DashboardLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
      <Tabs.Screen name="edit-post" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  tabBar: {
    maxWidth: '70%',
    height: 58,
    borderRadius: radii.pill,
    backgroundColor: '#121214',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  tabButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tabButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  tabButtonInactive: {
    flex: 1,
    maxWidth: 42,
  },
  tabButtonDisabled: {
    opacity: 0.3,
  },
  tabButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  activeTabLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    fontWeight: '500',
    flexShrink: 0,
  },
});

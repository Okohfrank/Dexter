import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { House, SquarePen, Sparkles, Images, Settings } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/rnr/icon';
import { dark, fonts } from '../../src/theme';

type TabDef = {
  name: string;
  title: string;
  icon: LucideIcon;
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
  { name: 'index', title: 'Home', icon: House },
  { name: 'create', title: 'Create', icon: SquarePen },
  { name: 'ai', title: 'Copilot', icon: Sparkles },
  { name: 'media', title: 'Media', icon: Images },
  { name: 'settings', title: 'Settings', icon: Settings },
];

function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Near full-width floating pill like the reference: 16px margins, capped.
  const navBarWidth = Math.min(screenWidth - 32, 480);

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
              <View style={styles.tabIconWrap}>
                <Icon
                  as={tab.icon}
                  size={22}
                  color={focused ? dark.accent : dark.inkSoft}
                />
              </View>
              <Text
                numberOfLines={1}
                style={focused ? styles.activeTabLabel : styles.inactiveTabLabel}
              >
                {tab.title}
              </Text>
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
    height: 72,
    borderRadius: 999,
    backgroundColor: dark.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  tabButton: {
    flex: 1,
    height: 56,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 999,
  },
  tabIconWrap: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2E2E33',
    borderWidth: 1,
    borderColor: dark.hairlineStrong,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonDisabled: {
    opacity: 0.3,
  },
  tabButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  activeTabLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: dark.accent,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    flexShrink: 0,
    textAlign: 'center',
  },
  inactiveTabLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: dark.inkFaint,
    fontFamily: fonts.medium,
    fontWeight: '500',
    flexShrink: 0,
    textAlign: 'center',
  },
});

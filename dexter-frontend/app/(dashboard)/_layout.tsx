import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, LayoutAnimation, UIManager } from 'react-native';
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

type TabRoute = { key: string; name: string; params?: object };

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
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
  hidden: boolean;
  bottomInset: number;
  barWidth: number;
};

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: House },
  { name: 'create', title: 'Create', icon: SquarePen },
  { name: 'ai', title: 'Copilot', icon: Sparkles },
  { name: 'media', title: 'Media', icon: Images },
  { name: 'settings', title: 'Settings', icon: Settings },
];

// LayoutAnimation is driven off the main thread; required flag on Android.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* Spring capsule resize on tab switch — slightly under-damped so the
 * motion reads clearly, settling without bounce. */
function animateTabSwitch() {
  LayoutAnimation.configureNext({
    duration: 280,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.85,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

function TabButton({
  tab,
  route,
  focused,
  options,
  navigation,
}: {
  tab: TabDef;
  route: TabRoute | undefined;
  focused: boolean;
  options?: {
    tabBarAccessibilityLabel?: string;
    tabBarButtonTestID?: string;
  };
  navigation: FloatingTabBarProps['navigation'];
}) {
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
      animateTabSwitch();
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
      android_ripple={{ color: dark.hairlineStrong, borderless: false }}
      style={[
        styles.tabButton,
        focused ? styles.tabButtonActive : styles.tabButtonInactive,
        !route && styles.tabButtonDisabled,
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
}

/* NOTE: hook-free on purpose. This runs inside the navigator's tabBar
 * render path, where hook state does not survive re-renders reliably
 * (keyboard toggles crashed with "fewer hooks"). All state (insets,
 * width, keyboard visibility) is computed in DashboardLayout and passed
 * as props. Visibility uses display:none — never an early return. */
function FloatingTabBar({ state, descriptors, navigation, hidden, bottomInset, barWidth }: FloatingTabBarProps) {
  return (
    <View
      style={[
        styles.tabBarWrapper,
        { bottom: Math.max(bottomInset, 12) + 6 },
        hidden && styles.tabBarHidden,
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.tabBar, { width: barWidth }]}>
        {TABS.map((tab) => {
          const route = state.routes.find((candidate) => candidate.name === tab.name);
          const focused = route?.key === state.routes[state.index]?.key;
          const options = route ? descriptors[route.key]?.options : undefined;

          return (
            <TabButton
              key={tab.name}
              tab={tab}
              route={route}
              focused={!!focused}
              options={options}
              navigation={navigation}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function DashboardLayout() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          hidden={keyboardVisible}
          bottomInset={insets.bottom}
          barWidth={Math.min(screenWidth - 32, 480)}
        />
      )}
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
  tabBarHidden: {
    display: 'none',
  },
  tabBar: {
    height: 66,
    borderRadius: 999,
    backgroundColor: dark.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: dark.hairline,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    height: 52,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    marginHorizontal: 0,
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
    flexGrow: 1.9,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonDisabled: {
    opacity: 0.3,
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

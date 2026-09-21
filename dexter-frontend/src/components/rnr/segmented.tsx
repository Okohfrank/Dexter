import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { dark, fonts } from '../../theme';

export type SegmentOption = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type Layout = { x: number; width: number };

/* Sliding-pill segmented control. The active capsule is an absolutely
 * positioned indicator driven by measured layouts + spring physics, so
 * it glides between tabs (including rapid successive taps, which
 * retarget mid-flight) instead of snapping. Colors snap — movement
 * carries the transition. */
export function AnimatedSegmented({
  options,
  selected,
  onChange,
}: {
  options: SegmentOption[];
  selected: string;
  onChange: (key: string) => void;
}) {
  const [layouts, setLayouts] = useState<Record<string, Layout>>({});
  const left = useSharedValue(0);
  const width = useSharedValue(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const target = layouts[selected];
    if (!target) return;
    left.value = withSpring(target.x, { stiffness: 320, damping: 30 });
    width.value = withSpring(target.width, { stiffness: 320, damping: 30 });
    setReady(true);
  }, [selected, layouts, left, width]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: left.value,
    width: width.value,
  }));

  const onOptionLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) =>
      prev[key] && prev[key].x === x && prev[key].width === w
        ? prev
        : { ...prev, [key]: { x, width: w } },
    );
  };

  return (
    <View style={styles.track}>
      {ready && <Animated.View style={[styles.indicator, indicatorStyle]} />}
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <Pressable
            key={opt.key}
            style={styles.seg}
            onLayout={onOptionLayout(opt.key)}
            onPress={() => {
              if (opt.key !== selected) onChange(opt.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <View style={styles.segInner}>
              {opt.icon}
              <Text style={[styles.label, active && styles.labelActive]}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: dark.surfaceSunken,
    borderWidth: 1,
    borderColor: dark.hairline,
    borderRadius: 999,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: dark.surfaceElevated,
  },
  seg: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  segInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: dark.inkSoft,
  },
  labelActive: {
    fontFamily: fonts.semibold,
    color: dark.ink,
  },
});

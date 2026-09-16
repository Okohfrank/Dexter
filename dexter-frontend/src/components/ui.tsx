import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
  AccessibilityInfo,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import {
  colors,
  dark,
  spacing,
  radii,
  typography,
  fonts,
  shadows,
  motion,
  colorAccent,
  colorBrand,
  colorEnergy,
  colorInk,
} from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");

/* ── Screen Wrapper (Auth) ───────────────────────────── */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.authBg}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.authScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ── Brand Mark ──────────────────────────────────────── */
export function BrandMark() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoText}>Dexter</Text>
    </View>
  );
}

/* ── Card (§3.2) ─────────────────────────────────────── */
export function GlassCard({
  children,
  style,
  elevated,
  highlighted,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  highlighted?: boolean;
}) {
  return (
    <View
      style={[
        styles.cardOuter,
        elevated && shadows.md,
        highlighted && styles.cardHighlighted,
        style,
      ]}
    >
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

/** Backward-compat alias */
export const Card = GlassCard;

/* ── Hero Card (§3.2) ────────────────────────────────── */
export function HeroCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.heroCardOuter, shadows.md, style]}>
      <View style={styles.heroCardContent}>{children}</View>
    </View>
  );
}

/* ── Bento Card (Variable-size grid card) ────────────── */
export type BentoSize = "1x1" | "2x1" | "1x2" | "2x2" | "full";

export function BentoCard({
  children,
  size = "1x1",
  style,
  accentColor,
}: {
  children: React.ReactNode;
  size?: BentoSize;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}) {
  const bentoStyle = bentoDimensions[size];

  return (
    <View
      style={[
        styles.bentoCardOuter,
        bentoStyle,
        accentColor && { borderColor: accentColor },
        style,
      ]}
    >
      <View style={styles.bentoCardContent}>
        {accentColor && (
          <View
            style={[styles.bentoAccentStrip, { backgroundColor: accentColor }]}
          />
        )}
        {children}
      </View>
    </View>
  );
}

/* ── Status Pill (§3.4) ──────────────────────────────── */
export function GlassPill({
  label,
  icon,
  variant = "default",
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "default" | "positive" | "primary" | "warning" | "negative";
}) {
  const variantStyles = {
    default: { bg: "#F5F5F5", border: colors.border, text: colors.inkSoft },
    positive: { bg: "#F5F5F5", border: "#E0E0E0", text: "#000000" },
    primary: { bg: "#F5F5F5", border: "#DDDDDD", text: "#000000" },
    warning: { bg: "#F5F5F5", border: "#E0E0E0", text: "#000000" },
    negative: { bg: "#F5F5F5", border: "#E0E0E0", text: "#000000" },
  }[variant];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={12} color={variantStyles.text} />}
      <Text style={[styles.pillText, { color: variantStyles.text }]}>
        {label}
      </Text>
    </View>
  );
}

/** Backward-compat alias */
export const Pill = GlassPill;

/* ── Filter Chip (§3.4) ──────────────────────────────── */
export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Segmented Control ───────────────────────────────── */
export function SegmentedControl<T extends string>({
  segments,
  selected,
  onChange,
}: {
  segments: { key: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  selected: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={segStyles.track}>
      {segments.map((seg) => {
        const active = seg.key === selected;
        return (
          <Pressable
            key={seg.key}
            style={[segStyles.segment, active && segStyles.segmentActive]}
            onPress={() => onChange(seg.key)}
          >
            {seg.icon && (
              <Ionicons
                name={seg.icon}
                size={14}
                color={active ? colors.ink : colors.inkSoft}
                style={{ marginRight: 6 }}
              />
            )}
            <Text style={[segStyles.label, active && segStyles.labelActive]}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: "transparent",
  },
  segmentActive: {
    backgroundColor: colors.surface,
    // shadow-sm (ink-tinted) per DESIGN.md §2.5
    shadowColor: "rgba(28,18,16,1)",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: "center",
  },
  labelActive: {
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
});

/* ── Text Input (§3.5) — underline style ──────────────── */
type AuthInputProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
};

export function AuthTextInput({
  label,
  icon,
  secure,
  ...props
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={colors.inkFaint}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {secure && (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={colors.inkFaint}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Date Picker Input (Non-text birth date selector) ── */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function DatePickerField({
  label = "Date of Birth",
  value,
  onChange,
  placeholder = "Select birth date",
}: {
  label?: string;
  value: string;
  onChange: (formattedDate: string) => void;
  placeholder?: string;
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const parseDate = useCallback(() => {
    if (!value) return { day: 15, month: 6, year: 2000 };
    if (value.includes("/")) {
      const parts = value.split("/");
      return {
        day: parseInt(parts[0], 10) || 15,
        month: parseInt(parts[1], 10) || 6,
        year: parseInt(parts[2], 10) || 2000,
      };
    }
    if (value.includes("-")) {
      const parts = value.split("-");
      return {
        day: parseInt(parts[2], 10) || 15,
        month: parseInt(parts[1], 10) || 6,
        year: parseInt(parts[0], 10) || 2000,
      };
    }
    return { day: 15, month: 6, year: 2000 };
  }, [value]);

  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedYear, setSelectedYear] = useState(2000);

  const handleOpen = () => {
    const init = parseDate();
    setSelectedDay(init.day);
    setSelectedMonth(init.month);
    setSelectedYear(init.year);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    const dStr = selectedDay < 10 ? `0${selectedDay}` : `${selectedDay}`;
    const mStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
    onChange(`${dStr}/${mStr}/${selectedYear}`);
    setModalVisible(false);
  };

  const displayDate = value ? (() => {
    if (value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const mIdx = parseInt(parts[1], 10) - 1;
        const mName = MONTH_NAMES[mIdx] || parts[1];
        return `${parts[0]} ${mName} ${parts[2]}`;
      }
    }
    return value;
  })() : "";

  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1930; y--) {
    years.push(y);
  }

  const days: number[] = [];
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate() || 31;
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        style={dateStyles.pickerInput}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? dark.ink : dark.inkFaint}
          style={{ marginRight: 10 }}
        />
        <Text
          style={[
            dateStyles.fieldText,
            !value && dateStyles.placeholderText,
          ]}
        >
          {displayDate || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.inkFaint} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={dateStyles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />
          <View style={dateStyles.modalCard}>
            <View style={dateStyles.modalHeader}>
              <View>
                <Text style={dateStyles.modalTitle}>Date of Birth</Text>
                <Text style={dateStyles.modalSubtitle}>Scroll or tap to select</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={12}
                style={dateStyles.closeButton}
              >
                <Ionicons name="close" size={20} color={dark.ink} />
              </Pressable>
            </View>

            <View style={dateStyles.previewBadge}>
              <Ionicons
                name="calendar"
                size={14}
                color={dark.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={dateStyles.previewText}>
                {selectedDay} {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Text>
            </View>

            <View style={dateStyles.columnsContainer}>
              {/* Day column */}
              <View style={dateStyles.columnWrap}>
                <Text style={dateStyles.columnHeader}>DAY</Text>
                <ScrollView
                  style={dateStyles.columnScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {days.map((d) => {
                    const active = d === selectedDay;
                    return (
                      <Pressable
                        key={`day-${d}`}
                        onPress={() => setSelectedDay(d)}
                        style={[
                          dateStyles.itemButton,
                          active && dateStyles.itemButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            dateStyles.itemText,
                            active && dateStyles.itemTextActive,
                          ]}
                        >
                          {d < 10 ? `0${d}` : d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Month column */}
              <View style={dateStyles.columnWrap}>
                <Text style={dateStyles.columnHeader}>MONTH</Text>
                <ScrollView
                  style={dateStyles.columnScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {MONTH_NAMES.map((m, idx) => {
                    const monthNum = idx + 1;
                    const active = monthNum === selectedMonth;
                    return (
                      <Pressable
                        key={`month-${monthNum}`}
                        onPress={() => setSelectedMonth(monthNum)}
                        style={[
                          dateStyles.itemButton,
                          active && dateStyles.itemButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            dateStyles.itemText,
                            active && dateStyles.itemTextActive,
                          ]}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Year column */}
              <View style={[dateStyles.columnWrap, { flex: 1.2 }]}>
                <Text style={dateStyles.columnHeader}>YEAR</Text>
                <ScrollView
                  style={dateStyles.columnScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((y) => {
                    const active = y === selectedYear;
                    return (
                      <Pressable
                        key={`year-${y}`}
                        onPress={() => setSelectedYear(y)}
                        style={[
                          dateStyles.itemButton,
                          active && dateStyles.itemButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            dateStyles.itemText,
                            active && dateStyles.itemTextActive,
                          ]}
                        >
                          {y}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={dateStyles.modalFooter}>
              <Pressable
                style={dateStyles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={dateStyles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={dateStyles.confirmBtn}
                onPress={handleConfirm}
              >
                <Text style={dateStyles.confirmBtnText}>Confirm Date</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const dateStyles = StyleSheet.create({
  /* Matches the RNR Input pill (v2 §3.5): sunken surface, full radius. */
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: dark.hairline,
    backgroundColor: dark.surfaceSunken,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pickerField: {
    paddingVertical: spacing.md,
    cursor: "pointer" as any,
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: dark.ink,
  },
  placeholderText: {
    color: dark.inkFaint,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: dark.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: dark.hairline,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: dark.ink,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: dark.inkSoft,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    borderRadius: radii.pill,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: dark.surfaceSunken,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  previewText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: dark.ink,
  },
  columnsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    height: 180,
    backgroundColor: dark.surfaceSunken,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  columnWrap: {
    flex: 1,
  },
  columnHeader: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: dark.inkSoft,
    textAlign: "center",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: dark.hairline,
    marginBottom: 4,
  },
  columnScroll: {
    flex: 1,
  },
  itemButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  itemButtonActive: {
    backgroundColor: dark.accent,
  },
  itemText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: dark.inkSoft,
  },
  itemTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
  },
  modalFooter: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: dark.hairline,
  },
  cancelBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: dark.inkSoft,
  },
  confirmBtn: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: dark.accent,
  },
  confirmBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#FFFFFF",
  },
});

/* ── Buttons (§3.1) ──────────────────────────────────── */
const btnStyles = StyleSheet.create({
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 22,
    minHeight: 52,
    width: "100%",
    alignSelf: "stretch",
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    cursor: "pointer" as any,
  },
  primaryText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  energy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorEnergy,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minHeight: 48,
    width: "100%",
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
  energyText: {
    color: "#FFFFFF",
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  outlined: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    width: "100%",
    alignSelf: "stretch",
  },
  outlinedText: {
    color: colorInk,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  ghost: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  ghostText: {
    color: colors.inkSoft,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: "center",
  },
});

export function PrimaryButton({
  title,
  onPress,
  disabled,
  icon,
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        btnStyles.primary,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={17}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={btnStyles.primaryText}>{title}</Text>
    </Pressable>
  );
}

/* Energy (orange) — reserved for "Go live" / autonomous CTAs */
export function EnergyButton({
  title,
  onPress,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        btnStyles.energy,
        pressed && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={17}
          color="#FFFFFF"
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={btnStyles.energyText}>{title}</Text>
    </Pressable>
  );
}

/* Outlined / Secondary (white fill, 1px border) */
export function OutlinedButton({
  title,
  icon,
  onPress,
  style,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        btnStyles.outlined,
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={colorInk}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={btnStyles.outlinedText}>{title}</Text>
    </Pressable>
  );
}

export const SecondaryButton = OutlinedButton;

/* Ghost (tertiary: "Skip", "Cancel") */
export function GhostButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        btnStyles.ghost,
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <Text style={btnStyles.ghostText}>{title}</Text>
    </Pressable>
  );
}

/* ── Divider ─────────────────────────────────────────── */
export function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/* ── Status Dot ──────────────────────────────────────── */
export function StatusDot({
  active,
  color,
}: {
  active?: boolean;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.statusDot,
        { backgroundColor: color ?? (active ? "#000000" : colors.inkFaint) },
      ]}
    />
  );
}

/* ── Pulse Dot (§6) — the signature "AI is working" cue ── */
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export function PulseDot({
  size = 13,
  active = true,
  color = "#000000",
}: {
  size?: number;
  active?: boolean;
  /** Dot + halo color. Legacy default is black; v2 screens pass the indigo accent. */
  color?: string;
}) {
  const [reduced, setReduced] = useState(false);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (mounted) setReduced(r);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (r) => {
        if (mounted) setReduced(r);
      },
    );
    return () => {
      mounted = false;
      cancelAnimation(pulse);
      sub.remove();
    };
  }, [pulse]);

  React.useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: EASE_OUT }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [active, reduced, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + 1.2 * pulse.value }],
  }));

  return (
    <View style={[styles.pulseWrap, { width: size + 10, height: size + 10 }]}>
      {active && !reduced && (
        <Animated.View
          style={[
            styles.pulseHalo,
            {
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: color,
            },
            haloStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.pulseCore,
          {
            width: size,
            height: size,
            borderRadius: size,
            borderWidth: size / 5,
            backgroundColor: active ? color : colors.inkFaint,
            borderColor: colors.surface,
          },
        ]}
      />
    </View>
  );
}

/* ── Avatar (§3.6) ───────────────────────────────────── */
export function Avatar({
  initials,
  size = 44,
  pulsing = false,
}: {
  initials: string;
  size?: number;
  pulsing?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: "#F5F5F5",
          },
        ]}
      >
        <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
          {initials}
        </Text>
      </View>
      {pulsing && (
        <View style={styles.avatarPulseWrap}>
          <PulseDot size={13} active />
        </View>
      )}
    </View>
  );
}

/* ── Bento Dimension Map ─────────────────────────────── */
const BENTO_GAP = spacing.md;
const BENTO_PADDING = spacing.lg;
const BENTO_COL = (SCREEN_W - BENTO_PADDING * 2 - BENTO_GAP) / 2;

const bentoDimensions: Record<BentoSize, ViewStyle> = {
  "1x1": { width: BENTO_COL, height: BENTO_COL },
  "2x1": { width: SCREEN_W - BENTO_PADDING * 2, height: BENTO_COL * 0.55 },
  "1x2": { width: BENTO_COL, height: BENTO_COL * 2 + BENTO_GAP },
  "2x2": {
    width: SCREEN_W - BENTO_PADDING * 2,
    height: BENTO_COL * 2 + BENTO_GAP,
  },
  full: { width: SCREEN_W - BENTO_PADDING * 2 },
};

/* ── Styles ──────────────────────────────────────────── */
const styles = StyleSheet.create({
  flex: { flex: 1 },

  // ── Auth Screen ──
  authBg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 80,
  },

  // ── Brand Mark ──
  logo: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  logoText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: "#000000",
  },

  // ── Card ──
  cardOuter: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  cardContent: {
    padding: spacing.xl,
  },
  cardHighlighted: {
    borderColor: "#000000",
  },

  // ── Hero Card ──
  heroCardOuter: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCardContent: {
    padding: spacing.xxl,
  },

  // ── Bento Card ──
  bentoCardOuter: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.subtle,
  },
  bentoCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  bentoAccentStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },

  // ── Pills / Chips ──
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  filterChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkSoft,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.semibold,
  },

  // ── Segmented Control ── (styles moved to segStyles above component)

  // ── Input ──
  field: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputWrapFocused: {
    borderBottomColor: "#000000",
  },
  input: {
    flex: 1,
    color: "#000000",
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: spacing.md,
  },

  // ── Buttons ──
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: colorAccent,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    alignSelf: "stretch",
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semibold,
    fontSize: 16,
    textAlign: "center",
  },
  energyBtn: {
    flexDirection: "row",
    backgroundColor: colorAccent,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  energyBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  outlinedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#FFFFFF",
    borderRadius: radii.pill,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlinedBtnText: {
    color: "#000000",
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  ghostBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  ghostBtnText: {
    color: colors.inkSoft,
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    color: colors.inkFaint,
    fontSize: 12,
    fontFamily: fonts.medium,
    letterSpacing: 0.3,
  },

  // ── Status Dot ──
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Pulse Dot ──
  pulseWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseCore: {
    position: "absolute",
  },
  pulseHalo: {
    position: "absolute",
  },

  // ── Avatar ──
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarInitial: {
    fontFamily: fonts.semibold,
    color: "#000000",
  },
  avatarPulseWrap: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  label: string;
  tone?: "neutral" | "success" | "warning";
}

export function StatusPill({ label, tone = "neutral" }: Props) {
  return (
    <View style={[styles.pill, toneStyles[tone].pill]}>
      <View style={[styles.dot, toneStyles[tone].dot]} />
      <Text style={[styles.label, toneStyles[tone].label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
  label: { ...typography.caption },
});

const toneStyles = {
  neutral: StyleSheet.create({
    pill: { backgroundColor: colors.surfaceElevated },
    dot: { backgroundColor: colors.textTertiary },
    label: { color: colors.textSecondary },
  }),
  success: StyleSheet.create({
    pill: { backgroundColor: "#0f2b1a" },
    dot: { backgroundColor: colors.success },
    label: { color: colors.success },
  }),
  warning: StyleSheet.create({
    pill: { backgroundColor: "#332108" },
    dot: { backgroundColor: colors.warning },
    label: { color: colors.warning },
  }),
};

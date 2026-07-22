import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  percent: number;
  rangeKm: number;
}

export function BatteryGauge({ percent, rangeKm }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const tone = clamped <= 20 ? colors.danger : clamped <= 40 ? colors.warning : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.percent}>{Math.round(clamped)}%</Text>
        <Text style={styles.range}>{Math.round(rangeKm)} km d'autonomie</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  percent: { color: colors.textPrimary, ...typography.largeTitle },
  range: { color: colors.textSecondary, ...typography.body },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
});

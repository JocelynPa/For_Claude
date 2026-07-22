import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/theme/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export function StatTile({ icon, label, value }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: spacing.xs },
  value: { color: colors.textPrimary, ...typography.headline },
  label: { color: colors.textTertiary, ...typography.micro, textTransform: "uppercase" },
});

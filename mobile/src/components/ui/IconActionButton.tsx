import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  busy?: boolean;
  locked?: boolean;
}

export function IconActionButton({ icon, label, onPress, active, busy, locked }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <Ionicons
            name={icon}
            size={22}
            color={active ? colors.accent : colors.textPrimary}
          />
        )}
        {locked && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={9} color={colors.background} />
          </View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: spacing.sm },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: colors.accentMuted },
  lockBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: colors.textSecondary, ...typography.caption, textAlign: "center" },
});

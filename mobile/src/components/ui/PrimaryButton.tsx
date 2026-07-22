import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  variant = "primary",
  icon,
}: Props) {
  const isDisabled = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.textPrimary} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={variant === "primary" ? "#fff" : colors.textPrimary}
            />
          )}
          <Text style={[styles.label, variant === "ghost" && styles.ghostLabel]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { color: "#fff", ...typography.headline },
  ghostLabel: { color: colors.textSecondary },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceElevated },
  ghost: { backgroundColor: "transparent" },
});

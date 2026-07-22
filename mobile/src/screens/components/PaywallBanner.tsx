import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export function PaywallBanner({ reason }: { reason: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={28} color={colors.accent} />
      </View>
      <Text style={styles.text}>{reason}</Text>
      <Link href="/paywall" asChild>
        <PrimaryButton label="Voir les offres" onPress={() => undefined} />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { textAlign: "center", color: colors.textSecondary, ...typography.body },
});

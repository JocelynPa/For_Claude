import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { logout } from "@/api/auth";
import { useAuth } from "@/auth/AuthContext";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors, spacing, typography } from "@/theme/tokens";

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isPremium } = usePurchases();

  const handleLogout = async () => {
    try {
      await logout();
      await signOut();
    } catch {
      Alert.alert("Erreur", "La déconnexion a échoué.");
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Réglages</Text>

      <Card style={styles.subscriptionCard}>
        <View style={styles.subscriptionRow}>
          <Text style={styles.subscriptionLabel}>Abonnement</Text>
          <StatusPill label={isPremium ? "Premium actif" : "Compte gratuit"} tone={isPremium ? "success" : "neutral"} />
        </View>
        {!isPremium && (
          <PrimaryButton
            label="Voir les offres premium"
            variant="secondary"
            onPress={() => router.push("/paywall")}
          />
        )}
      </Card>

      <Card style={styles.listCard}>
        <Pressable style={styles.row} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.rowLabel, styles.dangerLabel]}>Se déconnecter</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, ...typography.largeTitle },
  subscriptionCard: { gap: spacing.lg },
  subscriptionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subscriptionLabel: { color: colors.textPrimary, ...typography.headline },
  listCard: { padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowLabel: { color: colors.textPrimary, ...typography.body },
  dangerLabel: { color: colors.danger },
});

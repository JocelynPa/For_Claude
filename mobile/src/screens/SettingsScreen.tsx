import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { logout } from "@/api/auth";
import {
  listVehicles,
  setVehicleAlertsEnabled,
  simulateMockVehicleEvent,
} from "@/api/vehicles";
import { useAuth } from "@/auth/AuthContext";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors, spacing, typography } from "@/theme/tokens";

const IS_MOCK_MODE = process.env.EXPO_PUBLIC_MOCK_MODE === "true";

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isPremium } = usePurchases();
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const loadVehicle = useCallback(async () => {
    const vehicles = await listVehicles();
    const first = vehicles[0];
    setVehicleId(first?.id ?? null);
    setAlertsEnabled(first?.alertsEnabled ?? false);
  }, []);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  const handleToggleAlerts = async (next: boolean) => {
    if (!vehicleId) return;

    if (next && !isPremium) {
      router.push("/paywall");
      return;
    }

    setAlertsEnabled(next);
    try {
      await setVehicleAlertsEnabled(vehicleId, next);
    } catch (error: any) {
      setAlertsEnabled(!next);
      if (error?.response?.status === 402) {
        router.push("/paywall");
      } else {
        Alert.alert("Erreur", "Impossible de mettre à jour les alertes.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      await signOut();
    } catch {
      Alert.alert("Erreur", "La déconnexion a échoué.");
    }
  };

  const handleSimulate = async (event: "unlock" | "sentry_on" | "moved") => {
    if (!vehicleId) return;
    try {
      await simulateMockVehicleEvent(vehicleId, event);
      Alert.alert("Simulation envoyée", "Une notification devrait arriver sous peu.");
    } catch {
      Alert.alert("Erreur", "La simulation a échoué.");
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

      <Card style={styles.alertsCard}>
        <View style={styles.alertsRow}>
          <View style={styles.alertsInfo}>
            <View style={styles.alertsTitleRow}>
              <Text style={styles.subscriptionLabel}>Alertes de mouvement</Text>
              {!isPremium && <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />}
            </View>
            <Text style={styles.alertsDescription}>
              Reçois une notification si ton véhicule bouge alors qu'il est garé, si le Mode
              Sentinelle s'active, ou s'il est déverrouillé.
            </Text>
          </View>
          <Switch
            value={alertsEnabled}
            onValueChange={handleToggleAlerts}
            trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {IS_MOCK_MODE && vehicleId && (
        <Card style={styles.debugCard}>
          <Text style={styles.debugTitle}>Mode démo — simuler un événement</Text>
          <View style={styles.debugButtons}>
            <PrimaryButton
              label="Déverrouillage"
              variant="secondary"
              onPress={() => handleSimulate("unlock")}
            />
            <PrimaryButton
              label="Mode Sentinelle"
              variant="secondary"
              onPress={() => handleSimulate("sentry_on")}
            />
            <PrimaryButton
              label="Déplacement"
              variant="secondary"
              onPress={() => handleSimulate("moved")}
            />
          </View>
        </Card>
      )}

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
  alertsCard: {},
  alertsRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  alertsInfo: { flex: 1, gap: spacing.xs },
  alertsTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  alertsDescription: { color: colors.textSecondary, ...typography.caption },
  debugCard: { gap: spacing.md, borderColor: colors.warning, borderStyle: "dashed" },
  debugTitle: { color: colors.warning, ...typography.caption },
  debugButtons: { gap: spacing.sm },
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

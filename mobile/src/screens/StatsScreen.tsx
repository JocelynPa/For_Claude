import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDrivingSessions, listVehicles } from "@/api/vehicles";
import type { DrivingSession } from "@/types/vehicle";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { PaywallBanner } from "@/screens/components/PaywallBanner";
import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { colors, spacing, typography } from "@/theme/tokens";

export function StatsScreen() {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isPremium } = usePurchases();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const vehicles = await listVehicles();
      const vehicle = vehicles[0];
      if (!vehicle) return;
      const to = new Date();
      const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      setSessions(await getDrivingSessions(vehicle.id, from.toISOString(), to.toISOString()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isPremium) {
    return (
      <PaywallBanner reason="Les statistiques de conduite détaillées font partie de l'abonnement premium." />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  const totalKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalKwh = sessions.reduce((sum, s) => sum + s.energyUsedKwh, 0);
  const avgEfficiency = totalKm > 0 ? (totalKwh * 1000) / totalKm : 0;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Statistiques</Text>
      <Text style={styles.subtitle}>30 derniers jours</Text>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Ionicons name="map-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.summaryValue}>{Math.round(totalKm)}</Text>
          <Text style={styles.summaryLabel}>km parcourus</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Ionicons name="flash-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.summaryValue}>{totalKwh.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>kWh utilisés</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Ionicons name="speedometer-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.summaryValue}>{Math.round(avgEfficiency)}</Text>
          <Text style={styles.summaryLabel}>Wh/km</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Trajets</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucun trajet enregistré sur cette période.</Text>
      ) : (
        <Card style={styles.sessionsCard}>
          {sessions.map((session, index) => (
            <View
              key={session.id}
              style={[styles.sessionRow, index === sessions.length - 1 && styles.sessionRowLast]}
            >
              <Text style={styles.sessionDate}>
                {new Date(session.startedAt).toLocaleDateString()}
              </Text>
              <Text style={styles.sessionValue}>{session.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.sessionValueMuted}>
                {session.efficiencyWhPerKm.toFixed(0)} Wh/km
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  title: { color: colors.textPrimary, ...typography.largeTitle },
  subtitle: { color: colors.textSecondary, ...typography.body, marginTop: -spacing.md },
  summaryRow: { flexDirection: "row", gap: spacing.md },
  summaryCard: { flex: 1, alignItems: "center", gap: spacing.xs },
  summaryValue: { color: colors.textPrimary, ...typography.title },
  summaryLabel: { color: colors.textTertiary, ...typography.micro, textAlign: "center" },
  sectionTitle: { color: colors.textPrimary, ...typography.headline },
  emptyText: { color: colors.textSecondary, ...typography.body },
  sessionsCard: { padding: 0 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sessionRowLast: { borderBottomWidth: 0 },
  sessionDate: { color: colors.textSecondary, ...typography.caption },
  sessionValue: { color: colors.textPrimary, ...typography.body },
  sessionValueMuted: { color: colors.textTertiary, ...typography.caption },
});

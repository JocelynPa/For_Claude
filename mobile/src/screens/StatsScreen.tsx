import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { getDrivingSessions, listVehicles } from "@/api/vehicles";
import type { DrivingSession } from "@/types/vehicle";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { PaywallBanner } from "@/screens/components/PaywallBanner";

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
    return <PaywallBanner reason="Les statistiques de conduite détaillées font partie de l'abonnement premium." />;
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalKwh = sessions.reduce((sum, s) => sum + s.energyUsedKwh, 0);
  const avgEfficiency = totalKm > 0 ? (totalKwh * 1000) / totalKm : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Statistiques (30 derniers jours)</Text>
      <View style={styles.summaryRow}>
        <Summary label="Distance" value={`${Math.round(totalKm)} km`} />
        <Summary label="Énergie" value={`${totalKwh.toFixed(1)} kWh`} />
        <Summary label="Efficacité" value={`${Math.round(avgEfficiency)} Wh/km`} />
      </View>

      <Text style={styles.sectionTitle}>Trajets</Text>
      {sessions.map((session) => (
        <View key={session.id} style={styles.sessionRow}>
          <Text style={styles.sessionDate}>
            {new Date(session.startedAt).toLocaleDateString()}
          </Text>
          <Text>{session.distanceKm.toFixed(1)} km</Text>
          <Text>{session.efficiencyWhPerKm.toFixed(0)} Wh/km</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summary: { alignItems: "center" },
  summaryValue: { fontSize: 18, fontWeight: "600" },
  summaryLabel: { color: "#777", fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  sessionDate: { color: "#555" },
});

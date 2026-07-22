import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getVehicleData, listVehicles, sendVehicleCommand } from "@/api/vehicles";
import type { Vehicle, VehicleData, VehicleCommand } from "@/types/vehicle";
import { usePurchases } from "@/purchases/RevenueCatProvider";
import { BatteryGauge } from "@/components/ui/BatteryGauge";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { StatTile } from "@/components/ui/StatTile";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors, spacing, typography } from "@/theme/tokens";

export function VehicleDashboardScreen() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [data, setData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<VehicleCommand | null>(null);
  const { isPremium } = usePurchases();

  const load = useCallback(async () => {
    try {
      const vehicles = await listVehicles();
      const first = vehicles[0] ?? null;
      setVehicle(first);
      if (first) {
        setData(await getVehicleData(first.id));
      }
    } catch {
      Alert.alert("Erreur", "Impossible de récupérer les données du véhicule.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCommand = async (command: VehicleCommand) => {
    if (!vehicle) return;
    if (!isPremium && command !== "flash_lights") {
      Alert.alert("Fonctionnalité premium", "Le contrôle à distance nécessite un abonnement actif.");
      return;
    }
    setPendingCommand(command);
    try {
      await sendVehicleCommand(vehicle.id, command);
      await load();
    } catch {
      Alert.alert("Erreur", "La commande n'a pas pu être envoyée au véhicule.");
    } finally {
      setPendingCommand(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  if (!vehicle || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Aucun véhicule associé à ce compte.</Text>
      </View>
    );
  }

  const isCharging = data.chargingState === "Charging";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl tintColor={colors.textSecondary} refreshing={isLoading} onRefresh={load} />}
    >
      <View style={styles.header}>
        <Text style={styles.vehicleName}>{vehicle.displayName}</Text>
        <StatusPill
          label={vehicle.state === "online" ? "En ligne" : "Hors ligne"}
          tone={vehicle.state === "online" ? "success" : "neutral"}
        />
      </View>

      <Card>
        <BatteryGauge percent={data.batteryLevel} rangeKm={data.batteryRange} />
        {isCharging && (
          <View style={styles.chargingRow}>
            <StatusPill label="En charge" tone="success" />
          </View>
        )}
      </Card>

      <Card style={styles.statsCard}>
        <StatTile icon="speedometer-outline" label="Odomètre" value={`${Math.round(data.odometerKm)} km`} />
        <StatTile
          icon="thermometer-outline"
          label="Intérieur"
          value={data.insideTempC !== null ? `${Math.round(data.insideTempC)}°` : "—"}
        />
        <StatTile
          icon="lock-closed-outline"
          label="Verrouillage"
          value={data.isLocked ? "Verrouillé" : "Ouvert"}
        />
      </Card>

      <View style={styles.actionsGrid}>
        <IconActionButton
          icon={data.isLocked ? "lock-open-outline" : "lock-closed-outline"}
          label={data.isLocked ? "Déverrouiller" : "Verrouiller"}
          active={!data.isLocked}
          busy={pendingCommand === "door_unlock" || pendingCommand === "door_lock"}
          locked={!isPremium}
          onPress={() => runCommand(data.isLocked ? "door_unlock" : "door_lock")}
        />
        <IconActionButton
          icon="snow-outline"
          label="Climatisation"
          active={data.isClimateOn}
          busy={pendingCommand === "climate_on" || pendingCommand === "climate_off"}
          locked={!isPremium}
          onPress={() => runCommand(data.isClimateOn ? "climate_off" : "climate_on")}
        />
        <IconActionButton
          icon="flash-outline"
          label="Charge"
          active={isCharging}
          busy={pendingCommand === "charge_start" || pendingCommand === "charge_stop"}
          locked={!isPremium}
          onPress={() => runCommand(isCharging ? "charge_stop" : "charge_start")}
        />
        <IconActionButton
          icon="sunny-outline"
          label="Phares"
          busy={pendingCommand === "flash_lights"}
          onPress={() => runCommand("flash_lights")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  emptyText: { color: colors.textSecondary, ...typography.body },
  header: { gap: spacing.sm },
  vehicleName: { color: colors.textPrimary, ...typography.title },
  chargingRow: { marginTop: spacing.lg },
  statsCard: { flexDirection: "row" },
  actionsGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
});

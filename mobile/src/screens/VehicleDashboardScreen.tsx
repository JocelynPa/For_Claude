import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getVehicleData, listVehicles, sendVehicleCommand } from "@/api/vehicles";
import type { Vehicle, VehicleData } from "@/types/vehicle";
import { CommandButton } from "@/screens/components/CommandButton";
import { usePurchases } from "@/purchases/RevenueCatProvider";

export function VehicleDashboardScreen() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [data, setData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const { isPremium } = usePurchases();

  const load = useCallback(async () => {
    try {
      const vehicles = await listVehicles();
      const first = vehicles[0] ?? null;
      setVehicle(first);
      if (first) {
        setData(await getVehicleData(first.id));
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer les données du véhicule.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCommand = async (command: Parameters<typeof sendVehicleCommand>[1]) => {
    if (!vehicle) return;
    if (!isPremium && command !== "flash_lights") {
      Alert.alert(
        "Fonctionnalité premium",
        "Le contrôle à distance nécessite un abonnement actif."
      );
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!vehicle || !data) {
    return (
      <View style={styles.center}>
        <Text>Aucun véhicule associé à ce compte.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
    >
      <Text style={styles.title}>{vehicle.displayName}</Text>
      <Text style={styles.state}>{vehicle.state === "online" ? "En ligne" : "Hors ligne"}</Text>

      <View style={styles.statsRow}>
        <Stat label="Batterie" value={`${data.batteryLevel}%`} />
        <Stat label="Autonomie" value={`${Math.round(data.batteryRange)} km`} />
        <Stat label="Odomètre" value={`${Math.round(data.odometerKm)} km`} />
      </View>

      <View style={styles.commands}>
        <CommandButton
          label={data.isLocked ? "Déverrouiller" : "Verrouiller"}
          busy={pendingCommand === "door_unlock" || pendingCommand === "door_lock"}
          onPress={() => runCommand(data.isLocked ? "door_unlock" : "door_lock")}
        />
        <CommandButton
          label={data.isClimateOn ? "Arrêter la climatisation" : "Démarrer la climatisation"}
          busy={pendingCommand === "climate_on" || pendingCommand === "climate_off"}
          onPress={() => runCommand(data.isClimateOn ? "climate_off" : "climate_on")}
        />
        <CommandButton
          label={data.chargingState === "Charging" ? "Arrêter la charge" : "Démarrer la charge"}
          busy={pendingCommand === "charge_start" || pendingCommand === "charge_stop"}
          onPress={() =>
            runCommand(data.chargingState === "Charging" ? "charge_stop" : "charge_start")
          }
        />
        <CommandButton
          label="Faire clignoter les phares"
          busy={pendingCommand === "flash_lights"}
          onPress={() => runCommand("flash_lights")}
        />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700" },
  state: { color: "#777" },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "600" },
  statLabel: { color: "#777", fontSize: 12 },
  commands: { gap: 12 },
});

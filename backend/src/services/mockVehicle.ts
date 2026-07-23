/**
 * Données factices pour valider l'app (design, navigation, flux) sans
 * dépendre de la Tesla Fleet API — utilisé quand MOCK_TESLA_DATA=true.
 */

export const MOCK_VEHICLE_ID = "mock-vehicle-1";

export const mockVehicleList = [
  {
    id: MOCK_VEHICLE_ID,
    vin: "5YJ3E1EA0MOCK0001",
    displayName: "Model 3",
    state: "online" as const,
  },
];

let mockIsLocked = true;
let mockIsClimateOn = false;
let mockChargingState: "Charging" | "Complete" | "Disconnected" | "Stopped" = "Disconnected";

export function getMockVehicleData(vehicleId: string) {
  return {
    vehicleId,
    batteryLevel: 78,
    batteryRange: 312,
    chargingState: mockChargingState,
    chargeLimitSoc: 90,
    insideTempC: 21,
    outsideTempC: 14,
    isClimateOn: mockIsClimateOn,
    isLocked: mockIsLocked,
    latitude: 48.8566,
    longitude: 2.3522,
    odometerKm: 18342,
    updatedAt: new Date().toISOString(),
  };
}

export function applyMockCommand(command: string): void {
  switch (command) {
    case "door_lock":
      mockIsLocked = true;
      break;
    case "door_unlock":
      mockIsLocked = false;
      break;
    case "climate_on":
      mockIsClimateOn = true;
      break;
    case "climate_off":
      mockIsClimateOn = false;
      break;
    case "charge_start":
      mockChargingState = "Charging";
      break;
    case "charge_stop":
      mockChargingState = "Stopped";
      break;
    default:
      break;
  }
}

export function getMockDrivingSessions(fromISO: string, toISO: string) {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  const days = Math.max(1, Math.min(30, Math.round((to - from) / (24 * 60 * 60 * 1000))));

  return Array.from({ length: Math.min(days, 8) }, (_, i) => {
    const startedAt = new Date(to - i * 2 * 24 * 60 * 60 * 1000);
    const endedAt = new Date(startedAt.getTime() + 35 * 60 * 1000);
    const distanceKm = 12 + ((i * 7) % 25);
    const efficiencyWhPerKm = 145 + ((i * 11) % 40);
    const energyUsedKwh = (distanceKm * efficiencyWhPerKm) / 1000;

    return {
      id: `mock-session-${i}`,
      vehicleId: MOCK_VEHICLE_ID,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      distanceKm,
      energyUsedKwh,
      efficiencyWhPerKm,
      averageSpeedKmh: 38,
    };
  });
}

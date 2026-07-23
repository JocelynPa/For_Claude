/**
 * Données factices pour valider l'app (design, navigation, flux, alertes)
 * sans dépendre de la Tesla Fleet API — utilisé quand MOCK_TESLA_DATA=true.
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
let mockSentryMode = false;
let mockShiftState: "P" | "D" | "R" | "N" | null = "P";
let mockLatitude = 48.8566;
let mockLongitude = 2.3522;

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
    latitude: mockLatitude,
    longitude: mockLongitude,
    odometerKm: 18342,
    updatedAt: new Date().toISOString(),
  };
}

/** Reproduit la forme brute de la Fleet API, pour que le poller d'alertes
 * puisse traiter véhicules réels et factices de la même façon. */
export function getMockRawVehicleData(_vehicleId: string) {
  return {
    vehicle_state: { locked: mockIsLocked, sentry_mode: mockSentryMode },
    drive_state: {
      latitude: mockLatitude,
      longitude: mockLongitude,
      shift_state: mockShiftState,
    },
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

/** Déclenché par un endpoint de debug pour tester le pipeline d'alertes de
 * bout en bout sans attendre un vrai changement d'état du véhicule. */
export function simulateMockEvent(event: "unlock" | "sentry_on" | "moved"): void {
  switch (event) {
    case "unlock":
      mockIsLocked = false;
      break;
    case "sentry_on":
      mockSentryMode = true;
      break;
    case "moved":
      // ~150m plein nord, largement au-dessus du seuil de détection (100m).
      mockLatitude += 0.00135;
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

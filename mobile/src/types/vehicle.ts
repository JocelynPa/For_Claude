export interface Vehicle {
  id: string;
  vin: string;
  displayName: string;
  state: "online" | "asleep" | "offline";
}

export interface VehicleData {
  vehicleId: string;
  batteryLevel: number;
  batteryRange: number;
  chargingState: "Charging" | "Complete" | "Disconnected" | "Stopped";
  chargeLimitSoc: number;
  insideTempC: number | null;
  outsideTempC: number | null;
  isClimateOn: boolean;
  isLocked: boolean;
  latitude: number | null;
  longitude: number | null;
  odometerKm: number;
  updatedAt: string;
}

export interface DrivingSession {
  id: string;
  vehicleId: string;
  startedAt: string;
  endedAt: string;
  distanceKm: number;
  energyUsedKwh: number;
  efficiencyWhPerKm: number;
  averageSpeedKmh: number;
}

export type VehicleCommand =
  | "door_lock"
  | "door_unlock"
  | "climate_on"
  | "climate_off"
  | "charge_start"
  | "charge_stop"
  | "flash_lights"
  | "honk_horn";

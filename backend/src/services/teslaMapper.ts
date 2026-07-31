import { buildVehicleImageUrl } from "./teslaVehicleImage.js";

// Shapes returned by Tesla's Fleet API (subset of fields we actually use).
export interface TeslaVehicleListItem {
  id: number;
  vin: string;
  display_name: string;
  state: string; // "online" | "asleep" | "offline"
}

export interface TeslaVehicleData {
  vehicle_state: { locked: boolean; odometer: number; sentry_mode: boolean };
  charge_state: {
    battery_level: number;
    battery_range: number; // miles, regardless of the car's display unit setting
    charge_limit_soc: number;
    charging_state: string; // "Charging" | "Disconnected" | "Complete" | "Stopped" | ...
    charger_power: number;
    time_to_full_charge: number; // hours, fractional
  };
  climate_state: {
    is_climate_on: boolean;
    inside_temp: number | null;
    outside_temp: number | null;
    driver_temp_setting: number;
  };
  vehicle_config: {
    car_type: string;
    exterior_color: string | null;
  };
  option_codes?: string;
}

const CAR_TYPE_LABELS: Record<string, string> = {
  model3: "Model 3",
  modely: "Model Y",
  models: "Model S",
  modelx: "Model X",
  cybertruck: "Cybertruck",
};

const MILES_TO_KM = 1.60934;

/**
 * Maps Tesla's raw Fleet API shapes onto the JSON contract the iOS app's
 * `Vehicle` model expects. `data` is null when `vehicle_data` couldn't be
 * fetched (car asleep and wake-up failed/timed out) — in that case we still
 * return the vehicle with its list-level info and safe defaults, rather than
 * drop it entirely.
 */
export function mapTeslaVehicle(list: TeslaVehicleListItem, data: TeslaVehicleData | null) {
  return {
    // Use the VIN as the app-facing vehicle id, not Tesla's numeric Fleet
    // API id: the Fleet API's own read endpoints (vehicle_data, wake_up)
    // accept either, but tesla-http-proxy's signed command endpoints
    // require the VIN specifically and reject the numeric id outright
    // ("expected 17-character VIN in path"). Using the VIN everywhere the
    // app addresses a vehicle avoids threading two different identifiers
    // through the app for reads vs. commands.
    id: list.vin,
    displayName: list.display_name,
    vin: list.vin,
    model: data ? (CAR_TYPE_LABELS[data.vehicle_config.car_type] ?? data.vehicle_config.car_type) : "Tesla",
    color: data?.vehicle_config.exterior_color ?? "—",
    imageUrl: data ? buildVehicleImageUrl(data.vehicle_config.car_type, data.option_codes) : null,
    state: list.state === "online" ? "online" : list.state === "asleep" ? "asleep" : "offline",
    battery: {
      batteryLevel: data?.charge_state.battery_level ?? 0,
      rangeKm: data ? Math.round(data.charge_state.battery_range * MILES_TO_KM) : 0,
      chargeLimit: data?.charge_state.charge_limit_soc ?? 90,
      isCharging: data?.charge_state.charging_state === "Charging",
      chargePowerKw: data?.charge_state.charger_power ?? 0,
      minutesToFull:
        data && data.charge_state.time_to_full_charge > 0
          ? Math.round(data.charge_state.time_to_full_charge * 60)
          : null,
      pluggedIn: data ? data.charge_state.charging_state !== "Disconnected" : false,
    },
    climate: {
      isOn: data?.climate_state.is_climate_on ?? false,
      insideTempC: data?.climate_state.inside_temp ?? 20,
      outsideTempC: data?.climate_state.outside_temp ?? 20,
      targetTempC: data?.climate_state.driver_temp_setting ?? 21,
      isPreconditioning: false,
    },
    isLocked: data?.vehicle_state.locked ?? true,
    isSentryModeActive: data?.vehicle_state.sentry_mode ?? false,
    odometerKm: data ? Math.round(data.vehicle_state.odometer * MILES_TO_KM) : 0,
  };
}

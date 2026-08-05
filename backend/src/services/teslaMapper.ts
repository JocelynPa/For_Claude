// Shapes returned by Tesla's Fleet API (subset of fields we actually use).
export interface TeslaVehicleListItem {
  id: number;
  vin: string;
  display_name: string;
  state: string; // "online" | "asleep" | "offline"
}

export interface TeslaVehicleData {
  vehicle_state: { sentry_mode: boolean };
}

/**
 * Maps Tesla's raw Fleet API shapes onto the JSON contract the iOS app's
 * `Vehicle` model expects — this app only ever shows Sentry Mode status,
 * not full vehicle control/stats or a rendered image. `data` is null when
 * `vehicle_data` couldn't be fetched (car asleep and wake-up
 * failed/timed out) — in that case we still return the vehicle with its
 * list-level info and safe defaults, rather than drop it entirely.
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
    state: list.state === "online" ? "online" : list.state === "asleep" ? "asleep" : "offline",
    isSentryModeActive: data?.vehicle_state.sentry_mode ?? false,
  };
}

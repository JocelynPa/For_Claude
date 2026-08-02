import { createClient } from "redis";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { signedCommandFetch } from "../services/teslaClient.js";
import { getValidAccessToken } from "../services/tokenStore.js";

// Shapes match the protobuf-JSON encoding fleet-telemetry emits on Redis
// when `transmit_decoded_records: true` (protojson.Marshal on
// telemetry.vehicle_data.Payload / telemetry.vehicle_connectivity.VehicleConnectivity
// — see teslamotors/fleet-telemetry protos/vehicle_data.proto,
// protos/vehicle_connectivity.proto, telemetry/record.go).
interface VehicleDataDatum {
  key: string;
  value?: { sentryModeStateValue?: string };
}

interface VehicleDataRecord {
  data?: VehicleDataDatum[];
  vin: string;
  createdAt: string;
}

// Real Tesla SentryModeState values (protos/vehicle_data.proto). Only Aware
// and Panic are surfaced as an "activity detected" entry; Idle/Armed/Quiet
// just move the enabled/disabled needle, matching what the reference
// screenshot's timeline actually shows.
function activityFor(state: string): { description: string; level: "aware" | "panic" } | null {
  switch (state) {
    case "SentryModeStateAware":
      return { description: "Quelqu'un s'approche du véhicule", level: "aware" };
    case "SentryModeStatePanic":
      return { description: "Alerte de sécurité déclenchée", level: "panic" };
    default:
      return null;
  }
}

function isEnabledState(state: string): boolean {
  return state !== "SentryModeStateOff" && state !== "SentryModeStateUnknown";
}

// Per-VIN last-known state, in memory only — reset on process restart. A
// restart can therefore miss the enabled/disabled transition that happens
// while the ingestor is down, and won't re-emit a stale one on startup
// (we deliberately skip emitting anything the first time a VIN is seen).
const lastSentryState = new Map<string, string>();

const AUTO_ACTION_COMMANDS: Record<string, string> = {
  honk: "honk_horn",
  flash: "flash_lights",
  lock: "door_lock",
};

// This is a single-user, single-vehicle-account app — there's no vin-to-user
// mapping in the schema (TeslaCredential is keyed by userId only), so "the"
// account is just whichever User row exists. Fine here; would need real
// mapping if this ever grew multi-tenant.
async function actOnActivity(vin: string): Promise<void> {
  const user = await prisma.user.findFirst();
  if (!user) return;

  const command = AUTO_ACTION_COMMANDS[user.sentryAutoAction];
  if (!command) return;
  try {
    const token = await getValidAccessToken(user.id);
    await signedCommandFetch(`/vehicles/${vin}/command/${command}`, token, { method: "POST" });
  } catch (error) {
    console.error(`Failed to fire auto-action "${user.sentryAutoAction}" for ${vin}`, error);
  }
}

async function handleVehicleDataMessage(raw: string): Promise<void> {
  const payload = JSON.parse(raw) as VehicleDataRecord;
  const datum = payload.data?.find((entry) => entry.key === "SentryMode");
  const state = datum?.value?.sentryModeStateValue;
  if (!state || !payload.vin) return;

  const previous = lastSentryState.get(payload.vin);
  lastSentryState.set(payload.vin, state);
  if (previous === state) return;

  const activity = activityFor(state);
  if (activity) {
    await prisma.sentryTimelineEntry.create({
      data: {
        vin: payload.vin,
        date: new Date(payload.createdAt),
        kind: "activityDetected",
        activityDescription: activity.description,
        awarenessLevel: activity.level,
      },
    });
    await actOnActivity(payload.vin);
    return;
  }

  if (previous === undefined) return;
  const wasEnabled = isEnabledState(previous);
  const nowEnabled = isEnabledState(state);
  if (wasEnabled === nowEnabled) return;

  await prisma.sentryTimelineEntry.create({
    data: {
      vin: payload.vin,
      date: new Date(payload.createdAt),
      kind: nowEnabled ? "sentryModeEnabled" : "sentryModeDisabled",
    },
  });
}

// Subscribes to the fleet-telemetry Redis dispatcher (see
// deploy/fleet-telemetry-config.json) and turns the raw signal stream into
// SentryTimelineEntry rows. No-ops if REDIS_URL isn't set — the backend
// runs fine without Fleet Telemetry configured, the Sentry timeline is just
// empty until it is (see deploy/README.md).
//
// Connectivity (vehicleOnline/vehicleOffline) records are intentionally not
// ingested: the car reconnects constantly (wifi/cellular handoff, sleep
// cycles) and it flooded the timeline with entries nobody wanted to read.
export async function startTelemetryIngestor(): Promise<void> {
  if (!env.REDIS_URL) {
    console.log("REDIS_URL not set — Fleet Telemetry ingestion disabled (Sentry timeline stays empty).");
    return;
  }

  const client = createClient({ url: env.REDIS_URL });
  client.on("error", (error) => console.error("Redis client error", error));
  await client.connect();

  const vPattern = `${env.FLEET_TELEMETRY_NAMESPACE}_V_*`;

  await client.pSubscribe(vPattern, (message) => {
    handleVehicleDataMessage(message).catch((error) => console.error("Failed to process V record", error));
  });

  console.log(`Fleet Telemetry ingestor listening on "${vPattern}"`);
}

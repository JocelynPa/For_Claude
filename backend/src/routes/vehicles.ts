import type { FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { fleetApiFetch, signedCommandFetch } from "../services/teslaClient.js";
import { getValidAccessToken } from "../services/tokenStore.js";
import { mapTeslaVehicle, type TeslaVehicleData, type TeslaVehicleListItem } from "../services/teslaMapper.js";

// `vehicle_data` fails while the car is asleep. Try once, wake it up on
// failure, then poll for up to ~30s (a single 4s wait wasn't enough in
// practice — real vehicles can take much longer to fully wake and report
// state). Returns null (rather than throwing) if the car still doesn't
// respond — the mapper falls back to a safe default (Sentry off, no image)
// in that case. Every failure is logged since callers only ever see null,
// not why.
async function fetchVehicleDataWithWake(id: string, token: string): Promise<TeslaVehicleData | null> {
  try {
    return await fleetApiFetch<TeslaVehicleData>(`/vehicles/${id}/vehicle_data`, token);
  } catch (initialError) {
    console.error(`vehicle_data failed for ${id}, attempting wake_up`, initialError);
  }

  try {
    await fleetApiFetch(`/vehicles/${id}/wake_up`, token, { method: "POST" });
  } catch (wakeError) {
    console.error(`wake_up failed for ${id}`, wakeError);
    return null;
  }

  const attempts = 6;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      return await fleetApiFetch<TeslaVehicleData>(`/vehicles/${id}/vehicle_data`, token);
    } catch (retryError) {
      if (attempt === attempts) {
        console.error(`vehicle_data still failing for ${id} after wake_up + ${attempts} retries`, retryError);
      }
    }
  }
  return null;
}

export async function vehicleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/vehicles", async (request) => {
    const token = await getValidAccessToken(request.userId!);
    const [list, user] = await Promise.all([
      fleetApiFetch<TeslaVehicleListItem[]>("/vehicles", token),
      prisma.user.findUnique({ where: { id: request.userId! } }),
    ]);
    return Promise.all(
      list.map(async (item) => {
        const data = await fetchVehicleDataWithWake(String(item.id), token);
        return mapTeslaVehicle(item, data, user?.wheelOptionCode);
      })
    );
  });

  // Goes through `signedCommandFetch` (tesla-http-proxy), not
  // `fleetApiFetch` directly — Tesla silently rejects unsigned command
  // requests on any vehicle enforcing the Vehicle Command Protocol. See
  // backend/keys/README.md for how to run the proxy. This is the only
  // vehicle command the app itself still issues directly — honk/flash/lock
  // are fired by the Fleet Telemetry ingestor instead (see
  // src/telemetry/ingestor.ts), not through an HTTP route.
  const setSentryModeBody = z.object({ on: z.boolean() });
  app.post("/vehicles/:id/command/set-sentry-mode", async (request) => {
    const { id } = request.params as { id: string };
    const { on } = setSentryModeBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/set_sentry_mode`, token, {
      method: "POST",
      body: JSON.stringify({ on }),
    });
  });

  // Sentry timeline: populated by the Fleet Telemetry ingestor
  // (src/telemetry/ingestor.js), not polled here — this just reads what's
  // already in Postgres. Empty until a vehicle is subscribed (see below)
  // and Fleet Telemetry is deployed (deploy/README.md).
  app.get("/vehicles/:id/sentry-timeline", async (request) => {
    const { id } = request.params as { id: string };
    const entries = await prisma.sentryTimelineEntry.findMany({
      where: { vin: id },
      orderBy: { date: "desc" },
      take: 200,
    });
    return entries.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString(),
      kind: entry.kind,
      activityDescription: entry.activityDescription,
      awarenessLevel: entry.awarenessLevel,
      // Not derivable from the SentryModeState signal alone — see
      // deploy/README.md for what would be needed to populate this.
      firedActions: [] as { label: string; systemImage: string }[],
      isNew: entry.isNew,
    }));
  });

  app.post("/vehicles/:id/sentry-timeline/mark-seen", async (request) => {
    const { id } = request.params as { id: string };
    await prisma.sentryTimelineEntry.updateMany({ where: { vin: id }, data: { isNew: false } });
    return {};
  });

  app.delete("/vehicles/:id/sentry-timeline/:entryId", async (request) => {
    const { entryId } = request.params as { id: string; entryId: string };
    await prisma.sentryTimelineEntry.deleteMany({ where: { id: entryId } });
    return {};
  });

  // One-time (per vehicle) subscription to Fleet Telemetry: tells the car
  // to stream SentryMode state directly to our fleet-telemetry server.
  // Requires FLEET_TELEMETRY_HOSTNAME to be configured and the server to
  // already be reachable at that hostname with a valid certificate (see
  // deploy/README.md) — Tesla validates this before accepting the
  // subscription. Goes through tesla-http-proxy like commands do, since
  // the config must be signed with the Vehicle Command private key
  // (teslamotors/vehicle-command's proxy handles this at
  // /api/1/vehicles/fleet_telemetry_config).
  //
  // ⚠️ This payload shape (hostname/port/ca/fields/alert_types/exp) is
  // based on third-party documentation and teslamotors/vehicle-command's
  // proxy source, not a first-hand verified call against developer.tesla.com
  // (which wasn't reachable while writing this) — treat it as a strong
  // starting point to test against a real vehicle, not a guarantee.
  const telemetrySubscribeBody = z.object({ intervalSeconds: z.number().min(1).max(3600).default(10) });
  app.post("/vehicles/:id/telemetry/subscribe", async (request, reply) => {
    if (!env.FLEET_TELEMETRY_HOSTNAME) {
      return reply.code(400).send({ error: "FLEET_TELEMETRY_HOSTNAME is not configured" });
    }
    const { id } = request.params as { id: string };
    const { intervalSeconds } = telemetrySubscribeBody.parse(request.body ?? {});
    const token = await getValidAccessToken(request.userId!);
    const ca = env.FLEET_TELEMETRY_CA_FILE ? await readFile(env.FLEET_TELEMETRY_CA_FILE, "utf-8") : undefined;

    return signedCommandFetch("/vehicles/fleet_telemetry_config", token, {
      method: "POST",
      body: JSON.stringify({
        vins: [id],
        config: {
          hostname: env.FLEET_TELEMETRY_HOSTNAME,
          port: env.FLEET_TELEMETRY_PORT,
          ca,
          fields: { SentryMode: { interval_seconds: intervalSeconds } },
          alert_types: ["service"],
          // Tesla caps this at 364 days from its own server clock, not 365 —
          // use 360 to leave margin against clock skew / request latency.
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 360,
        },
      }),
    });
  });

  // Diagnostic: Tesla's own record of whether the vehicle has actually
  // fetched and applied the config from /telemetry/subscribe ("synced":
  // true/false), plus any errors it hit trying to connect. Plain Bearer
  // GETs, no signing needed — unlike the subscribe call above.
  app.get("/vehicles/:id/telemetry/status", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/fleet_telemetry_config`, token);
  });

  app.get("/vehicles/:id/telemetry/errors", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/fleet_telemetry_errors`, token);
  });
}

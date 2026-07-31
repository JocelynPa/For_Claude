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
// failure, wait for it to come online, and retry once more. Returns null
// (rather than throwing) if the car still doesn't respond — the mapper
// falls back to safe defaults for battery/climate in that case.
async function fetchVehicleDataWithWake(id: string, token: string): Promise<TeslaVehicleData | null> {
  try {
    return await fleetApiFetch<TeslaVehicleData>(`/vehicles/${id}/vehicle_data`, token);
  } catch {
    try {
      await fleetApiFetch(`/vehicles/${id}/wake_up`, token, { method: "POST" });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      return await fleetApiFetch<TeslaVehicleData>(`/vehicles/${id}/vehicle_data`, token);
    } catch {
      return null;
    }
  }
}

export async function vehicleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/vehicles", async (request) => {
    const token = await getValidAccessToken(request.userId!);
    const list = await fleetApiFetch<TeslaVehicleListItem[]>("/vehicles", token);
    return Promise.all(
      list.map(async (item) => {
        const data = await fetchVehicleDataWithWake(String(item.id), token);
        return mapTeslaVehicle(item, data);
      })
    );
  });

  // Commands below go through `signedCommandFetch` (tesla-http-proxy), not
  // `fleetApiFetch` directly — Tesla silently rejects unsigned command
  // requests on any vehicle enforcing the Vehicle Command Protocol. See
  // backend/keys/README.md for how to run the proxy.
  const lockBody = z.object({ locked: z.boolean() });
  app.post("/vehicles/:id/command/lock", async (request) => {
    const { id } = request.params as { id: string };
    const { locked } = lockBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/${locked ? "door_lock" : "door_unlock"}`, token, {
      method: "POST",
    });
  });

  const climateBody = z.object({ on: z.boolean(), targetTempC: z.number() });
  app.post("/vehicles/:id/command/climate", async (request) => {
    const { id } = request.params as { id: string };
    const { on, targetTempC } = climateBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    if (on) {
      await signedCommandFetch(`/vehicles/${id}/command/set_temps`, token, {
        method: "POST",
        body: JSON.stringify({ driver_temp: targetTempC, passenger_temp: targetTempC }),
      });
      return signedCommandFetch(`/vehicles/${id}/command/auto_conditioning_start`, token, { method: "POST" });
    }
    return signedCommandFetch(`/vehicles/${id}/command/auto_conditioning_stop`, token, { method: "POST" });
  });

  const chargeLimitBody = z.object({ percent: z.number().min(50).max(100) });
  app.post("/vehicles/:id/command/charge-limit", async (request) => {
    const { id } = request.params as { id: string };
    const { percent } = chargeLimitBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/set_charge_limit`, token, {
      method: "POST",
      body: JSON.stringify({ percent }),
    });
  });

  app.post("/vehicles/:id/command/charge-start", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/charge_start`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/charge-stop", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/charge_stop`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/flash-lights", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/flash_lights`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/honk-horn", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return signedCommandFetch(`/vehicles/${id}/command/honk_horn`, token, { method: "POST" });
  });

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

  // Tesla's Fleet API doesn't expose charging/driving history directly —
  // that would need a background poller snapshotting vehicle_data over
  // time. Left as stubs; the iOS app falls back to mock data for these.
  app.get("/vehicles/:id/charging-sessions", async () => []);
  app.get("/vehicles/:id/driving-sessions", async () => []);
  app.get("/vehicles/:id/summary", async () => ({
    month: new Date().toISOString(),
    distanceKm: 0,
    energyCost: 0,
    co2SavedKg: 0,
    averageEfficiencyWhPerKm: 0,
  }));

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

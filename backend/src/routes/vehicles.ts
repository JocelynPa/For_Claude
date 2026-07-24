import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/authenticate.js";
import { fleetApiFetch, refreshAccessToken } from "../services/teslaClient.js";

async function getValidAccessToken(userId: string): Promise<string> {
  const credential = await prisma.teslaCredential.findUniqueOrThrow({ where: { userId } });
  if (credential.expiresAt.getTime() > Date.now() + 60_000) {
    return credential.accessToken;
  }
  const refreshed = await refreshAccessToken(credential.refreshToken);
  await prisma.teslaCredential.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });
  return refreshed.access_token;
}

export async function vehicleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/vehicles", async (request) => {
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch("/vehicles", token);
  });

  const lockBody = z.object({ locked: z.boolean() });
  app.post("/vehicles/:id/command/lock", async (request) => {
    const { id } = request.params as { id: string };
    const { locked } = lockBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/${locked ? "door_lock" : "door_unlock"}`, token, {
      method: "POST",
    });
  });

  const climateBody = z.object({ on: z.boolean(), targetTempC: z.number() });
  app.post("/vehicles/:id/command/climate", async (request) => {
    const { id } = request.params as { id: string };
    const { on, targetTempC } = climateBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    if (on) {
      await fleetApiFetch(`/vehicles/${id}/command/set_temps`, token, {
        method: "POST",
        body: JSON.stringify({ driver_temp: targetTempC, passenger_temp: targetTempC }),
      });
      return fleetApiFetch(`/vehicles/${id}/command/auto_conditioning_start`, token, { method: "POST" });
    }
    return fleetApiFetch(`/vehicles/${id}/command/auto_conditioning_stop`, token, { method: "POST" });
  });

  const chargeLimitBody = z.object({ percent: z.number().min(50).max(100) });
  app.post("/vehicles/:id/command/charge-limit", async (request) => {
    const { id } = request.params as { id: string };
    const { percent } = chargeLimitBody.parse(request.body);
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/set_charge_limit`, token, {
      method: "POST",
      body: JSON.stringify({ percent }),
    });
  });

  app.post("/vehicles/:id/command/charge-start", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/charge_start`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/charge-stop", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/charge_stop`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/flash-lights", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/flash_lights`, token, { method: "POST" });
  });

  app.post("/vehicles/:id/command/honk-horn", async (request) => {
    const { id } = request.params as { id: string };
    const token = await getValidAccessToken(request.userId!);
    return fleetApiFetch(`/vehicles/${id}/command/honk_horn`, token, { method: "POST" });
  });

  // Tesla's Fleet API doesn't expose charging/driving history or Sentry clip
  // metadata directly — that normally comes from a background poller that
  // periodically snapshots vehicle_data and stores it. Left as stubs until
  // that poller exists; the iOS app already falls back to mock data for
  // these when a real vehicle has no history yet.
  app.get("/vehicles/:id/charging-sessions", async () => []);
  app.get("/vehicles/:id/driving-sessions", async () => []);
  app.get("/vehicles/:id/summary", async () => ({
    month: new Date().toISOString(),
    distanceKm: 0,
    energyCost: 0,
    co2SavedKg: 0,
    averageEfficiencyWhPerKm: 0,
  }));
}

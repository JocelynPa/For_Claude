import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { authenticate } from "../middleware/authenticate";
import {
  getTeslaVehicleData,
  listTeslaVehicles,
  sendTeslaCommand,
  setTeslaChargeLimit,
} from "../services/teslaClient";
import {
  applyMockCommand,
  getMockDrivingSessions,
  getMockVehicleData,
  mockVehicleList,
  simulateMockEvent,
} from "../services/mockVehicle";
import { pollVehicleNow } from "../services/alertPoller";

const commandBodySchema = z.object({
  command: z.enum([
    "door_lock",
    "door_unlock",
    "climate_on",
    "climate_off",
    "charge_start",
    "charge_stop",
    "flash_lights",
    "honk_horn",
  ]),
});

const chargeLimitBodySchema = z.object({
  percent: z.number().min(50).max(100),
});

export async function vehicleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/vehicles", async (request) => {
    const userId = request.userId!;

    if (env.MOCK_TESLA_DATA) {
      const mock = mockVehicleList[0];
      const stored = await prisma.vehicle.upsert({
        where: { teslaId: mock.id },
        create: { userId, teslaId: mock.id, vin: mock.vin, displayName: mock.displayName },
        update: { displayName: mock.displayName },
      });
      return [{ ...mock, alertsEnabled: stored.alertsEnabled }];
    }

    const teslaVehicles = await listTeslaVehicles(userId);

    return Promise.all(
      teslaVehicles.map(async (v: any) => {
        const stored = await prisma.vehicle.upsert({
          where: { teslaId: String(v.id) },
          create: {
            userId,
            teslaId: String(v.id),
            vin: v.vin,
            displayName: v.display_name,
          },
          update: { displayName: v.display_name },
        });

        return {
          id: String(v.id),
          alertsEnabled: stored.alertsEnabled,
          vin: v.vin,
          displayName: v.display_name,
          state: v.state,
        };
      })
    );
  });

  app.get<{ Params: { id: string } }>("/vehicles/:id/data", async (request) => {
    if (env.MOCK_TESLA_DATA) return getMockVehicleData(request.params.id);

    const data = await getTeslaVehicleData(request.userId!, request.params.id);

    return {
      vehicleId: request.params.id,
      batteryLevel: data.charge_state.battery_level,
      batteryRange: data.charge_state.battery_range,
      chargingState: data.charge_state.charging_state,
      chargeLimitSoc: data.charge_state.charge_limit_soc,
      insideTempC: data.climate_state.inside_temp,
      outsideTempC: data.climate_state.outside_temp,
      isClimateOn: data.climate_state.is_climate_on,
      isLocked: data.vehicle_state.locked,
      latitude: data.drive_state?.latitude ?? null,
      longitude: data.drive_state?.longitude ?? null,
      odometerKm: data.vehicle_state.odometer * 1.60934,
      updatedAt: new Date().toISOString(),
    };
  });

  app.post<{ Params: { id: string } }>("/vehicles/:id/command", async (request, reply) => {
    const { command } = commandBodySchema.parse(request.body);

    if (env.MOCK_TESLA_DATA) {
      applyMockCommand(command);
      return reply.send({ ok: true });
    }

    await sendTeslaCommand(request.userId!, request.params.id, command);
    reply.send({ ok: true });
  });

  app.post<{ Params: { id: string } }>("/vehicles/:id/charge-limit", async (request, reply) => {
    const { percent } = chargeLimitBodySchema.parse(request.body);

    if (env.MOCK_TESLA_DATA) return reply.send({ ok: true });

    await setTeslaChargeLimit(request.userId!, request.params.id, percent);
    reply.send({ ok: true });
  });

  app.post<{ Params: { id: string }; Body: { enabled: boolean } }>(
    "/vehicles/:id/alerts",
    async (request, reply) => {
      const { enabled } = z.object({ enabled: z.boolean() }).parse(request.body);

      const vehicle = await prisma.vehicle.findUnique({ where: { teslaId: request.params.id } });
      if (!vehicle || vehicle.userId !== request.userId) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      if (enabled) {
        const subscription = await prisma.subscription.findUnique({
          where: { userId: request.userId! },
        });
        if (!subscription?.isActive) {
          return reply.code(402).send({ error: "premium_required" });
        }
      }

      await prisma.vehicle.update({ where: { id: vehicle.id }, data: { alertsEnabled: enabled } });
      reply.send({ ok: true, alertsEnabled: enabled });
    }
  );

  // Simule un événement véhicule pour tester le pipeline d'alertes de bout en
  // bout sans attendre un vrai changement d'état — n'existe qu'en mode démo.
  app.post<{ Params: { id: string }; Body: { event: "unlock" | "sentry_on" | "moved" } }>(
    "/vehicles/:id/mock/simulate",
    async (request, reply) => {
      if (!env.MOCK_TESLA_DATA) {
        return reply.code(404).send({ error: "not_found" });
      }

      const { event } = z
        .object({ event: z.enum(["unlock", "sentry_on", "moved"]) })
        .parse(request.body);

      const vehicle = await prisma.vehicle.findUnique({ where: { teslaId: request.params.id } });
      if (!vehicle || vehicle.userId !== request.userId) {
        return reply.code(404).send({ error: "vehicle_not_found" });
      }

      simulateMockEvent(event);
      await pollVehicleNow(vehicle.id, request.log);
      reply.send({ ok: true });
    }
  );

  app.get<{ Params: { id: string }; Querystring: { from: string; to: string } }>(
    "/vehicles/:id/driving-sessions",
    async (request) => {
      if (env.MOCK_TESLA_DATA) {
        return getMockDrivingSessions(request.query.from, request.query.to);
      }

      const vehicle = await prisma.vehicle.findUnique({ where: { teslaId: request.params.id } });
      if (!vehicle) return [];

      return prisma.drivingSession.findMany({
        where: {
          vehicleId: vehicle.id,
          startedAt: { gte: new Date(request.query.from), lte: new Date(request.query.to) },
        },
        orderBy: { startedAt: "desc" },
      });
    }
  );
}

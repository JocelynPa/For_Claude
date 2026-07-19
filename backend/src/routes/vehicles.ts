import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { authenticate } from "../middleware/authenticate";
import {
  getTeslaVehicleData,
  listTeslaVehicles,
  sendTeslaCommand,
  setTeslaChargeLimit,
} from "../services/teslaClient";

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
    const teslaVehicles = await listTeslaVehicles(userId);

    return Promise.all(
      teslaVehicles.map(async (v: any) => {
        await prisma.vehicle.upsert({
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
          vin: v.vin,
          displayName: v.display_name,
          state: v.state,
        };
      })
    );
  });

  app.get<{ Params: { id: string } }>("/vehicles/:id/data", async (request) => {
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
    await sendTeslaCommand(request.userId!, request.params.id, command);
    reply.send({ ok: true });
  });

  app.post<{ Params: { id: string } }>("/vehicles/:id/charge-limit", async (request, reply) => {
    const { percent } = chargeLimitBodySchema.parse(request.body);
    await setTeslaChargeLimit(request.userId!, request.params.id, percent);
    reply.send({ ok: true });
  });

  app.get<{ Params: { id: string }; Querystring: { from: string; to: string } }>(
    "/vehicles/:id/driving-sessions",
    async (request) => {
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

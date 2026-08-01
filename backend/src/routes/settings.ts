import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const SENTRY_AUTO_ACTIONS = ["none", "honk", "flash", "lock"] as const;

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/settings", async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId! } });
    return { sentryAutoAction: user.sentryAutoAction, wheelOptionCode: user.wheelOptionCode };
  });

  // Both fields optional so either can be updated independently — the app
  // currently only ever sends one at a time.
  const updateSettingsBody = z.object({
    sentryAutoAction: z.enum(SENTRY_AUTO_ACTIONS).optional(),
    // Tesla option code for the vehicle image's wheels (e.g. "WY20P") —
    // null clears it back to the compositor's default. See
    // backend/src/services/teslaVehicleImage.ts.
    wheelOptionCode: z.string().nullable().optional(),
  });
  app.patch("/settings", async (request) => {
    const body = updateSettingsBody.parse(request.body);
    const user = await prisma.user.update({
      where: { id: request.userId! },
      data: body,
    });
    return { sentryAutoAction: user.sentryAutoAction, wheelOptionCode: user.wheelOptionCode };
  });
}

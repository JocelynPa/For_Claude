import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const SENTRY_AUTO_ACTIONS = ["none", "honk", "flash", "lock"] as const;

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/settings", async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId! } });
    return { sentryAutoAction: user.sentryAutoAction };
  });

  const updateSettingsBody = z.object({ sentryAutoAction: z.enum(SENTRY_AUTO_ACTIONS) });
  app.patch("/settings", async (request) => {
    const { sentryAutoAction } = updateSettingsBody.parse(request.body);
    const user = await prisma.user.update({
      where: { id: request.userId! },
      data: { sentryAutoAction },
    });
    return { sentryAutoAction: user.sentryAutoAction };
  });

  // Registered by the app once the user grants notification permission
  // (see PushNotificationManager). Re-sent on every launch since APNs
  // tokens can rotate; a plain upsert-by-write is simplest here.
  const deviceTokenBody = z.object({ token: z.string().min(1) });
  app.post("/settings/device-token", async (request) => {
    const { token } = deviceTokenBody.parse(request.body);
    await prisma.user.update({ where: { id: request.userId! }, data: { pushToken: token } });
    return {};
  });
}

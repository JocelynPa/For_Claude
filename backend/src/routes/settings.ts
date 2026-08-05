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

  const updateSettingsBody = z.object({
    sentryAutoAction: z.enum(SENTRY_AUTO_ACTIONS).optional(),
  });
  app.patch("/settings", async (request) => {
    const body = updateSettingsBody.parse(request.body);
    const user = await prisma.user.update({
      where: { id: request.userId! },
      data: body,
    });
    return { sentryAutoAction: user.sentryAutoAction };
  });
}

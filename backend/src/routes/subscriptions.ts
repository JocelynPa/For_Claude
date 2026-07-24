import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";

interface RevenueCatWebhookPayload {
  event?: {
    app_user_id?: string;
    type?: string;
  };
}

export async function subscriptionRoutes(app: FastifyInstance) {
  app.post("/webhooks/revenuecat", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (env.REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`) {
      return reply.code(401).send({ error: "Invalid webhook secret" });
    }

    const payload = request.body as RevenueCatWebhookPayload;
    const userId = payload.event?.app_user_id;
    const type = payload.event?.type;
    if (!userId || !type) {
      return reply.code(400).send({ error: "Malformed RevenueCat payload" });
    }

    const isActive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION"].includes(type);
    const isCancelled = ["CANCELLATION", "EXPIRATION"].includes(type);

    if (isActive || isCancelled) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { subscriptionStatus: isActive ? "premium" : "free" },
      });
    }

    return reply.code(200).send({ received: true });
  });
}

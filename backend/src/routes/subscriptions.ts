import type { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { applyRevenueCatEvent } from "../services/revenuecat";

export async function subscriptionRoutes(app: FastifyInstance) {
  app.post("/webhooks/revenuecat", async (request, reply) => {
    const auth = request.headers.authorization;
    if (auth !== `Bearer ${env.REVENUECAT_WEBHOOK_AUTH_HEADER}`) {
      return reply.code(401).send({ error: "invalid_webhook_secret" });
    }

    await applyRevenueCatEvent(request.body as any);
    reply.send({ ok: true });
  });
}

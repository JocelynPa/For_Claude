import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate";
import { registerPushToken } from "../services/pushNotifications";

const registerTokenSchema = z.object({
  token: z.string(),
});

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.post("/notifications/register-token", async (request, reply) => {
    const { token } = registerTokenSchema.parse(request.body);

    try {
      await registerPushToken(request.userId!, token);
    } catch {
      return reply.code(400).send({ error: "invalid_token" });
    }

    reply.send({ ok: true });
  });
}

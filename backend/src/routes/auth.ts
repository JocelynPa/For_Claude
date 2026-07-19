import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { exchangeTeslaCode } from "../services/teslaClient";
import { authenticate, issueSessionToken } from "../middleware/authenticate";

const exchangeBodySchema = z.object({
  code: z.string(),
  redirectUri: z.string().url(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/tesla/exchange", async (request, reply) => {
    const { code, redirectUri } = exchangeBodySchema.parse(request.body);

    const { accessToken, refreshToken, expiresIn } = await exchangeTeslaCode(code, redirectUri);

    // Note : la Fleet API ne renvoie pas d'identité stable pour l'utilisateur
    // dans le token OAuth ; on identifie l'utilisateur via la première liste
    // de véhicules et son VIN, ou via le champ `sub` du id_token si scope
    // `openid` est demandé. Ici on illustre le cas le plus simple : un
    // utilisateur par credential Tesla.
    const existing = await prisma.teslaCredential.findFirst({
      where: { refreshToken },
      include: { user: true },
    });

    const user =
      existing?.user ??
      (await prisma.user.create({
        data: {
          teslaCredential: {
            create: {
              accessToken,
              refreshToken,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
            },
          },
        },
      }));

    if (existing) {
      await prisma.teslaCredential.update({
        where: { userId: user.id },
        data: { accessToken, refreshToken, expiresAt: new Date(Date.now() + expiresIn * 1000) },
      });
    }

    reply.send({ sessionToken: issueSessionToken(user.id), userId: user.id });
  });

  app.post("/auth/logout", { preHandler: authenticate }, async (_request, reply) => {
    reply.send({ ok: true });
  });
}

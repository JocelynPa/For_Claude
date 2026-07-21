import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { exchangeTeslaCode } from "../services/teslaClient";
import { authenticate, issueSessionToken } from "../middleware/authenticate";

const exchangeBodySchema = z.object({
  code: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // GET callback that Tesla redirects to. In most cases expo-web-browser
  // intercepts this navigation client-side before it reaches the server
  // (see mobile/src/screens/LoginScreen.tsx), but this page is served as a
  // fallback for platforms/configurations where it doesn't.
  app.get("/auth/tesla/callback", async (_request, reply) => {
    reply.type("text/html").send(
      "<html><body><p>Connexion Tesla terminée, tu peux revenir à l'application.</p></body></html>"
    );
  });

  app.post("/auth/tesla/exchange", async (request, reply) => {
    const { code } = exchangeBodySchema.parse(request.body);

    // Le redirect_uri utilisé ici doit être identique, au caractère près, à
    // celui envoyé lors de l'étape d'autorisation et à celui enregistré dans
    // le Tesla Developer Portal — on utilise donc la valeur configurée côté
    // serveur (source unique de vérité) plutôt qu'une valeur fournie par le
    // client, ce qui évite aussi qu'un client malveillant en fournisse une
    // autre.
    const { accessToken, refreshToken, expiresIn } = await exchangeTeslaCode(
      code,
      env.TESLA_REDIRECT_URI
    );

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

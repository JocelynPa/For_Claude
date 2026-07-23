import type { FastifyInstance } from "fastify";
import { isAxiosError } from "axios";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { exchangeTeslaCode } from "../services/teslaClient";
import { authenticate, issueSessionToken } from "../middleware/authenticate";
import { consumeAuthSession, failAuthSession, resolveAuthSession } from "../services/pendingAuthSessions";

const exchangeBodySchema = z.object({
  code: z.string(),
  state: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Appelée soit par la page statique de callback (ex: GitHub Pages) qui
  // reçoit le code depuis Tesla, soit directement par l'app mobile quand
  // expo-web-browser réussit à intercepter la redirection lui-même (ça
  // dépend de la plateforme/du type de build — pas fiable dans Expo Go, mais
  // ça arrive dans un vrai build natif). D'où la réponse en JSON dans tous
  // les cas : la page statique ignore le corps de la réponse, l'app mobile
  // s'en sert. Dans les deux cas, l'app mobile poll aussi
  // /auth/tesla/poll/:state en secours si l'interception n'a pas eu lieu.
  app.post("/auth/tesla/exchange", async (request, reply) => {
    const { code, state } = exchangeBodySchema.parse(request.body);

    try {
      // Le redirect_uri utilisé ici doit être identique, au caractère près, à
      // celui envoyé lors de l'étape d'autorisation et à celui enregistré
      // dans le Tesla Developer Portal — on utilise donc la valeur
      // configurée côté serveur (source unique de vérité) plutôt qu'une
      // valeur fournie par le client.
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

      const sessionToken = issueSessionToken(user.id);
      resolveAuthSession(state, sessionToken, user.id);
      reply.send({ sessionToken, userId: user.id });
    } catch (error) {
      // Le message d'erreur générique d'axios ("Request failed with status
      // code 400") ne dit rien d'utile : le détail exact renvoyé par Tesla
      // (invalid_grant, invalid_client...) est dans error.response.data.
      const teslaError = isAxiosError(error) ? error.response?.data : undefined;
      request.log.error({ err: error, teslaError }, "Tesla token exchange failed");

      const message = teslaError
        ? JSON.stringify(teslaError)
        : error instanceof Error
          ? error.message
          : "unknown_error";
      failAuthSession(state, message);
      reply.code(502).send({ error: message });
    }
  });

  // Interrogée par l'app mobile après avoir ouvert le navigateur, jusqu'à ce
  // que la page statique ait transmis le code (voir ci-dessus) ou qu'un
  // timeout côté app soit atteint.
  app.get<{ Params: { state: string } }>("/auth/tesla/poll/:state", async (request, reply) => {
    const session = consumeAuthSession(request.params.state);

    if (!session) {
      return reply.send({ ready: false });
    }

    if (session.status === "error") {
      return reply.send({ ready: true, error: session.error });
    }

    reply.send({ ready: true, sessionToken: session.sessionToken, userId: session.userId });
  });

  app.post("/auth/logout", { preHandler: authenticate }, async (_request, reply) => {
    reply.send({ ok: true });
  });
}

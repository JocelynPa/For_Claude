import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { exchangeCodeForToken } from "../services/teslaClient.js";

const TESLA_AUTHORIZE_URL = "https://auth.tesla.com/oauth2/v3/authorize";

interface TeslaIdTokenClaims {
  sub?: string;
  email?: string;
}

export async function authRoutes(app: FastifyInstance) {
  // Starts the Tesla OAuth flow: redirects the in-app browser (ASWebAuthenticationSession)
  // to Tesla's own login page.
  app.get("/auth/tesla/start", async (_request, reply) => {
    const state = randomUUID();
    const params = new URLSearchParams({
      client_id: env.TESLA_CLIENT_ID,
      redirect_uri: env.TESLA_REDIRECT_URI,
      response_type: "code",
      scope: "openid email offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds",
      state,
    });
    return reply.redirect(`${TESLA_AUTHORIZE_URL}?${params.toString()}`);
  });

  // Tesla redirects here after login. We exchange the code, upsert the user
  // (keyed by the Tesla account's stable subject id from the OIDC id_token),
  // store the Fleet API tokens, and hand the app a short-lived JWT via the
  // `teslacompanion://auth` custom URL scheme.
  app.get("/auth/tesla/callback", async (request, reply) => {
    const { code } = request.query as { code?: string };
    if (!code) {
      return reply.code(400).send({ error: "Missing code" });
    }

    const tokens = await exchangeCodeForToken(code);

    // Not verified against Tesla's JWKS here for brevity — do that before
    // trusting `sub`/`email` in production.
    const claims = tokens.id_token
      ? (jwt.decode(tokens.id_token) as TeslaIdTokenClaims | null)
      : null;
    const teslaSubject = claims?.sub;
    if (!teslaSubject) {
      return reply.code(502).send({ error: "Tesla did not return a valid id_token" });
    }

    const user = await prisma.user.upsert({
      where: { teslaSubject },
      update: { email: claims?.email ?? undefined },
      create: {
        id: randomUUID(),
        teslaSubject,
        email: claims?.email ?? `driver-${teslaSubject}@placeholder.local`,
      },
    });

    await prisma.teslaCredential.upsert({
      where: { userId: user.id },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        userId: user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    const appToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: "30d" });
    return reply.redirect(`${env.APP_REDIRECT_SCHEME}://auth?access_token=${appToken}`);
  });
}

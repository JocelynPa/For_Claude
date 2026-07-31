import { prisma } from "../db/prisma.js";
import { refreshAccessToken } from "./teslaClient.js";

// Shared by request-driven routes (vehicles.ts) and the Fleet Telemetry
// ingestor, which needs a valid token to fire auto-actions outside of any
// HTTP request.
export async function getValidAccessToken(userId: string): Promise<string> {
  const credential = await prisma.teslaCredential.findUniqueOrThrow({ where: { userId } });
  if (credential.expiresAt.getTime() > Date.now() + 60_000) {
    return credential.accessToken;
  }
  const refreshed = await refreshAccessToken(credential.refreshToken);
  await prisma.teslaCredential.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });
  return refreshed.access_token;
}

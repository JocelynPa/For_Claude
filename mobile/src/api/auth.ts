import { apiClient, clearSessionToken, setSessionToken } from "./client";

interface SessionResult {
  sessionToken: string;
  userId: string;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout").catch(() => undefined);
  await clearSessionToken();
}

export function getTeslaAuthorizeUrl(redirectUri: string, state: string): string {
  const clientId = process.env.EXPO_PUBLIC_TESLA_CLIENT_ID ?? "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid vehicle_device_data vehicle_cmds vehicle_charging_cmds offline_access",
    state,
  });
  return `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`;
}

/**
 * La page statique de callback (GitHub Pages) transmet le code au backend
 * elle-même — l'app mobile n'a jamais accès au code directement, elle
 * interroge le backend jusqu'à ce que l'échange soit terminé.
 */
export async function pollTeslaSession(
  state: string,
  { intervalMs = 1500, timeoutMs = 90_000 } = {}
): Promise<SessionResult | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const { data } = await apiClient.get<{
        ready: boolean;
        sessionToken?: string;
        userId?: string;
        error?: string;
      }>(`/auth/tesla/poll/${state}`);

      if (data.ready) {
        if (data.error || !data.sessionToken || !data.userId) {
          throw new Error(data.error ?? "La connexion Tesla a échoué.");
        }
        await setSessionToken(data.sessionToken);
        return { sessionToken: data.sessionToken, userId: data.userId };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("échoué")) throw error;
      // Erreur réseau transitoire : on retente jusqu'au timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

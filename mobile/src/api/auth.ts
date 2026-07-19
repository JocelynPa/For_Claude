import { apiClient, clearSessionToken, setSessionToken } from "./client";

interface ExchangeResponse {
  sessionToken: string;
  userId: string;
}

/**
 * Échange le code d'autorisation OAuth Tesla (obtenu via le navigateur système)
 * contre une session applicative. Le backend garde les tokens Tesla, jamais l'app.
 */
export async function exchangeTeslaAuthCode(
  code: string,
  redirectUri: string
): Promise<ExchangeResponse> {
  const { data } = await apiClient.post<ExchangeResponse>("/auth/tesla/exchange", {
    code,
    redirectUri,
  });
  await setSessionToken(data.sessionToken);
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout").catch(() => undefined);
  await clearSessionToken();
}

export function getTeslaAuthorizeUrl(redirectUri: string): string {
  const clientId = process.env.EXPO_PUBLIC_TESLA_CLIENT_ID ?? "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid vehicle_device_data vehicle_cmds vehicle_charging_cmds offline_access",
    state: Math.random().toString(36).slice(2),
  });
  return `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`;
}

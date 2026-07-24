import { env } from "../config/env.js";

const TESLA_AUTH_BASE = "https://auth.tesla.com/oauth2/v3";

interface TeslaTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCodeForToken(code: string): Promise<TeslaTokenResponse> {
  const response = await fetch(`${TESLA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.TESLA_CLIENT_ID,
      client_secret: env.TESLA_CLIENT_SECRET,
      code,
      redirect_uri: env.TESLA_REDIRECT_URI,
      audience: env.TESLA_AUDIENCE,
    }),
  });
  if (!response.ok) {
    throw new Error(`Tesla token exchange failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<TeslaTokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TeslaTokenResponse> {
  const response = await fetch(`${TESLA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.TESLA_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) {
    throw new Error(`Tesla token refresh failed: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<TeslaTokenResponse>;
}

export async function fleetApiFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(`${env.TESLA_AUDIENCE}/api/1${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Tesla Fleet API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

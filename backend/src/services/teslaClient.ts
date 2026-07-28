import { Agent } from "undici";
import { env } from "../config/env.js";

const TESLA_AUTH_BASE = "https://auth.tesla.com/oauth2/v3";

// `tesla-http-proxy` serves HTTPS with a self-signed cert (see
// backend/keys/README.md). Trust it only for that one call, only when
// TESLA_COMMAND_PROXY_INSECURE_TLS is explicitly set — never disable TLS
// verification more broadly than this.
const insecureProxyAgent = new Agent({ connect: { rejectUnauthorized: false } });

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

// Client-credentials token identifying the *app* itself (not a driver),
// used only for the one-time partner_accounts registration below.
export async function fetchPartnerToken(): Promise<string> {
  const response = await fetch(`${TESLA_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.TESLA_CLIENT_ID,
      client_secret: env.TESLA_CLIENT_SECRET,
      scope: "openid vehicle_device_data vehicle_cmds vehicle_charging_cmds",
      audience: env.TESLA_AUDIENCE,
    }),
  });
  if (!response.ok) {
    throw new Error(`Tesla partner token request failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

// Every Tesla Fleet API response is wrapped as `{ "response": ... }`; unwrap
// it here so call sites work directly with the payload's actual shape.
export async function fleetApiFetch<T = unknown>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
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
  const body = (await response.json()) as { response: T };
  return body.response;
}

// Vehicle *commands* (lock, climate, charging, flash, honk) must be signed
// with the Vehicle Command private key on any vehicle enforcing the Vehicle
// Command Protocol — a plain Bearer-token POST straight to the Fleet API is
// silently rejected. `tesla-http-proxy` (Tesla's official Go proxy) does
// that signing transparently; route all command calls through it instead
// of `fleetApiFetch`. Read-only calls (vehicle list, vehicle_data, wake_up)
// are unaffected and keep using `fleetApiFetch` directly.
export async function signedCommandFetch<T = unknown>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${env.TESLA_COMMAND_PROXY_URL}/api/1${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    // @ts-expect-error `dispatcher` is undici-specific and not in the DOM fetch types Node ships.
    dispatcher: env.TESLA_COMMAND_PROXY_INSECURE_TLS ? insecureProxyAgent : undefined,
  });
  if (!response.ok) {
    throw new Error(`Tesla command proxy error: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { response: T };
  return body.response;
}

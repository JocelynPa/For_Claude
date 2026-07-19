import axios from "axios";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

/**
 * Wrapper autour de la Tesla Fleet API.
 *
 * Deux surfaces distinctes chez Tesla :
 * - `TESLA_AUDIENCE` (fleet-api.prd.<region>.vehicle-command.tesla.com) : données
 *   véhicule en lecture (vehicles, vehicle_data) — appel REST classique avec le
 *   token OAuth de l'utilisateur.
 * - `TESLA_COMMAND_PROXY_URL` : commandes qui nécessitent la signature du
 *   Vehicle Command Protocol (lock/unlock, climate, charge...). Ces commandes
 *   NE PEUVENT PAS être envoyées en REST simple depuis 2023 ; il faut passer
 *   par le proxy de signature officiel (`tesla-http-proxy`, binaire Go fourni
 *   par Tesla : https://github.com/teslamotors/vehicle-command), qui détient
 *   la clé privée générée lors de l'enregistrement du domaine partenaire.
 */

const fleetApi = axios.create({ baseURL: env.TESLA_AUDIENCE });
const commandProxy = axios.create({ baseURL: env.TESLA_COMMAND_PROXY_URL });

async function getValidAccessToken(userId: string): Promise<string> {
  const credential = await prisma.teslaCredential.findUniqueOrThrow({ where: { userId } });

  if (credential.expiresAt.getTime() > Date.now() + 60_000) {
    return credential.accessToken;
  }

  const { data } = await axios.post("https://auth.tesla.com/oauth2/v3/token", {
    grant_type: "refresh_token",
    client_id: env.TESLA_CLIENT_ID,
    refresh_token: credential.refreshToken,
  });

  await prisma.teslaCredential.update({
    where: { userId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token as string;
}

export async function listTeslaVehicles(userId: string) {
  const token = await getValidAccessToken(userId);
  const { data } = await fleetApi.get("/api/1/vehicles", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.response;
}

export async function getTeslaVehicleData(userId: string, teslaVehicleId: string) {
  const token = await getValidAccessToken(userId);
  const { data } = await fleetApi.get(`/api/1/vehicles/${teslaVehicleId}/vehicle_data`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.response;
}

const COMMAND_ENDPOINTS: Record<string, string> = {
  door_lock: "command/door_lock",
  door_unlock: "command/door_unlock",
  climate_on: "command/auto_conditioning_start",
  climate_off: "command/auto_conditioning_stop",
  charge_start: "command/charge_start",
  charge_stop: "command/charge_stop",
  flash_lights: "command/flash_lights",
  honk_horn: "command/honk_horn",
};

export async function sendTeslaCommand(
  userId: string,
  teslaVehicleId: string,
  command: keyof typeof COMMAND_ENDPOINTS
) {
  const token = await getValidAccessToken(userId);
  const endpoint = COMMAND_ENDPOINTS[command];
  await commandProxy.post(
    `/api/1/vehicles/${teslaVehicleId}/${endpoint}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function setTeslaChargeLimit(userId: string, teslaVehicleId: string, percent: number) {
  const token = await getValidAccessToken(userId);
  await commandProxy.post(
    `/api/1/vehicles/${teslaVehicleId}/command/set_charge_limit`,
    { percent },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function exchangeTeslaCode(code: string, redirectUri: string) {
  const { data } = await axios.post("https://auth.tesla.com/oauth2/v3/token", {
    grant_type: "authorization_code",
    client_id: env.TESLA_CLIENT_ID,
    client_secret: env.TESLA_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
    audience: env.TESLA_AUDIENCE,
  });

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number,
  };
}

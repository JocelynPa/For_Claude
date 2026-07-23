import type { FastifyBaseLogger } from "fastify";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { getTeslaVehicleData } from "./teslaClient";
import { getMockRawVehicleData } from "./mockVehicle";
import { detectAlerts, type PreviousSnapshot, type VehicleSnapshot } from "./vehicleAlerts";
import { sendPushToUser } from "./pushNotifications";

const POLL_INTERVAL_MS = 3 * 60 * 1000;

interface PollableVehicle {
  id: string;
  userId: string;
  teslaId: string;
  displayName: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocked: boolean | null;
  lastSentryMode: boolean | null;
}

async function pollVehicle(vehicle: PollableVehicle, log: FastifyBaseLogger): Promise<void> {
  try {
    const raw = env.MOCK_TESLA_DATA
      ? getMockRawVehicleData(vehicle.teslaId)
      : await getTeslaVehicleData(vehicle.userId, vehicle.teslaId);

    const current: VehicleSnapshot = {
      latitude: raw.drive_state?.latitude ?? null,
      longitude: raw.drive_state?.longitude ?? null,
      locked: Boolean(raw.vehicle_state?.locked),
      sentryMode: Boolean(raw.vehicle_state?.sentry_mode),
      isParked: !raw.drive_state?.shift_state || raw.drive_state.shift_state === "P",
    };

    const previous: PreviousSnapshot = {
      lastLatitude: vehicle.lastLatitude,
      lastLongitude: vehicle.lastLongitude,
      lastLocked: vehicle.lastLocked,
      lastSentryMode: vehicle.lastSentryMode,
    };

    const alerts = detectAlerts(previous, current, vehicle.displayName);
    for (const alert of alerts) {
      await sendPushToUser(vehicle.userId, alert);
    }

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastLatitude: current.latitude,
        lastLongitude: current.longitude,
        lastLocked: current.locked,
        lastSentryMode: current.sentryMode,
        lastPolledAt: new Date(),
      },
    });
  } catch (error) {
    log.error({ err: error, vehicleId: vehicle.id }, "Vehicle alert poll failed");
  }
}

async function pollAllVehicles(log: FastifyBaseLogger): Promise<void> {
  // Le gating premium se fait ici, côté serveur : même si un client modifiait
  // alertsEnabled directement, aucune notification ne part sans abonnement
  // actif.
  const vehicles = await prisma.vehicle.findMany({
    where: {
      alertsEnabled: true,
      user: { subscription: { isActive: true } },
    },
  });

  await Promise.all(vehicles.map((vehicle) => pollVehicle(vehicle, log)));
}

export function startAlertPoller(log: FastifyBaseLogger): void {
  setInterval(() => {
    pollAllVehicles(log).catch((error) => log.error({ err: error }, "Alert poll cycle failed"));
  }, POLL_INTERVAL_MS);
}

/** Déclenche un sondage immédiat pour un véhicule — utilisé par l'endpoint
 * de simulation en mode MOCK_TESLA_DATA, pour tester sans attendre le
 * prochain cycle. */
export async function pollVehicleNow(vehicleId: string, log: FastifyBaseLogger): Promise<void> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return;
  await pollVehicle(vehicle, log);
}

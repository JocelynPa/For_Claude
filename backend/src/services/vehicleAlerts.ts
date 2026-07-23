/**
 * Alertes réalistes basées sur ce que la Fleet API expose réellement : la
 * Fleet API ne donne PAS accès aux événements caméra/détection de mouvement
 * du Mode Sentinelle (ça reste propriétaire à Tesla) — donc pas de vraie
 * alerte "quelqu'un s'approche du véhicule". Ce qu'on peut détecter de façon
 * fiable en comparant deux relevés d'état à quelques minutes d'intervalle :
 * un trajet qui démarre, le Mode Sentinelle qui s'active, ou la position qui
 * change de façon inattendue alors que le véhicule est censé être garé.
 */

const UNEXPECTED_MOVEMENT_METERS = 100;

export interface VehicleSnapshot {
  latitude: number | null;
  longitude: number | null;
  locked: boolean;
  sentryMode: boolean;
  isParked: boolean;
}

export interface PreviousSnapshot {
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocked: boolean | null;
  lastSentryMode: boolean | null;
}

export interface DetectedAlert {
  title: string;
  body: string;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function detectAlerts(
  previous: PreviousSnapshot,
  current: VehicleSnapshot,
  vehicleName: string
): DetectedAlert[] {
  const alerts: DetectedAlert[] = [];
  const hasPreviousFix = previous.lastLatitude !== null && previous.lastLongitude !== null;

  if (previous.lastSentryMode === false && current.sentryMode === true) {
    alerts.push({
      title: vehicleName,
      body: "Le Mode Sentinelle vient de s'activer.",
    });
  }

  if (previous.lastLocked === true && current.locked === false) {
    alerts.push({
      title: vehicleName,
      body: "Le véhicule vient d'être déverrouillé.",
    });
  }

  if (
    hasPreviousFix &&
    current.latitude !== null &&
    current.longitude !== null &&
    current.isParked
  ) {
    const distance = haversineMeters(
      previous.lastLatitude!,
      previous.lastLongitude!,
      current.latitude,
      current.longitude
    );
    if (distance > UNEXPECTED_MOVEMENT_METERS) {
      alerts.push({
        title: vehicleName,
        body: `Position inhabituelle détectée : le véhicule a bougé d'environ ${Math.round(distance)} m alors qu'il est garé.`,
      });
    }
  }

  return alerts;
}

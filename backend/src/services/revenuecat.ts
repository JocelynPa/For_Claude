import { prisma } from "../db/prisma";

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string;
    entitlement_id?: string;
    entitlement_ids?: string[];
    expiration_at_ms?: number;
    store?: string;
  };
}

const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
]);

const INACTIVE_EVENT_TYPES = new Set(["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"]);

/**
 * Le mobile associe RevenueCat à notre compte via `Purchases.logIn(userId)`
 * juste après l'authentification (voir identifyRevenueCatUser côté app) :
 * `app_user_id` reçu ici est donc directement notre identifiant utilisateur.
 */
export async function applyRevenueCatEvent(payload: RevenueCatEvent) {
  const { event } = payload;
  const userId = event.app_user_id;
  const entitlement = event.entitlement_id ?? event.entitlement_ids?.[0] ?? "premium";

  const isActive = ACTIVE_EVENT_TYPES.has(event.type)
    ? true
    : INACTIVE_EVENT_TYPES.has(event.type)
      ? false
      : undefined;

  if (isActive === undefined) return;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      revenueCatAppUserId: event.app_user_id,
      entitlement,
      isActive,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      store: event.store ?? "unknown",
    },
    update: {
      isActive,
      entitlement,
      expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      store: event.store ?? "unknown",
    },
  });
}

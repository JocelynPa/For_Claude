import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "../db/prisma";

const expo = new Expo();

export async function registerPushToken(userId: string, token: string): Promise<void> {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error("invalid_expo_push_token");
  }

  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token },
    update: { userId },
  });
}

/**
 * Envoie une notification à tous les appareils enregistrés d'un utilisateur.
 * Les tokens définitivement invalides (app désinstallée...) sont retirés.
 */
export async function sendPushToUser(
  userId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: "default",
    }));

  const chunks = expo.chunkPushNotifications(messages);
  const invalidTokens: string[] = [];

  for (const chunk of chunks) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    tickets.forEach((ticket, i) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        invalidTokens.push(chunk[i].to as string);
      }
    });
  }

  if (invalidTokens.length > 0) {
    await prisma.pushToken.deleteMany({ where: { token: { in: invalidTokens } } });
  }
}

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { apiClient } from "@/api/client";

/**
 * Récupère un token de push Expo et l'enregistre côté backend.
 *
 * Deux prérequis pour que ça fonctionne réellement :
 * - un projet EAS configuré (`extra.eas.projectId` dans app.json, via
 *   `eas init`) — sans ça, `getExpoPushTokenAsync` échoue silencieusement ici
 * - un build de développement (`eas build --profile development` ou
 *   `expo run:ios`/`run:android`) : Expo Go ne supporte plus les
 *   notifications push distantes depuis les SDK récents.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.warn(
      "Aucun projectId EAS configuré (extra.eas.projectId) : impossible de récupérer un token de push Expo."
    );
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await apiClient.post("/notifications/register-token", { token });
  } catch (error) {
    console.warn("Échec de l'enregistrement du token de push", error);
  }
}

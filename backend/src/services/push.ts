import http2 from "node:http2";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// APNs asks that the provider token (a short JWT signed with the .p8 auth
// key) be reused rather than regenerated per request — cache it and rotate
// once it's close to an hour old.
let cachedProviderToken: { token: string; issuedAt: number } | null = null;

function getProviderToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedProviderToken && now - cachedProviderToken.issuedAt < 55 * 60) {
    return cachedProviderToken.token;
  }
  const token = jwt.sign({ iss: env.APNS_TEAM_ID, iat: now }, env.APNS_AUTH_KEY!.replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    keyid: env.APNS_KEY_ID,
  });
  cachedProviderToken = { token, issuedAt: now };
  return token;
}

// Fire-and-forget push for a single event — the Sentry timeline itself
// (populated regardless of push config) is the durable record, so a failed
// or skipped push here is only ever a missed alert, never lost data.
export async function sendPushNotification(deviceToken: string, title: string, body: string): Promise<void> {
  if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID || !env.APNS_AUTH_KEY || !env.APNS_BUNDLE_ID) {
    console.log("APNs not configured — skipping push notification.");
    return;
  }

  const host = env.APNS_PRODUCTION ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";
  const client = http2.connect(host);
  client.on("error", (error) => console.error("APNs connection error", error));

  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: "default" } });

  await new Promise<void>((resolve, reject) => {
    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${getProviderToken()}`,
      "apns-topic": env.APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "content-type": "application/json",
    });
    request.setEncoding("utf8");
    let responseBody = "";
    let status = 0;
    request.on("response", (headers) => {
      status = Number(headers[":status"]);
    });
    request.on("data", (chunk) => {
      responseBody += chunk;
    });
    request.on("end", () => {
      client.close();
      if (status !== 200) {
        reject(new Error(`APNs push failed: ${status} ${responseBody}`));
      } else {
        resolve();
      }
    });
    request.on("error", reject);
    request.end(payload);
  }).catch((error) => {
    console.error("Failed to send push notification", error);
  });
}

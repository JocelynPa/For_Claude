import { prisma } from "../db/prisma.js";
import { fleetApiFetch, signedCommandFetch } from "../services/teslaClient.js";
import { getValidAccessToken } from "../services/tokenStore.js";

interface TeslaVehicleListItem {
  vin: string;
}

interface ScheduledUser {
  id: string;
  sentryScheduleStart: string;
  sentryScheduleEnd: string;
  sentryScheduleDays: string;
  sentryScheduleTimezone: string;
}

// Last state we commanded via the schedule, per user — in memory only,
// reset on restart (same pattern as the ingestor's lastSentryState). A
// restart just means the next tick re-asserts the schedule's desired state
// once even if it already matches, which is harmless — set_sentry_mode is
// idempotent against the vehicle's actual state.
const lastCommanded = new Map<string, boolean>();

function parseHHMM(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

// ISO weekday (1=Monday..7=Sunday) and minutes-since-midnight, both
// computed in the schedule's own timezone rather than the server's.
function currentWeekdayAndMinutes(timezone: string): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekdayShort = parts.find((part) => part.type === "weekday")!.value;
  const hour = Number(parts.find((part) => part.type === "hour")!.value);
  const minute = Number(parts.find((part) => part.type === "minute")!.value);

  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return { weekday: order.indexOf(weekdayShort) + 1, minutes: hour * 60 + minute };
}

function isWithinSchedule(start: string, end: string, days: string, timezone: string): boolean {
  const allowedDays = new Set(days.split(",").map(Number));
  const { weekday, minutes } = currentWeekdayAndMinutes(timezone);
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);

  if (startMin === endMin) return false; // zero-length window — never active

  if (startMin < endMin) {
    // Same-day window (e.g. 09:00-17:00).
    return allowedDays.has(weekday) && minutes >= startMin && minutes < endMin;
  }

  // Overnight window (e.g. 20:00-07:00): active from `start` to midnight on
  // an allowed day, or from midnight to `end` on the day *after* one.
  const previousWeekday = weekday === 1 ? 7 : weekday - 1;
  if (minutes >= startMin) return allowedDays.has(weekday);
  if (minutes < endMin) return allowedDays.has(previousWeekday);
  return false;
}

async function applySchedule(user: ScheduledUser): Promise<void> {
  const desired = isWithinSchedule(
    user.sentryScheduleStart,
    user.sentryScheduleEnd,
    user.sentryScheduleDays,
    user.sentryScheduleTimezone
  );
  if (lastCommanded.get(user.id) === desired) return;

  try {
    const token = await getValidAccessToken(user.id);
    const vehicles = await fleetApiFetch<TeslaVehicleListItem[]>("/vehicles", token);
    const vin = vehicles[0]?.vin;
    if (!vin) return;

    await signedCommandFetch(`/vehicles/${vin}/command/set_sentry_mode`, token, {
      method: "POST",
      body: JSON.stringify({ on: desired }),
    });
    lastCommanded.set(user.id, desired);
  } catch (error) {
    console.error(`Sentry schedule: failed to set Sentry Mode to ${desired} for user ${user.id}`, error);
  }
}

const TICK_INTERVAL_MS = 60_000;

// Runs server-side (not on the phone) so the schedule fires even with the
// app closed or the phone off, same reasoning as the auto-action fired by
// the Fleet Telemetry ingestor. One tick per minute is enough resolution
// for a schedule specified to the minute.
export function startSentrySchedule(): void {
  setInterval(() => {
    prisma.user
      .findMany({ where: { sentryScheduleEnabled: true } })
      .then((users) => Promise.all(users.map(applySchedule)))
      .catch((error) => console.error("Sentry schedule tick failed", error));
  }, TICK_INTERVAL_MS);
  console.log(`Sentry schedule ticking every ${TICK_INTERVAL_MS / 1000}s`);
}

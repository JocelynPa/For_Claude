import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authenticate } from "../middleware/authenticate.js";

const SENTRY_AUTO_ACTIONS = ["none", "honk", "flash", "lock"] as const;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function daysToString(days: number[]): string {
  return days.join(",");
}

function daysFromString(value: string): number[] {
  return value
    .split(",")
    .map((part) => Number(part))
    .filter((day) => Number.isInteger(day));
}

function scheduleResponse(user: {
  sentryScheduleEnabled: boolean;
  sentryScheduleStart: string;
  sentryScheduleEnd: string;
  sentryScheduleDays: string;
  sentryScheduleTimezone: string;
}) {
  return {
    enabled: user.sentryScheduleEnabled,
    start: user.sentryScheduleStart,
    end: user.sentryScheduleEnd,
    days: daysFromString(user.sentryScheduleDays),
    timezone: user.sentryScheduleTimezone,
  };
}

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/settings", async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId! } });
    return { sentryAutoAction: user.sentryAutoAction, sentrySchedule: scheduleResponse(user) };
  });

  const updateSettingsBody = z.object({
    sentryAutoAction: z.enum(SENTRY_AUTO_ACTIONS).optional(),
    // Sent as one unit (not individually optional fields) — the app always
    // writes the whole schedule together when the user changes any part of
    // it. Applied server-side, see src/scheduler/sentrySchedule.ts.
    sentrySchedule: z
      .object({
        enabled: z.boolean(),
        start: z.string().regex(HHMM),
        end: z.string().regex(HHMM),
        days: z.array(z.number().int().min(1).max(7)).min(1),
        timezone: z.string().min(1),
      })
      .optional(),
  });
  app.patch("/settings", async (request) => {
    const body = updateSettingsBody.parse(request.body);
    const data: Prisma.UserUpdateInput = {};
    if (body.sentryAutoAction !== undefined) data.sentryAutoAction = body.sentryAutoAction;
    if (body.sentrySchedule) {
      data.sentryScheduleEnabled = body.sentrySchedule.enabled;
      data.sentryScheduleStart = body.sentrySchedule.start;
      data.sentryScheduleEnd = body.sentrySchedule.end;
      data.sentryScheduleDays = daysToString(body.sentrySchedule.days);
      data.sentryScheduleTimezone = body.sentrySchedule.timezone;
    }
    const user = await prisma.user.update({ where: { id: request.userId! }, data });
    return { sentryAutoAction: user.sentryAutoAction, sentrySchedule: scheduleResponse(user) };
  });
}

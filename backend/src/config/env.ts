import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  TESLA_CLIENT_ID: z.string(),
  TESLA_CLIENT_SECRET: z.string(),
  TESLA_REDIRECT_URI: z.string().url(),
  TESLA_AUDIENCE: z.string().default("https://fleet-api.prd.eu.vn.cloud.tesla.com"),
  APP_REDIRECT_SCHEME: z.string().default("teslacompanion"),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);

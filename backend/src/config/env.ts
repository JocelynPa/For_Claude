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
  // Local `tesla-http-proxy` instance that signs vehicle commands with the
  // Vehicle Command private key. Required for lock/climate/charge commands
  // to work on any vehicle enforcing the Vehicle Command Protocol — see
  // backend/keys/README.md.
  TESLA_COMMAND_PROXY_URL: z.string().url().default("https://localhost:4443"),
  APP_REDIRECT_SCHEME: z.string().default("teslacompanion"),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);

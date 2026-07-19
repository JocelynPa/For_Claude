import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_JWT_SECRET: z.string().min(16),
  DATABASE_URL: z.string().url(),

  TESLA_CLIENT_ID: z.string(),
  TESLA_CLIENT_SECRET: z.string(),
  TESLA_REDIRECT_URI: z.string().url(),
  TESLA_AUDIENCE: z.string().url(),
  TESLA_COMMAND_PROXY_URL: z.string().url(),
  TESLA_PUBLIC_KEY_PATH: z.string(),

  REVENUECAT_WEBHOOK_AUTH_HEADER: z.string(),
  REVENUECAT_SECRET_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

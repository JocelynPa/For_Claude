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
  // Vehicle Command private key. Required for the Sentry Mode toggle and
  // the Fleet Telemetry auto-action (honk/flash/lock) to work on any
  // vehicle enforcing the Vehicle Command Protocol — see
  // backend/keys/README.md.
  TESLA_COMMAND_PROXY_URL: z.string().url().default("https://localhost:4443"),
  // The proxy serves HTTPS with a self-signed cert (there's no public CA to
  // validate against for a purely internal service) whether run on
  // localhost or as a Docker Compose service — trust it explicitly via this
  // flag rather than guessing from the URL's hostname, which breaks as soon
  // as TESLA_COMMAND_PROXY_URL points at a Docker service name instead of
  // localhost. Only ever set this for a proxy instance you control on a
  // private/internal network.
  TESLA_COMMAND_PROXY_INSECURE_TLS: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  APP_REDIRECT_SCHEME: z.string().default("teslacompanion"),
  // Fleet Telemetry ingestion (Sentry timeline). Optional: the backend runs
  // fine without it, it just won't ingest real Sentry timeline data — see
  // deploy/README.md.
  REDIS_URL: z.string().optional(),
  FLEET_TELEMETRY_NAMESPACE: z.string().default("tesla_telemetry"),
  // Used only by the one-off tesla:register-vehicle-telemetry script, not by
  // the running server.
  FLEET_TELEMETRY_HOSTNAME: z.string().optional(),
  FLEET_TELEMETRY_PORT: z.coerce.number().default(443),
  FLEET_TELEMETRY_CA_FILE: z.string().optional(),
});

export const env = schema.parse(process.env);

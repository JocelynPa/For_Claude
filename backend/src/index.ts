import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.js";
import { vehicleRoutes } from "./routes/vehicles.js";
import { wellKnownRoutes } from "./routes/wellKnown.js";
import { subscriptionRoutes } from "./routes/subscriptions.js";
import { settingsRoutes } from "./routes/settings.js";
import { startTelemetryIngestor } from "./telemetry/ingestor.js";
import { startSentrySchedule } from "./scheduler/sentrySchedule.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(vehicleRoutes);
await app.register(wellKnownRoutes);
await app.register(subscriptionRoutes);
await app.register(settingsRoutes);

app.listen({ port: env.PORT, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

startTelemetryIngestor().catch((error) => app.log.error(error));
startSentrySchedule();

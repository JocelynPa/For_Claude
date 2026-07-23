import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth";
import { vehicleRoutes } from "./routes/vehicles";
import { wellKnownRoutes } from "./routes/wellKnown";
import { subscriptionRoutes } from "./routes/subscriptions";
import { notificationRoutes } from "./routes/notifications";
import { startAlertPoller } from "./services/alertPoller";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(vehicleRoutes);
  await app.register(wellKnownRoutes);
  await app.register(subscriptionRoutes);
  await app.register(notificationRoutes);

  startAlertPoller(app.log);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

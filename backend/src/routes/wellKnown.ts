import { readFile } from "node:fs/promises";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env";

/**
 * Tesla exige que la clé publique du partenaire soit servie sur ce chemin
 * exact du domaine enregistré dans le Tesla Developer Portal, en clair et
 * sans authentification, pour valider les commandes signées.
 */
export async function wellKnownRoutes(app: FastifyInstance) {
  app.get("/.well-known/appspecific/com.tesla.3p.public-key.pem", async (_request, reply) => {
    const key = await readFile(env.TESLA_PUBLIC_KEY_PATH, "utf-8");
    reply.type("application/x-pem-file").send(key);
  });
}

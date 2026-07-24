import type { FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Tesla requires the Vehicle Command public key to be served at this exact
// path over HTTPS on the domain registered with the Tesla Developer app.
// See backend/keys/README.md for how to generate the key pair.
export async function wellKnownRoutes(app: FastifyInstance) {
  app.get("/.well-known/appspecific/com.tesla.3p.public-key.pem", async (_request, reply) => {
    try {
      const key = await readFile(path.resolve("keys/public-key.pem"), "utf-8");
      reply.header("Content-Type", "application/x-pem-file");
      return key;
    } catch {
      return reply.code(404).send({ error: "Public key not configured. See backend/keys/README.md" });
    }
  });
}

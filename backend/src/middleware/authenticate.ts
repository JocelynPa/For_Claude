import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface SessionPayload {
  userId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "unauthenticated" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.SESSION_JWT_SECRET) as SessionPayload;
    request.userId = payload.userId;
  } catch {
    return reply.code(401).send({ error: "invalid_session" });
  }
}

export function issueSessionToken(userId: string): string {
  return jwt.sign({ userId } satisfies SessionPayload, env.SESSION_JWT_SECRET, {
    expiresIn: "30d",
  });
}

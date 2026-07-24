import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface AuthPayload {
  userId: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing authorization header" });
  }
  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    request.userId = payload.userId;
  } catch {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
}

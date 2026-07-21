/**
 * expo-web-browser n'intercepte pas de façon fiable une redirection HTTPS
 * générique (ça dépend de la plateforme, et ne fonctionne pas dans Expo Go).
 * La page statique de callback (ex: GitHub Pages) transmet donc le code au
 * backend elle-même via /auth/tesla/exchange, et l'app mobile récupère le
 * résultat en interrogeant /auth/tesla/poll/:state. Un stockage en mémoire
 * suffit : chaque entrée est de courte durée et à usage unique.
 */

interface PendingSession {
  status: "success" | "error";
  sessionToken?: string;
  userId?: string;
  error?: string;
  createdAt: number;
}

const TTL_MS = 5 * 60 * 1000;
const sessions = new Map<string, PendingSession>();

function evictExpired(): void {
  const cutoff = Date.now() - TTL_MS;
  for (const [state, session] of sessions) {
    if (session.createdAt < cutoff) sessions.delete(state);
  }
}

export function resolveAuthSession(state: string, sessionToken: string, userId: string): void {
  evictExpired();
  sessions.set(state, { status: "success", sessionToken, userId, createdAt: Date.now() });
}

export function failAuthSession(state: string, error: string): void {
  evictExpired();
  sessions.set(state, { status: "error", error, createdAt: Date.now() });
}

/** Retourne le résultat et le retire (usage unique), ou `null` si pas encore prêt. */
export function consumeAuthSession(state: string): PendingSession | null {
  const session = sessions.get(state);
  if (!session) return null;
  sessions.delete(state);
  return session;
}

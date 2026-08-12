import type { SessionResponse } from "@app/contracts";
import type { DatabaseStore } from "@app/infra";

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 365 * DAY_MS;

/** SHA-256 hex digest via Web Crypto — platform crypto, not custom (ADR-006). */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create-only anonymous session (ADR-006): mint a random Bearer token, store
 * only its hash, return the raw token exactly once.
 */
export async function createSession(db: DatabaseStore): Promise<SessionResponse> {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await db
    .prepare(
      "INSERT INTO sessions (id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(sessionId, tokenHash, now, now, expiresAt)
    .run();
  return { sessionId, token, expiresAt };
}

/** Resolve a Bearer token to a live session, or null. Touches last_seen_at. */
export async function resolveSession(
  db: DatabaseStore,
  authHeader: string | undefined,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await db
    .prepare(
      "SELECT id as sessionId, expires_at as expiresAt FROM sessions WHERE token_hash = ?",
    )
    .bind(tokenHash)
    .first<{ sessionId: string; expiresAt: number }>();
  if (!row) return null;
  if (row.expiresAt < Date.now()) return null;
  await db
    .prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?")
    .bind(Date.now(), row.sessionId)
    .run();
  return row.sessionId;
}

/** Delete expired sessions (and their snapshots) — run by the daily cron.
 * The FK cascade on sync_snapshots handles snapshot deletion automatically. */
export async function cleanupExpiredSessions(db: DatabaseStore): Promise<number> {
  const expired = await db
    .prepare("SELECT id FROM sessions WHERE expires_at < ?")
    .bind(Date.now())
    .all<{ id: string }>();
  const count = (expired.results ?? []).length;
  if (count === 0) return 0;
  await db
    .prepare("DELETE FROM sessions WHERE expires_at < ?")
    .bind(Date.now())
    .run();
  return count;
}

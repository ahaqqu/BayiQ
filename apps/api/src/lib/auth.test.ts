import { describe, expect, it } from "vitest";
import { cleanupExpiredSessions, createSession, resolveSession, sha256 } from "./auth";
import { createTestDatabase } from "../test-utils/memory-d1";

describe("sha256", () => {
  it("produces a 64-char hex digest", async () => {
    const digest = await sha256("bayiq-token");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    expect(await sha256("x")).toBe(await sha256("x"));
  });
});

describe("createSession", () => {
  it("returns a session with a long token and 1-year expiry", async () => {
    const db = createTestDatabase();
    const before = Date.now();
    const session = await createSession(db);
    expect(session.token.length).toBeGreaterThanOrEqual(64);
    expect(session.expiresAt - before).toBeGreaterThanOrEqual(364 * 24 * 60 * 60 * 1000);
    expect(session.expiresAt - before).toBeLessThanOrEqual(366 * 24 * 60 * 60 * 1000);
  });

  it("stores only the token hash, never the raw token", async () => {
    const db = createTestDatabase();
    const session = await createSession(db);
    const stored = await db
      .prepare("SELECT payload FROM sync_snapshots WHERE session_id = ?")
      .bind("none")
      .first();
    expect(stored).toBeNull();
    const hash = await sha256(session.token);
    const row = await db
      .prepare(
        "SELECT id as sessionId, expires_at as expiresAt FROM sessions WHERE token_hash = ?",
      )
      .bind(hash)
      .first<{ sessionId: string }>();
    expect(row?.sessionId).toBe(session.sessionId);
  });
});

describe("resolveSession", () => {
  it("resolves a valid Bearer token", async () => {
    const db = createTestDatabase();
    const session = await createSession(db);
    const sessionId = await resolveSession(db, `Bearer ${session.token}`);
    expect(sessionId).toBe(session.sessionId);
  });

  it("returns null for a missing or malformed header", async () => {
    const db = createTestDatabase();
    expect(await resolveSession(db, undefined)).toBeNull();
    expect(await resolveSession(db, "Basic abc")).toBeNull();
    expect(await resolveSession(db, "Bearer ")).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    const db = createTestDatabase();
    expect(await resolveSession(db, "Bearer unknown-token")).toBeNull();
  });

  it("returns null for an expired session", async () => {
    const db = createTestDatabase();
    const session = await createSession(db);
    (db as unknown as { _expire: (id: string) => void })._expire(session.sessionId);
    expect(await resolveSession(db, `Bearer ${session.token}`)).toBeNull();
  });
});

describe("cleanupExpiredSessions", () => {
  it("deletes expired sessions and their snapshots in bulk", async () => {
    const db = createTestDatabase();
    const s1 = await createSession(db);
    const s2 = await createSession(db);
    (db as unknown as { _expire: (id: string) => void })._expire(s1.sessionId);
    (db as unknown as { _expire: (id: string) => void })._expire(s2.sessionId);
    const count = await cleanupExpiredSessions(db);
    expect(count).toBe(2);
    expect(await resolveSession(db, `Bearer ${s1.token}`)).toBeNull();
    expect(await resolveSession(db, `Bearer ${s2.token}`)).toBeNull();
  });

  it("returns 0 when no sessions are expired", async () => {
    const db = createTestDatabase();
    await createSession(db);
    const count = await cleanupExpiredSessions(db);
    expect(count).toBe(0);
  });
});

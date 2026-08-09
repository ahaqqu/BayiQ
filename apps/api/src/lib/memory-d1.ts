import type { D1Database } from "../cf-types";

/**
 * Structured in-memory D1 test double for repo/auth unit tests.
 *
 * Statements are normalized (whitespace-collapsed) and matched *exactly*:
 * an altered or unknown query throws instead of silently matching a
 * substring, so a repo SQL change fails its test loudly at the exact
 * statement that moved. Models the sessions/sync_snapshots tables.
 */

type SessionRow = { tokenHash: string; createdAt: number; lastSeenAt: number; expiresAt: number };
type SnapshotRow = { payload: string; serverNow: number };

type Verb = "run" | "first" | "all";
type Handler = Partial<Record<Verb, (binds: unknown[]) => unknown>>;

const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();

export function createMemoryD1(): D1Database {
  const sessions = new Map<string, SessionRow>();
  const snapshots = new Map<string, SnapshotRow>();

  /** Test helper: force a session's expiry into the past. */
  function expireSession(sessionId: string): void {
    const row = sessions.get(sessionId);
    if (row) row.expiresAt = 1;
  }

  const handlers: Record<string, Handler> = {
    [norm(
      "INSERT INTO sessions (id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    )]: {
      run: (b) =>
        void sessions.set(String(b[0]), {
          tokenHash: String(b[1]),
          createdAt: Number(b[2]),
          lastSeenAt: Number(b[3]),
          expiresAt: Number(b[4]),
        }),
    },
    [norm(
      "SELECT id as sessionId, expires_at as expiresAt FROM sessions WHERE token_hash = ?",
    )]: {
      first: (b) => {
        for (const [id, s] of sessions) {
          if (s.tokenHash === b[0]) return { sessionId: id, expiresAt: s.expiresAt };
        }
        return null;
      },
    },
    [norm("UPDATE sessions SET last_seen_at = ? WHERE id = ?")]: {
      run: (b) => {
        const row = sessions.get(String(b[1]));
        if (row) row.lastSeenAt = Number(b[0]);
      },
    },
    [norm("SELECT id FROM sessions WHERE expires_at < ?")]: {
      all: (b) =>
        [...sessions.entries()]
          .filter(([, s]) => s.expiresAt < Number(b[0]))
          .map(([id]) => ({ id })),
    },
    [norm("DELETE FROM sync_snapshots WHERE session_id = ?")]: {
      run: (b) => void snapshots.delete(String(b[0])),
    },
    [norm("DELETE FROM sessions WHERE id = ?")]: {
      run: (b) => void sessions.delete(String(b[0])),
    },
    [norm("SELECT payload FROM sync_snapshots WHERE session_id = ?")]: {
      first: (b) => {
        const row = snapshots.get(String(b[0]));
        return row ? { payload: row.payload } : null;
      },
    },
    [norm(
      "INSERT INTO sync_snapshots (session_id, payload, server_now) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET payload = excluded.payload, server_now = excluded.server_now",
    )]: {
      run: (b) =>
        void snapshots.set(String(b[0]), {
          payload: String(b[1]),
          serverNow: Number(b[2]),
        }),
    },
  };

  function dispatch(sql: string, verb: Verb, binds: unknown[]): unknown {
    const handler = handlers[norm(sql)]?.[verb];
    if (!handler) {
      throw new Error(`memory-d1: no ${verb} handler for: ${norm(sql)}`);
    }
    return handler(binds);
  }

  return {
    prepare(sql: string) {
      const binds: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          binds.push(...args);
          return stmt;
        },
        async run() {
          dispatch(sql, "run", binds);
          return { success: true };
        },
        async first<T>() {
          return dispatch(sql, "first", binds) as T | null;
        },
        async all<T>() {
          return { results: dispatch(sql, "all", binds) as T[] };
        },
      };
      return stmt;
    },
    _expire: expireSession,
  } as unknown as D1Database;
}

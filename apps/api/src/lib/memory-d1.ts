import {
  createMemoryDatabaseStore,
  type DatabaseStore,
  type StatementHandler,
} from "@app/infra";

/**
 * Structured in-memory database test double for repo/auth unit tests.
 *
 * Statements are normalized (whitespace-collapsed) and matched *exactly*:
 * an altered or unknown query throws instead of silently matching a
 * substring, so a repo SQL change fails its test loudly at the exact
 * statement that moved. Models the sessions/sync_snapshots tables.
 */

type SessionRow = {
  tokenHash: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
};
type SnapshotRow = { payload: string; serverNow: number };

export function createTestDatabase(): DatabaseStore & {
  _expire: (id: string) => void;
} {
  const sessions = new Map<string, SessionRow>();
  const snapshots = new Map<string, SnapshotRow>();

  /** Test helper: force a session's expiry into the past. */
  function expireSession(sessionId: string): void {
    const row = sessions.get(sessionId);
    if (row) row.expiresAt = 1;
  }

  const handlers: Record<string, StatementHandler> = {
    "INSERT INTO sessions (id, token_hash, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)":
      {
        run: (b) =>
          void sessions.set(String(b[0]), {
            tokenHash: String(b[1]),
            createdAt: Number(b[2]),
            lastSeenAt: Number(b[3]),
            expiresAt: Number(b[4]),
          }),
      },
    "SELECT id as sessionId, expires_at as expiresAt FROM sessions WHERE token_hash = ?": {
      first: (b) => {
        for (const [id, s] of sessions) {
          if (s.tokenHash === b[0])
            return { sessionId: id, expiresAt: s.expiresAt };
        }
        return null;
      },
    },
    "UPDATE sessions SET last_seen_at = ? WHERE id = ?": {
      run: (b) => {
        const row = sessions.get(String(b[1]));
        if (row) row.lastSeenAt = Number(b[0]);
      },
    },
    "SELECT id FROM sessions WHERE expires_at < ?": {
      all: (b) =>
        [...sessions.entries()]
          .filter(([, s]) => s.expiresAt < Number(b[0]))
          .map(([id]) => ({ id })),
    },
    "DELETE FROM sync_snapshots WHERE session_id = ?": {
      run: (b) => void snapshots.delete(String(b[0])),
    },
    "DELETE FROM sessions WHERE id = ?": {
      run: (b) => void sessions.delete(String(b[0])),
    },
    "SELECT payload FROM sync_snapshots WHERE session_id = ?": {
      first: (b) => {
        const row = snapshots.get(String(b[0]));
        return row ? { payload: row.payload } : null;
      },
    },
    "INSERT INTO sync_snapshots (session_id, payload, server_now) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET payload = excluded.payload, server_now = excluded.server_now":
      {
        run: (b) =>
          void snapshots.set(String(b[0]), {
            payload: String(b[1]),
            serverNow: Number(b[2]),
          }),
      },
  };

  const store = createMemoryDatabaseStore(handlers);
  return { ...store, _expire: expireSession };
}

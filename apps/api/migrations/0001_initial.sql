-- BayiQ initial schema (vertical slice). Sessions are anonymous Bearer
-- sessions (ADR-001, ADR-006): only the SHA-256 token hash is stored, so a
-- D1 dump cannot be replayed. Sync snapshots hold the merged CRDT payload
-- (ADR-003, ADR-007) as JSON with the server clock used for the merge.

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_snapshots (
  session_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  server_now INTEGER NOT NULL
);

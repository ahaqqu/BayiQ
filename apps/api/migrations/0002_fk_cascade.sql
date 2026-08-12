-- Add FK cascade from sync_snapshots to sessions. SQLite cannot ALTER TABLE
-- to add a foreign key, so we recreate the table, copy data, and rename.

CREATE TABLE IF NOT EXISTS sync_snapshots_new (
  session_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  server_now INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

INSERT INTO sync_snapshots_new (session_id, payload, server_now)
  SELECT session_id, payload, server_now FROM sync_snapshots;

DROP TABLE sync_snapshots;

ALTER TABLE sync_snapshots_new RENAME TO sync_snapshots;
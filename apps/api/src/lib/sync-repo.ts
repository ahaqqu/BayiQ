import type { Child, Record } from "@app/contracts";
import type { DatabaseStore } from "@app/infra";
import {
  aliveChildren,
  aliveRecords,
  mergeChildren,
  mergeRecords,
  type ChildRow,
  type RecordRow,
} from "@app/local-first";

export type SyncSnapshot = {
  children: ChildRow[];
  records: RecordRow[];
};

function emptySnapshot(): SyncSnapshot {
  return { children: [], records: [] };
}

/**
 * Server-side merge (ADR-003, ADR-007): load the stored snapshot, LWW-merge
 * the incoming children and records independently, persist the full merged
 * state (tombstones included), and return the alive rows for the response.
 */
export async function syncSnapshot(
  db: DatabaseStore,
  sessionId: string,
  incoming: { children: Child[]; records: Record[] },
): Promise<SyncSnapshot> {
  const existing = await db
    .prepare("SELECT payload FROM sync_snapshots WHERE session_id = ?")
    .bind(sessionId)
    .first<{ payload: string }>();
  const server = existing
    ? (JSON.parse(existing.payload) as SyncSnapshot)
    : emptySnapshot();
  const merged: SyncSnapshot = {
    children: mergeChildren(server.children, incoming.children),
    records: mergeRecords(server.records, incoming.records),
  };
  await db
    .prepare(
      "INSERT INTO sync_snapshots (session_id, payload, server_now) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET payload = excluded.payload, server_now = excluded.server_now",
    )
    .bind(sessionId, JSON.stringify(merged), Date.now())
    .run();
  return {
    children: aliveChildren(merged.children),
    records: aliveRecords(merged.records),
  };
}

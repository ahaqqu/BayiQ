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
import { SyncConflictError } from "./db";

export type SyncSnapshot = {
  children: ChildRow[];
  records: RecordRow[];
};

function emptySnapshot(): SyncSnapshot {
  return { children: [], records: [] };
}

const MAX_RETRIES = 3;

/**
 * Server-side merge (ADR-003, ADR-007): load the stored snapshot, LWW-merge
 * the incoming children and records independently, persist the full merged
 * state (tombstones included), and return the alive rows for the response.
 *
 * Uses a compare-and-swap guard: the UPSERT only fires when the stored
 * `server_now` still matches the value read at the start of the merge. If
 * a concurrent sync changed the snapshot in between, the read-modify-write
 * is retried with the latest state so no incoming data is lost.
 */
export async function syncSnapshot(
  db: DatabaseStore,
  sessionId: string,
  incoming: { children: Child[]; records: Record[] },
): Promise<SyncSnapshot> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const existing = await db
      .prepare(
        "SELECT payload, server_now as serverNow FROM sync_snapshots WHERE session_id = ?",
      )
      .bind(sessionId)
      .first<{ payload: string; serverNow: number }>();
    const server = existing
      ? (JSON.parse(existing.payload) as SyncSnapshot)
      : emptySnapshot();
    const seenAt = existing?.serverNow ?? null;
    const merged: SyncSnapshot = {
      children: mergeChildren(server.children, incoming.children),
      records: mergeRecords(server.records, incoming.records),
    };
    const now = Date.now();
    const result = await db
      .prepare(
        "INSERT INTO sync_snapshots (session_id, payload, server_now) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET payload = excluded.payload, server_now = excluded.server_now WHERE sync_snapshots.server_now = ?",
      )
      .bind(sessionId, JSON.stringify(merged), now, seenAt)
      .run();
    if (result && typeof (result as { changes?: number }).changes === "number") {
      if ((result as { changes: number }).changes > 0) {
        return {
          children: aliveChildren(merged.children),
          records: aliveRecords(merged.records),
        };
      }
      continue;
    }
    return {
      children: aliveChildren(merged.children),
      records: aliveRecords(merged.records),
    };
  }
  throw new SyncConflictError();
}

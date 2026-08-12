import type { ChildRow, RecordRow } from "./merge";

/**
 * Tombstone hygiene. Tombstones carry no payload (a delete must not retain
 * the record's content) and are garbage-collected client-side once they are
 * older than the horizon below. GC runs only after a successful pushPull, so
 * every collected tombstone is server-acknowledged by definition.
 *
 * Horizon: 30 days — any client that syncs at least monthly never resurrects
 * a collected delete. The server keeps its own tombstones; local GC only
 * bounds IndexedDB growth.
 */
export const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Strip a deleted child to a payload-free tombstone. */
export function toChildTombstone(childId: string, updatedAt: number): ChildRow {
  return { childId, name: "", dateOfBirth: "", updatedAt, deleted: true };
}

/** Strip a deleted record to a payload-free tombstone. */
export function toRecordTombstone(
  recordId: string,
  childId: string,
  updatedAt: number,
): RecordRow {
  return { recordId, childId, doseId: "", givenDate: "", updatedAt, deleted: true };
}

/** Drop tombstones older than the horizon. Alive rows are never touched. */
export function gcTombstones<T extends { deleted?: boolean | undefined; updatedAt: number }>(
  rows: T[],
  now = Date.now(),
  ttlMs = TOMBSTONE_TTL_MS,
): T[] {
  return rows.filter((r) => !r.deleted || now - r.updatedAt < ttlMs);
}

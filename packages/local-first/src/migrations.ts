import type { BayiQState } from "./merge";

/**
 * Client store snapshot, persisted whole in IndexedDB. `clockFloor` is the
 * server-bias floor for future `updatedAt` stamps (see clock.ts); absent on
 * snapshots written before clock discipline existed.
 */

/** v2 notes store (template shape) — the pre-BayiQ snapshot. */
export type NotesState = {
  schemaVersion: number;
  notes: { id: string; title: string; body: string; updatedAt: number; deleted?: boolean | undefined }[];
  clockFloor?: number | undefined;
};

/**
 * v2 notes → v3 BayiQ store. BayiQ never shipped the notes store to real
 * users, so the migration discards notes and starts with empty children and
 * records, preserving the clock floor.
 */
export function migrateV2ToV3(snap: NotesState): BayiQState {
  return {
    schemaVersion: 3,
    children: [],
    records: [],
    clockFloor: snap.clockFloor,
  };
}

export function migrateToLatest(snap: NotesState | BayiQState): BayiQState {
  if (snap.schemaVersion >= 3) {
    return snap as BayiQState;
  }
  return migrateV2ToV3(snap as NotesState);
}

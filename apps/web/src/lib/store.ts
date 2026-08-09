import {
  SCHEMA_VERSION,
  gcTombstones,
  mergeChildren,
  mergeRecords,
  raiseClockFloor,
  stampNow,
  toChildTombstone,
  toRecordTombstone,
  type BayiQState,
  type ChildRow,
  type RecordRow,
} from "@app/local-first";
import { migrateToLatest } from "@app/local-first/client";
import { createContext, useContext, useSyncExternalStore } from "react";

const DB_NAME = "bayiq-store";
const STORE = "snapshot";

async function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadState(): Promise<BayiQState> {
  const db = await idb();
  const raw = await new Promise<BayiQState | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const g = tx.objectStore(STORE).get("main");
    g.onsuccess = () => resolve(g.result as BayiQState | undefined);
    g.onerror = () => reject(g.error);
  });
  db.close();
  const base = raw ?? { schemaVersion: SCHEMA_VERSION, children: [], records: [] };
  return migrateToLatest(base);
}

async function saveState(state: BayiQState): Promise<void> {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(state, "main");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export type ChildInput = {
  name: string;
  dateOfBirth: string;
  sex?: "male" | "female" | undefined;
};

export type RecordInput = {
  childId: string;
  doseId: string;
  givenDate: string;
  brand?: string | undefined;
  note?: string | undefined;
};

/**
 * The local-first store: source of truth for Children and Records (ADR-003).
 * Writes are optimistic, stamped against the clock floor, merged into the
 * in-memory state, and persisted to IndexedDB in the same tick. React binds
 * via useSyncExternalStore.
 */
export class BayiQStore {
  private state: BayiQState;
  private listeners = new Set<() => void>();

  private constructor(state: BayiQState) {
    this.state = state;
  }

  static async create(): Promise<BayiQStore> {
    return new BayiQStore(await loadState());
  }

  getSnapshot(): BayiQState {
    return this.state;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private async commit(next: BayiQState): Promise<void> {
    await saveState(next);
    this.state = next;
    for (const fn of this.listeners) fn();
  }

  async upsertChild(input: ChildInput): Promise<ChildRow> {
    const row: ChildRow = {
      childId: crypto.randomUUID(),
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      updatedAt: stampNow(this.state.clockFloor),
    };
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: mergeChildren(this.state.children, [row]),
      records: this.state.records,
      clockFloor: this.state.clockFloor,
    };
    await this.commit(next);
    return row;
  }

  async updateChild(childId: string, input: ChildInput): Promise<ChildRow> {
    const existing = this.state.children.find((c) => c.childId === childId);
    if (!existing) throw new Error("child_not_found");
    const row: ChildRow = {
      ...existing,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      updatedAt: stampNow(this.state.clockFloor),
    };
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: mergeChildren(this.state.children, [row]),
      records: this.state.records,
      clockFloor: this.state.clockFloor,
    };
    await this.commit(next);
    return row;
  }

  /** Cascade delete (ADR-007): tombstone the child and all its records. */
  async deleteChild(childId: string): Promise<void> {
    const now = stampNow(this.state.clockFloor);
    const childTombstone = toChildTombstone(childId, now);
    const recordTombstones = this.state.records
      .filter((r) => r.childId === childId)
      .map((r) => toRecordTombstone(r.recordId, childId, now));
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: mergeChildren(this.state.children, [childTombstone]),
      records: mergeRecords(this.state.records, recordTombstones),
      clockFloor: this.state.clockFloor,
    };
    await this.commit(next);
  }

  /**
   * Upsert by (childId, doseId) (ADR-007): one record per dose. Saving a
   * dose that already has a record edits it in place.
   */
  async upsertRecord(input: RecordInput): Promise<RecordRow> {
    const existing = this.state.records.find(
      (r) => r.childId === input.childId && r.doseId === input.doseId,
    );
    const row: RecordRow = {
      recordId: existing?.recordId ?? crypto.randomUUID(),
      childId: input.childId,
      doseId: input.doseId,
      givenDate: input.givenDate,
      brand: input.brand,
      note: input.note,
      updatedAt: stampNow(this.state.clockFloor),
    };
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: this.state.children,
      records: mergeRecords(this.state.records, [row]),
      clockFloor: this.state.clockFloor,
    };
    await this.commit(next);
    return row;
  }

  async deleteRecord(recordId: string): Promise<void> {
    const existing = this.state.records.find((r) => r.recordId === recordId);
    if (!existing) return;
    const tombstone = toRecordTombstone(
      recordId,
      existing.childId,
      stampNow(this.state.clockFloor),
    );
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: this.state.children,
      records: mergeRecords(this.state.records, [tombstone]),
      clockFloor: this.state.clockFloor,
    };
    await this.commit(next);
  }

  /**
   * Merge a server response into local state: LWW-merge both arrays, raise
   * the clock floor, and GC tombstones (safe — the server acknowledged them).
   */
  mergeRemote(remote: BayiQState): void {
    const next: BayiQState = {
      schemaVersion: SCHEMA_VERSION,
      children: gcTombstones(
        mergeChildren(this.state.children, remote.children),
      ),
      records: gcTombstones(mergeRecords(this.state.records, remote.records)),
      clockFloor: raiseClockFloor(
        this.state.clockFloor,
        remote.clockFloor ?? Date.now(),
      ),
    };
    void this.commit(next);
  }
}

export function useStore(store: BayiQStore): BayiQState {
  return useSyncExternalStore(
    (fn) => store.subscribe(fn),
    () => store.getSnapshot(),
  );
}

export const StoreCtx = createContext<BayiQStore | null>(null);

export function useStoreCtx(): BayiQStore {
  const store = useContext(StoreCtx);
  if (!store) throw new Error("store_missing");
  return store;
}

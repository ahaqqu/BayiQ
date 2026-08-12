import { createD1DatabaseStore, type DatabaseStore } from "@app/infra";
import type { WorkerBindings } from "../env";

/** Thrown when the D1 binding is absent; `onError` maps it to a 503. */
export class DbUnboundError extends Error {
  constructor() {
    super("db_unbound");
    this.name = "DbUnboundError";
  }
}

/** Thrown when CAS retry exhaustion occurs during sync; `onError` maps it to a 409. */
export class SyncConflictError extends Error {
  constructor() {
    super("sync_conflict");
    this.name = "SyncConflictError";
  }
}

export function requireDb(env: WorkerBindings): DatabaseStore {
  if (!env.DB) {
    throw new DbUnboundError();
  }
  return createD1DatabaseStore(env.DB);
}
import { SyncResponseSchema } from "@app/contracts";
import {
  CLIENT_VERSION,
  SCHEMA_VERSION,
  raiseClockFloor,
  type BayiQState,
} from "@app/local-first";
import * as v from "valibot";
import { apiFetch } from "./api";
import { clearSession, ensureSession } from "./session";

/**
 * Push/pull one CRDT envelope (ADR-003): send the local state, receive the
 * merged snapshot plus `serverNow`, and raise the clock floor. A 401 clears
 * the expired session and re-mints one (ADR-006), then retries once — the
 * local store re-pushes everything under the fresh session.
 */
export async function pushPull(
  state: BayiQState,
  token: string,
): Promise<BayiQState> {
  const res = await apiFetch("/sync", {
    method: "POST",
    token,
    body: JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      clientVersion: CLIENT_VERSION,
      children: state.children,
      records: state.records,
    }),
  });
  if (res.status === 401) {
    clearSession();
    const fresh = await ensureSession();
    return pushPull(state, fresh.token);
  }
  if (res.status === 409) {
    const err = new Error("schema_mismatch") as Error & { code?: string };
    err.code = "schema_mismatch";
    throw err;
  }
  if (!res.ok) throw new Error(`sync_${res.status}`);
  const body = v.parse(SyncResponseSchema, await res.json());
  return {
    schemaVersion: SCHEMA_VERSION,
    children: body.children,
    records: body.records,
    clockFloor: raiseClockFloor(state.clockFloor, body.serverNow),
  };
}

import { startSyncLoop, type SyncStatus } from "@app/local-first/client";
import { useEffect, useState } from "react";
import { loadSession } from "../lib/session";
import type { BayiQStore } from "../lib/store";
import { pushPull } from "../lib/sync";

/**
 * Wires the local-first sync loop (ADR-003) to the API: one elected leader
 * per browser pushes/pulls the CRDT envelope; peers update via
 * BroadcastChannel.
 */
export function useSync(store: BayiQStore): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    const stop = startSyncLoop(
      {
        loadState: () => Promise.resolve(store.getSnapshot()),
        loadSession: () => {
          const s = loadSession();
          return s ? { token: s.token } : null;
        },
        pushPull: (state, token) => pushPull(state, token),
      },
      (state) => store.mergeRemote(state),
      setStatus,
    );
    return stop;
  }, [store]);

  return status;
}

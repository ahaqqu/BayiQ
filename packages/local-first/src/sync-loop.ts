import { createLeaderElection } from "./leader";
import type { BayiQState } from "./merge";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

/** Store/session seams injected by the app so the loop stays app-agnostic. */
export type SyncLoopDeps = {
  loadState: () => Promise<BayiQState>;
  pushPull: (state: BayiQState, token: string) => Promise<BayiQState>;
  loadSession: () => { token: string } | null;
};

export function startSyncLoop(
  deps: SyncLoopDeps,
  onState: (s: BayiQState) => void,
  onStatus: (s: SyncStatus) => void,
): () => void {
  const leader = createLeaderElection();
  let stopped = false;
  let attempt = 0;
  let inFlight = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const run = async () => {
    if (stopped || inFlight || !leader.isLeader()) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      onStatus("offline");
      return;
    }
    const session = deps.loadSession();
    if (!session) return;
    inFlight = true;
    onStatus("syncing");
    try {
      const state = await deps.loadState();
      const next = await deps.pushPull(state, session.token);
      onState(next);
      leader.broadcast({ type: "state", state: next });
      onStatus("synced");
      attempt = 0;
    } catch (err) {
      // Permanent errors (e.g. schema mismatch) must not retry forever.
      if ((err as { code?: string }).code === "schema_mismatch") {
        onStatus("error");
        return;
      }
      attempt += 1;
      onStatus("error");
      const delay = Math.min(30_000, 500 * 2 ** attempt);
      retryTimer = setTimeout(() => void run(), delay);
    } finally {
      inFlight = false;
    }
  };

  const unsub = leader.onPeerMessage((data) => {
    const msg = data as { type?: string; state?: BayiQState };
    if (msg.type === "state" && msg.state) onState(msg.state);
  });

  const onOnline = () => void run();
  const onFocus = () => void run();
  window.addEventListener("online", onOnline);
  window.addEventListener("focus", onFocus);
  void run();
  const interval = setInterval(() => void run(), 60_000);

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    unsub();
    leader.destroy();
    window.removeEventListener("online", onOnline);
    window.removeEventListener("focus", onFocus);
    clearInterval(interval);
  };
}

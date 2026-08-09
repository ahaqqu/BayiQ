import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BayiQState } from "./merge";
import { startSyncLoop, type SyncLoopDeps, type SyncStatus } from "./sync-loop";

const stateA: BayiQState = {
  schemaVersion: 3,
  children: [{ childId: "a", name: "Aisha", dateOfBirth: "2026-03-09", updatedAt: 1 }],
  records: [],
};
const stateB: BayiQState = { schemaVersion: 3, children: [], records: [], clockFloor: 42 };

function makeDeps(overrides: Partial<SyncLoopDeps> = {}): SyncLoopDeps {
  return {
    loadState: vi.fn().mockResolvedValue(stateA),
    pushPull: vi.fn().mockResolvedValue(stateB),
    loadSession: vi.fn().mockReturnValue({ token: "tok" }),
    ...overrides,
  };
}

describe("startSyncLoop", () => {
  let stops: Array<() => void> = [];
  const start = (
    deps: SyncLoopDeps,
    onState: (s: BayiQState) => void,
    onStatus: (s: SyncStatus) => void,
  ) => {
    const stop = startSyncLoop(deps, onState, onStatus);
    stops.push(stop);
    return stop;
  };

  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true, locks: undefined });
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("BroadcastChannel", undefined);
  });

  afterEach(() => {
    for (const stop of stops) stop();
    stops = [];
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("pushes and pulls, then reports synced with the merged state", async () => {
    const deps = makeDeps();
    const onState = vi.fn();
    const onStatus = vi.fn();
    start(deps, onState, onStatus);

    await vi.waitFor(() => expect(onStatus).toHaveBeenCalledWith("synced"));
    expect(deps.pushPull).toHaveBeenCalledWith(stateA, "tok");
    expect(onState).toHaveBeenCalledWith(stateB);
  });

  it("reports offline without network and skips the push", async () => {
    vi.stubGlobal("navigator", { onLine: false, locks: undefined });
    const deps = makeDeps();
    const onStatus = vi.fn();
    start(deps, vi.fn(), onStatus);

    await vi.waitFor(() => expect(onStatus).toHaveBeenCalledWith("offline"));
    expect(deps.pushPull).not.toHaveBeenCalled();
  });

  it("does nothing without a session", async () => {
    const deps = makeDeps({ loadSession: vi.fn().mockReturnValue(null) });
    const onStatus = vi.fn();
    start(deps, vi.fn(), onStatus);

    await new Promise((r) => setTimeout(r, 20));
    expect(deps.pushPull).not.toHaveBeenCalled();
    expect(onStatus).not.toHaveBeenCalled();
  });

  it("retries with backoff after a failure", async () => {
    vi.useFakeTimers();
    const pushPull = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(stateB);
    const deps = makeDeps({ pushPull });
    const onStatus = vi.fn();
    start(deps, vi.fn(), onStatus);

    await vi.waitFor(() => expect(onStatus).toHaveBeenCalledWith("error"));
    await vi.advanceTimersByTimeAsync(1_000);
    await vi.waitFor(() => expect(onStatus).toHaveBeenCalledWith("synced"));
    expect(pushPull).toHaveBeenCalledTimes(2);
  });
});

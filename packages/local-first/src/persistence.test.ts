import { afterEach, describe, expect, it, vi } from "vitest";
import { requestPersistentStorage } from "./persistence";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestPersistentStorage", () => {
  it("requests persistence when the API exists", async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("navigator", { storage: { persist } });
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("returns false without the Storage API", async () => {
    vi.stubGlobal("navigator", { storage: undefined });
    expect(await requestPersistentStorage()).toBe(false);
  });

  it("returns false when the request throws", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        persist: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    expect(await requestPersistentStorage()).toBe(false);
  });
});

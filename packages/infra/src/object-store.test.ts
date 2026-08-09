import { describe, expect, it } from "vitest";
import { createMemoryObjectStore, createR2ObjectStore } from "./object-store";

describe("MemoryObjectStore", () => {
  it("put get delete list", async () => {
    const s = createMemoryObjectStore();
    await s.put("a/b", "hello");
    expect(new TextDecoder().decode((await s.get("a/b"))!)).toBe("hello");
    expect(await s.list("a/")).toEqual(["a/b"]);
    await s.delete("a/b");
    expect(await s.get("a/b")).toBeNull();
  });
});

describe("R2ObjectStore", () => {
  const memory = new Map<string, string>();
  const bucket = {
    async put(key: string, value: string) {
      memory.set(key, value);
    },
    async get(key: string) {
      const value = memory.get(key);
      return value === undefined
        ? null
        : { arrayBuffer: async () => new TextEncoder().encode(value).buffer };
    },
    async delete(key: string) {
      memory.delete(key);
    },
    async list(opts?: { prefix?: string }) {
      const prefix = opts?.prefix ?? "";
      return {
        objects: [...memory.keys()]
          .filter((k) => k.startsWith(prefix))
          .map((key) => ({ key })),
      };
    },
  };

  it("put get delete list round-trip", async () => {
    const s = createR2ObjectStore(bucket);
    await s.put("backups/2026-08-09.json", "{}");
    expect(new TextDecoder().decode((await s.get("backups/2026-08-09.json"))!)).toBe("{}");
    expect(await s.list("backups/")).toEqual(["backups/2026-08-09.json"]);
    await s.delete("backups/2026-08-09.json");
    expect(await s.get("backups/2026-08-09.json")).toBeNull();
  });

  it("returns null for a missing key", async () => {
    const s = createR2ObjectStore(bucket);
    expect(await s.get("nope")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  createD1DatabaseStore,
  createMemoryDatabaseStore,
  type D1Like,
} from "./database-store";

describe("createD1DatabaseStore", () => {
  it("delegates prepare/bind/run/first/all to the underlying D1", async () => {
    const fakeD1: D1Like = {
      prepare(sql: string) {
        const binds: unknown[] = [];
        const stmt = {
          bind(...args: unknown[]) {
            binds.push(...args);
            return stmt;
          },
          async run() {
            return { success: true };
          },
          async first<T>() {
            return { sql, binds } as T | null;
          },
          async all<T>() {
            return { results: [{ sql, binds }] as T[] };
          },
        };
        return stmt;
      },
    };
    const store = createD1DatabaseStore(fakeD1);
    const stmt = store.prepare("SELECT 1").bind("a", 1);
    expect(await stmt.first()).toEqual({ sql: "SELECT 1", binds: ["a", 1] });
    expect(await stmt.all()).toEqual({
      results: [{ sql: "SELECT 1", binds: ["a", 1] }],
    });
  });
});

describe("createMemoryDatabaseStore", () => {
  it("dispatches to registered handlers", async () => {
    const store = createMemoryDatabaseStore({
      "SELECT ? as v": {
        first: (b) => ({ v: b[0] }),
      },
    });
    const row = await store.prepare("SELECT ? as v").bind(42).first<{ v: unknown }>();
    expect(row).toEqual({ v: 42 });
  });

  it("throws on unknown statement", async () => {
    const store = createMemoryDatabaseStore();
    await expect(store.prepare("SELECT 1").first()).rejects.toThrow();
  });

  it("normalizes whitespace in SQL matching", async () => {
    const store = createMemoryDatabaseStore({
      "SELECT 1": {
        first: () => 1,
      },
    });
    expect(await store.prepare("  SELECT   1  ").first()).toBe(1);
  });

  it("run returns success meta", async () => {
    const store = createMemoryDatabaseStore({
      "INSERT INTO t VALUES (?)": {
        run: () => undefined,
      },
    });
    const result = await store.prepare("INSERT INTO t VALUES (?)").bind(1).run();
    expect(result).toEqual({ success: true });
  });

  it("all returns results array", async () => {
    const store = createMemoryDatabaseStore({
      "SELECT id FROM t": {
        all: () => [{ id: 1 }, { id: 2 }],
      },
    });
    const result = await store.prepare("SELECT id FROM t").all<{ id: number }>();
    expect(result.results).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
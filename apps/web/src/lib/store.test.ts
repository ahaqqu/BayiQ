import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCHEMA_VERSION } from "@app/local-first";
import { BayiQStore } from "./store";
import { stubIndexedDB } from "../test-utils";

const aliveChildren = (store: BayiQStore) =>
  store.getSnapshot().children.filter((c) => !c.deleted);
const aliveRecords = (store: BayiQStore) =>
  store.getSnapshot().records.filter((r) => !r.deleted);

beforeEach(() => {
  stubIndexedDB();
});

describe("BayiQStore", () => {
  it("starts empty at the current schema version", async () => {
    const store = await BayiQStore.create();
    expect(store.getSnapshot().schemaVersion).toBe(SCHEMA_VERSION);
    expect(aliveChildren(store)).toEqual([]);
    expect(aliveRecords(store)).toEqual([]);
  });

  it("upserts a child and persists it", async () => {
    const store = await BayiQStore.create();
    const row = await store.upsertChild({
      name: "Aisha",
      dateOfBirth: "2026-03-09",
      sex: "female",
    });
    expect(aliveChildren(store)).toHaveLength(1);
    expect(aliveChildren(store)[0]?.name).toBe("Aisha");

    const reloaded = await BayiQStore.create();
    expect(aliveChildren(reloaded)[0]?.childId).toBe(row.childId);
  });

  it("updates a child in place", async () => {
    vi.useFakeTimers();
    try {
      const store = await BayiQStore.create();
      const row = await store.upsertChild({
        name: "Aisha",
        dateOfBirth: "2026-03-09",
      });
      vi.advanceTimersByTime(1);
      await store.updateChild(row.childId, {
        name: "Aisha Updated",
        dateOfBirth: "2026-03-09",
      });
      expect(aliveChildren(store)[0]?.name).toBe("Aisha Updated");
      expect(aliveChildren(store)).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("upserts one record per (childId, doseId)", async () => {
    const store = await BayiQStore.create();
    const childRow = await store.upsertChild({
      name: "Aisha",
      dateOfBirth: "2026-03-09",
    });
    const first = await store.upsertRecord({
      childId: childRow.childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-01",
      brand: "Engerix-B",
    });
    const second = await store.upsertRecord({
      childId: childRow.childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-09",
      brand: "Engerix-B",
    });
    expect(second.recordId).toBe(first.recordId);
    expect(aliveRecords(store)).toHaveLength(1);
    expect(aliveRecords(store)[0]?.givenDate).toBe("2026-08-09");
  });

  it("deletes a record via tombstone", async () => {
    const store = await BayiQStore.create();
    const childRow = await store.upsertChild({
      name: "Aisha",
      dateOfBirth: "2026-03-09",
    });
    const rec = await store.upsertRecord({
      childId: childRow.childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-09",
    });
    await store.deleteRecord(rec.recordId);
    expect(aliveRecords(store)).toEqual([]);
    expect(store.getSnapshot().records[0]?.deleted).toBe(true);
  });

  it("cascade-deletes a child and all its records", async () => {
    const store = await BayiQStore.create();
    const childRow = await store.upsertChild({
      name: "Aisha",
      dateOfBirth: "2026-03-09",
    });
    await store.upsertRecord({
      childId: childRow.childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-09",
    });
    await store.upsertRecord({
      childId: childRow.childId,
      doseId: "bcg-1mo",
      givenDate: "2026-08-09",
    });
    await store.deleteChild(childRow.childId);
    expect(aliveChildren(store)).toEqual([]);
    expect(aliveRecords(store)).toEqual([]);
    expect(store.getSnapshot().children[0]?.deleted).toBe(true);
    expect(store.getSnapshot().records).toHaveLength(2);
  });

  it("mergeRemote merges server rows and raises the clock floor", async () => {
    const store = await BayiQStore.create();
    const local = await store.upsertChild({
      name: "Aisha",
      dateOfBirth: "2026-03-09",
    });
    store.mergeRemote({
      schemaVersion: SCHEMA_VERSION,
      children: [
        {
          childId: local.childId,
          name: "Aisha (server)",
          dateOfBirth: "2026-03-09",
          updatedAt: local.updatedAt + 10,
        },
      ],
      records: [],
      clockFloor: 1_000_000,
    });
    await vi.waitFor(() =>
      expect(aliveChildren(store)[0]?.name).toBe("Aisha (server)"),
    );
    expect(store.getSnapshot().clockFloor).toBeGreaterThanOrEqual(1_000_000);
  });

  it("notifies subscribers on writes", async () => {
    const store = await BayiQStore.create();
    let notified = 0;
    const unsub = store.subscribe(() => {
      notified += 1;
    });
    await store.upsertChild({ name: "Aisha", dateOfBirth: "2026-03-09" });
    expect(notified).toBe(1);
    unsub();
  });
});

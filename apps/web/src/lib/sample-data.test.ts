import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSampleData } from "./sample-data";
import { BayiQStore } from "./store";
import { stubIndexedDB } from "../test-utils";

const aliveChildren = (store: BayiQStore) =>
  store.getSnapshot().children.filter((c) => !c.deleted);
const aliveRecords = (store: BayiQStore) =>
  store.getSnapshot().records.filter((r) => !r.deleted);

beforeEach(() => {
  stubIndexedDB();
});

describe("loadSampleData", () => {
  it("creates a 5-month-old child with 12 pre-filled records", async () => {
    const store = await BayiQStore.create();
    const childId = await loadSampleData(store);
    const children = aliveChildren(store);
    const records = aliveRecords(store);
    expect(children).toHaveLength(1);
    expect(children[0]?.childId).toBe(childId);
    expect(children[0]?.name).toBe("Aisha");
    expect(children[0]?.sex).toBe("female");
    expect(records).toHaveLength(12);
    expect(records.every((r) => r.childId === childId)).toBe(true);
    expect(records.some((r) => r.doseId === "hepb-birth")).toBe(true);
    expect(records.some((r) => r.doseId === "rotavirus-3mo")).toBe(true);
  });

  it("is idempotent per call (each call adds one child)", async () => {
    const store = await BayiQStore.create();
    await loadSampleData(store);
    await loadSampleData(store);
    expect(aliveChildren(store)).toHaveLength(2);
    expect(aliveRecords(store)).toHaveLength(24);
  });
});

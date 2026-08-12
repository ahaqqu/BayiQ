import { describe, expect, it } from "vitest";
import { syncSnapshot } from "./sync-repo";
import { createTestDatabase } from "./memory-d1";

type ChildOver = Partial<{
  childId: string;
  name: string;
  dateOfBirth: string;
  sex?: "male" | "female" | undefined;
  updatedAt: number;
  deleted: boolean;
}>;

type RecordOver = Partial<{
  recordId: string;
  childId: string;
  doseId: string;
  givenDate: string;
  brand?: string | undefined;
  note?: string | undefined;
  updatedAt: number;
  deleted: boolean;
}>;

const child = (over: ChildOver = {}) => ({
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  name: "Aisha",
  dateOfBirth: "2026-03-09",
  sex: "female" as const,
  updatedAt: 100,
  deleted: false,
  ...over,
});

const record = (over: RecordOver = {}) => ({
  recordId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  doseId: "hepb-birth",
  givenDate: "2026-08-09",
  brand: "Engerix-B",
  note: "",
  updatedAt: 100,
  deleted: false,
  ...over,
});

describe("syncSnapshot", () => {
  it("persists and returns the first push", async () => {
    const db = createTestDatabase();
    const out = await syncSnapshot(db, "s1", {
      children: [child()],
      records: [record()],
    });
    expect(out.children).toHaveLength(1);
    expect(out.records).toHaveLength(1);
  });

  it("merges a second push with the stored snapshot (LWW)", async () => {
    const db = createTestDatabase();
    await syncSnapshot(db, "s1", {
      children: [child({ name: "Aisha" })],
      records: [record()],
    });
    const out = await syncSnapshot(db, "s1", {
      children: [child({ name: "Aisha Updated", updatedAt: 200 })],
      records: [],
    });
    expect(out.children[0]?.name).toBe("Aisha Updated");
  });

  it("delete wins over a stored alive row", async () => {
    const db = createTestDatabase();
    await syncSnapshot(db, "s1", {
      children: [child()],
      records: [record()],
    });
    const out = await syncSnapshot(db, "s1", {
      children: [child({ name: "", dateOfBirth: "", updatedAt: 300, deleted: true })],
      records: [record({ doseId: "", givenDate: "", updatedAt: 300, deleted: true })],
    });
    expect(out.children).toEqual([]);
    expect(out.records).toEqual([]);
  });

  it("keeps snapshots isolated per session", async () => {
    const db = createTestDatabase();
    await syncSnapshot(db, "s1", { children: [child()], records: [] });
    const out = await syncSnapshot(db, "s2", { children: [], records: [] });
    expect(out.children).toEqual([]);
  });

  it("returns alive rows only, even when tombstones are stored", async () => {
    const db = createTestDatabase();
    await syncSnapshot(db, "s1", {
      children: [child(), child({ childId: "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f", name: "Budi", updatedAt: 50 })],
      records: [],
    });
    const out = await syncSnapshot(db, "s1", {
      children: [child({ childId: "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f", name: "", dateOfBirth: "", updatedAt: 400, deleted: true })],
      records: [],
    });
    expect(out.children.map((c) => c.childId)).toEqual([
      "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
    ]);
  });
});

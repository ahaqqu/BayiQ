import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { SyncRequestSchema, SyncResponseSchema } from "./sync";

const child = {
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  name: "Aisha",
  dateOfBirth: "2026-03-09",
  sex: "female",
  updatedAt: 1_752_000_000_000,
  deleted: false,
};

const record = {
  recordId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
  childId: child.childId,
  doseId: "hepb-birth",
  givenDate: "2026-08-09",
  brand: "Engerix-B",
  note: "",
  updatedAt: 1_752_000_000_000,
  deleted: false,
};

const validRequest = {
  schemaVersion: 3,
  clientVersion: "0.1.0",
  children: [child],
  records: [record],
};

describe("SyncRequestSchema", () => {
  it("accepts a valid envelope", () => {
    expect(v.parse(SyncRequestSchema, validRequest)).toEqual(validRequest);
  });

  it("accepts empty arrays", () => {
    expect(
      v.parse(SyncRequestSchema, { ...validRequest, children: [], records: [] })
        .children,
    ).toEqual([]);
  });

  it("accepts tombstone rows (deleted with stripped payload)", () => {
    const tombstone = {
      ...record,
      doseId: "",
      givenDate: "",
      brand: undefined,
      note: undefined,
      deleted: true,
    };
    const parsed = v.parse(SyncRequestSchema, {
      ...validRequest,
      records: [tombstone],
    });
    expect(parsed.records[0]?.deleted).toBe(true);
    expect(parsed.records[0]?.doseId).toBe("");
  });

  it("accepts live rows without the deleted key (store shape)", () => {
    const { deleted: _omit, ...live } = record;
    const parsed = v.parse(SyncRequestSchema, {
      ...validRequest,
      records: [live],
    });
    expect(parsed.records[0]?.deleted).toBeUndefined();
  });

  it("rejects more than 1000 records", () => {
    const many = Array.from({ length: 1001 }, (_, i) => ({
      ...record,
      recordId: `3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d${String(i).padStart(4, "0")}`,
    }));
    expect(() =>
      v.parse(SyncRequestSchema, { ...validRequest, records: many }),
    ).toThrow();
  });

  it("rejects a non-integer schemaVersion", () => {
    expect(() =>
      v.parse(SyncRequestSchema, { ...validRequest, schemaVersion: 3.5 }),
    ).toThrow();
  });

  it("rejects a missing clientVersion", () => {
    const { clientVersion: _omit, ...rest } = validRequest;
    expect(() => v.parse(SyncRequestSchema, rest)).toThrow();
  });

  it("rejects an invalid child inside the array", () => {
    expect(() =>
      v.parse(SyncRequestSchema, {
        ...validRequest,
        children: [{ ...child, childId: "not-a-uuid" }],
      }),
    ).toThrow();
  });

  it("rejects an invalid record inside the array", () => {
    expect(() =>
      v.parse(SyncRequestSchema, {
        ...validRequest,
        records: [{ ...record, recordId: "not-a-uuid" }],
      }),
    ).toThrow();
  });
});

describe("SyncResponseSchema", () => {
  it("accepts a valid response", () => {
    const res = {
      schemaVersion: 3,
      serverNow: 1_752_000_000_000,
      children: [child],
      records: [record],
    };
    expect(v.parse(SyncResponseSchema, res)).toEqual(res);
  });

  it("rejects a negative serverNow", () => {
    expect(() =>
      v.parse(SyncResponseSchema, {
        schemaVersion: 3,
        serverNow: -1,
        children: [],
        records: [],
      }),
    ).toThrow();
  });
});

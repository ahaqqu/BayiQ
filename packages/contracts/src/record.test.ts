import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { RecordSchema, SyncRecordSchema } from "./record";

const valid = {
  recordId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  childId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
  doseId: "hepb-birth",
  givenDate: "2026-08-09",
  brand: "Engerix-B",
  note: "Given at community clinic",
  updatedAt: 1_752_000_000_000,
  deleted: false,
};

describe("RecordSchema", () => {
  it("accepts a valid record", () => {
    expect(v.parse(RecordSchema, valid)).toEqual(valid);
  });

  it("accepts a record without brand or note", () => {
    const { brand: _omit, note: _omit2, ...rest } = valid;
    expect(v.parse(RecordSchema, rest)).toEqual(rest);
  });

  it("accepts an unknown doseId (records survive schedule changes)", () => {
    expect(
      v.parse(RecordSchema, { ...valid, doseId: "future-vaccine-99mo" })
        .doseId,
    ).toBe("future-vaccine-99mo");
  });

  it("rejects an empty doseId", () => {
    expect(() => v.parse(RecordSchema, { ...valid, doseId: "" })).toThrow();
  });

  it("rejects a non-ISO givenDate", () => {
    expect(() =>
      v.parse(RecordSchema, { ...valid, givenDate: "yesterday" }),
    ).toThrow();
  });

  it("rejects a brand over 100 chars", () => {
    expect(() =>
      v.parse(RecordSchema, { ...valid, brand: "x".repeat(101) }),
    ).toThrow();
  });

  it("rejects a note over 1000 chars", () => {
    expect(() =>
      v.parse(RecordSchema, { ...valid, note: "x".repeat(1001) }),
    ).toThrow();
  });

  it("rejects a non-uuid childId", () => {
    expect(() =>
      v.parse(RecordSchema, { ...valid, childId: "nope" }),
    ).toThrow();
  });
});

describe("SyncRecordSchema", () => {
  it("accepts a tombstone with empty doseId and givenDate", () => {
    const tombstone = {
      ...valid,
      doseId: "",
      givenDate: "",
      deleted: true,
    };
    expect(v.parse(SyncRecordSchema, tombstone)).toEqual(tombstone);
  });

  it("rejects a live row with empty doseId", () => {
    expect(() =>
      v.parse(SyncRecordSchema, { ...valid, doseId: "" }),
    ).toThrow();
  });

  it("rejects a live row with non-ISO givenDate", () => {
    expect(() =>
      v.parse(SyncRecordSchema, { ...valid, givenDate: "yesterday" }),
    ).toThrow();
  });

  it("accepts a live row without the deleted key", () => {
    const { deleted: _omit, ...live } = valid;
    expect(v.parse(SyncRecordSchema, live)).toEqual(live);
  });
});

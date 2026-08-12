import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { ChildSchema } from "./child";

const valid = {
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  name: "Aisha",
  dateOfBirth: "2026-03-09",
  sex: "female",
  updatedAt: 1_752_000_000_000,
  deleted: false,
};

describe("ChildSchema", () => {
  it("accepts a valid child with sex", () => {
    expect(v.parse(ChildSchema, valid)).toEqual(valid);
  });

  it("accepts a child without sex", () => {
    const { sex: _omit, ...rest } = valid;
    expect(v.parse(ChildSchema, rest)).toEqual(rest);
  });

  it("rejects an empty name", () => {
    expect(() => v.parse(ChildSchema, { ...valid, name: "" })).toThrow();
  });

  it("rejects a name over 100 chars", () => {
    expect(() =>
      v.parse(ChildSchema, { ...valid, name: "x".repeat(101) }),
    ).toThrow();
  });

  it("rejects a non-ISO date of birth", () => {
    expect(() =>
      v.parse(ChildSchema, { ...valid, dateOfBirth: "09/03/2026" }),
    ).toThrow();
  });

  it("rejects an invalid sex value", () => {
    expect(() => v.parse(ChildSchema, { ...valid, sex: "other" })).toThrow();
  });

  it("rejects a negative updatedAt", () => {
    expect(() =>
      v.parse(ChildSchema, { ...valid, updatedAt: -1 }),
    ).toThrow();
  });

  it("rejects a non-boolean deleted", () => {
    expect(() => v.parse(ChildSchema, { ...valid, deleted: 1 })).toThrow();
  });
});

import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { SessionResponseSchema } from "./session";

const valid = {
  sessionId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  token: "a".repeat(64),
  expiresAt: 1_752_000_000_000,
};

describe("SessionResponseSchema", () => {
  it("accepts a valid session response", () => {
    expect(v.parse(SessionResponseSchema, valid)).toEqual(valid);
  });

  it("rejects a non-uuid sessionId", () => {
    expect(() =>
      v.parse(SessionResponseSchema, { ...valid, sessionId: "not-a-uuid" }),
    ).toThrow();
  });

  it("rejects a short token", () => {
    expect(() =>
      v.parse(SessionResponseSchema, { ...valid, token: "short" }),
    ).toThrow();
  });

  it("rejects a non-integer expiresAt", () => {
    expect(() =>
      v.parse(SessionResponseSchema, { ...valid, expiresAt: 1.5 }),
    ).toThrow();
  });

  it("rejects a missing field", () => {
    const { sessionId: _omit, ...rest } = valid;
    expect(() => v.parse(SessionResponseSchema, rest)).toThrow();
  });
});

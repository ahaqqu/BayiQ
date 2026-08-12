import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "@app/infra";
import { allowRequest } from "./rate-limit-mw";

describe("allowRequest", () => {
  it("allows requests under the limit", async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < 3; i++) {
      expect(await allowRequest("k", limiter, 3, 60_000)).toBe(true);
    }
  });

  it("blocks requests over the limit", async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < 3; i++) await allowRequest("k", limiter, 3, 60_000);
    expect(await allowRequest("k", limiter, 3, 60_000)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const limiter = createMemoryRateLimiter();
    await allowRequest("a", limiter, 1, 60_000);
    expect(await allowRequest("b", limiter, 1, 60_000)).toBe(true);
  });
});

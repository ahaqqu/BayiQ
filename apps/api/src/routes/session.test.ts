import { describe, expect, it } from "vitest";
import { createApi } from "../app";
import { createMemoryD1 } from "../lib/memory-d1";

const env = { DB: createMemoryD1(), ASSETS: { fetch } };

describe("POST /v1/session", () => {
  it("creates an anonymous session", async () => {
    const api = createApi();
    const res = await api.request("/v1/session", { method: "POST" }, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      token: string;
      expiresAt: number;
      sessionId: string;
    };
    expect(body.token.length).toBeGreaterThanOrEqual(64);
    expect(body.expiresAt).toBeGreaterThan(0);
    expect(body.sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("returns 503 when DB is unbound", async () => {
    const api = createApi();
    const res = await api.request("/v1/session", { method: "POST" }, {});
    expect(res.status).toBe(503);
  });
});

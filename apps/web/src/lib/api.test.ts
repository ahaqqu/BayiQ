import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends the /v1 base path, correlation id, and JSON headers", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/sync", { method: "POST", body: "{}" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/v1/sync");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(
      (init.headers as Record<string, string>)["X-Correlation-Id"],
    ).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("attaches the Bearer token when provided", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/session", { token: "tok-123" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer tok-123",
    );
  });

  it("omits Content-Type when there is no body", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/health");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(
      (init.headers as Record<string, string>)["Content-Type"],
    ).toBeUndefined();
  });
});

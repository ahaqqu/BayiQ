import { describe, expect, it } from "vitest";
import { createApi } from "./app";
import { createTestDatabase } from "./lib/memory-d1";

const env = { DB: createTestDatabase(), ASSETS: { fetch } };

describe("OpenAPI document", () => {
  it("is OpenAPI 3.1 and covers every /v1 route", async () => {
    const api = createApi();
    const res = await api.request("/openapi.json", {}, env);
    expect(res.status).toBe(200);
    const doc = (await res.json()) as {
      openapi: string;
      paths: Record<string, Record<string, unknown>>;
    };
    expect(doc.openapi).toBe("3.1.0");

    const registered = [
      ...new Set(
        api.routes
          .filter((r) => r.path.startsWith("/v1/") && r.method !== "ALL")
          .map((r) => `${r.method} ${r.path}`),
      ),
    ].sort();
    const documented = Object.entries(doc.paths)
      .flatMap(([path, methods]) =>
        Object.keys(methods).map(
          (m) => `${m.toUpperCase()} ${path}`,
        ),
      )
      .sort();
    expect(documented).toEqual(registered);
  });

  it("serves the docs page", async () => {
    const api = createApi();
    const res = await api.request("/docs", {}, env);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("BayiQ API");
  });
});

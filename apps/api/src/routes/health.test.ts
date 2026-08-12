import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "@app/local-first";
import { createApi } from "../app";

const env = { ASSETS: { fetch } };

describe("GET /v1/health", () => {
  it("reports ok with the schema version", async () => {
    const api = createApi();
    const res = await api.request("/v1/health", {}, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      schemaVersion: number;
      message: string;
    };
    expect(body.status).toBe("ok");
    expect(body.schemaVersion).toBe(SCHEMA_VERSION);
    expect(body.message).toBe("BayiQ");
  });
});

import { describe, expect, it } from "vitest";
import { resolveCorsOrigin } from "./cors";

const allowlist = ["http://localhost:8787", "https://bayiq.example.com"];

describe("resolveCorsOrigin", () => {
  it("defaults to the first allowlisted origin without an Origin header", () => {
    expect(resolveCorsOrigin(undefined, "http://localhost:8787/v1/health", allowlist)).toBe(
      "http://localhost:8787",
    );
  });

  it("echoes an allowlisted origin", () => {
    expect(
      resolveCorsOrigin("https://bayiq.example.com", "http://localhost:8787/v1/health", allowlist),
    ).toBe("https://bayiq.example.com");
  });

  it("echoes the worker's own origin (SPA + API same origin)", () => {
    expect(
      resolveCorsOrigin("http://localhost:8787", "http://localhost:8787/v1/health", allowlist),
    ).toBe("http://localhost:8787");
  });

  it("blocks unknown origins", () => {
    expect(
      resolveCorsOrigin("https://evil.example.com", "http://localhost:8787/v1/health", allowlist),
    ).toBe("");
  });
});

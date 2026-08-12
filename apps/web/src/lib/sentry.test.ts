import { describe, expect, it, vi } from "vitest";
import { initSentry } from "./sentry";

vi.mock("@sentry/react", () => ({ init: vi.fn() }));
import * as Sentry from "@sentry/react";

describe("initSentry", () => {
  it("is a no-op without a DSN", () => {
    expect(() => initSentry(undefined)).not.toThrow();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it("initializes with a DSN", () => {
    initSentry("https://dsn.example.com/1");
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://dsn.example.com/1" }),
    );
  });
});

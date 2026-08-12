import { describe, expect, it, vi, afterEach } from "vitest";
import { today, isoLocal } from "./date";

describe("today", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the current UTC date", () => {
    const fixed = new Date("2026-08-12T15:30:00.000Z");
    vi.useFakeTimers().setSystemTime(fixed);
    expect(today()).toBe("2026-08-12");
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe("isoLocal", () => {
  it("formats a date as YYYY-MM-DD in local timezone", () => {
    const d = new Date(2026, 2, 9, 10, 30, 0);
    expect(isoLocal(d)).toBe("2026-03-09");
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 5, 0, 0, 0);
    expect(isoLocal(d)).toBe("2026-01-05");
  });

  it("handles end of year", () => {
    const d = new Date(2026, 11, 31, 23, 59, 59);
    expect(isoLocal(d)).toBe("2026-12-31");
  });
});
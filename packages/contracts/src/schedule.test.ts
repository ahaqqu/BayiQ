import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { AGE_MONTHS, DOSE_MAP, DoseRefSchema } from "./schedule";

describe("DOSE_MAP integrity", () => {
  it("has unique, well-formed doseIds", () => {
    const ids = Object.keys(DOSE_MAP);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+-[a-z0-9]+$/);
    }
  });

  it("matches the prototype's 64 canonical doses", () => {
    expect(Object.keys(DOSE_MAP)).toHaveLength(64);
  });

  it("every dose references a known age column", () => {
    for (const ref of Object.values(DOSE_MAP)) {
      expect(AGE_MONTHS).toContain(ref.months);
    }
  });

  it("every dose passes the DoseRef schema", () => {
    for (const [id, ref] of Object.entries(DOSE_MAP)) {
      expect(v.parse(DoseRefSchema, ref).vaccineId).toBe(ref.vaccineId);
      expect(id.startsWith(`${ref.vaccineId}-`)).toBe(true);
    }
  });

  it("repeat doses are flagged and non-repeat doses are not", () => {
    for (const ref of Object.values(DOSE_MAP)) {
      const isRepeat = ref.code === "→";
      expect(ref.repeat).toBe(isRepeat);
    }
  });

  it("contains the spec's example doseIds", () => {
    expect(DOSE_MAP["hepb-birth"]).toBeDefined();
    expect(DOSE_MAP["dpt-2mo"]).toBeDefined();
    expect(DOSE_MAP["pcv-12mo"]).toBeDefined();
  });

  it("has exactly one dose per (vaccineId, months) pair", () => {
    const pairs = Object.values(DOSE_MAP).map(
      (r) => `${r.vaccineId}:${r.months}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});

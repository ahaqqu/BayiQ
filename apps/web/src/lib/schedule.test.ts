import { describe, expect, it } from "vitest";
import { SCHEDULE, AGE_COLUMNS, VACCINES, ageColumnLabel, findVaccine, findDoseById } from "./schedule";
import { DOSE_MAP } from "@app/contracts";

describe("SCHEDULE integrity", () => {
  it("has 18 vaccines and 26 age columns", () => {
    expect(VACCINES).toHaveLength(18);
    expect(AGE_COLUMNS).toHaveLength(26);
  });

  it("every vaccine doseId resolves in the canonical dose map", () => {
    for (const vaccine of SCHEDULE) {
      for (const dose of vaccine.doses) {
        expect(DOSE_MAP[dose.doseId]).toBeDefined();
        expect(dose.vaccineId).toBe(vaccine.id);
      }
    }
  });

  it("covers every dose in the canonical map exactly once", () => {
    const covered = SCHEDULE.flatMap((v) => v.doses.map((d) => d.doseId));
    expect(new Set(covered).size).toBe(covered.length);
    expect(covered).toHaveLength(Object.keys(DOSE_MAP).length);
  });

  it("doses are ordered by scheduled month within each vaccine", () => {
    for (const vaccine of SCHEDULE) {
      const months = vaccine.doses.map((d) => d.months);
      expect([...months].sort((a, b) => a - b)).toEqual(months);
    }
  });

  it("age column labels cover 0–18 years", () => {
    expect(AGE_COLUMNS[0]?.months).toBe(0);
    expect(AGE_COLUMNS[25]?.months).toBe(216);
  });

  it("ageColumnLabel formats birth, months, and years", () => {
    const msgs = { ageBirth: "Birth", ageMonth: "mo", ageYear: "yr" };
    expect(ageColumnLabel(msgs, "en", 0)).toBe("Birth");
    expect(ageColumnLabel(msgs, "en", 3)).toBe("3 mo");
    expect(ageColumnLabel(msgs, "en", 24)).toBe("2 yr");
  });
});

describe("findVaccine / findDose", () => {
  it("finds a vaccine by id", () => {
    expect(findVaccine("hepb")?.nameKey).toBe("vaccine.hepb.name");
    expect(findVaccine("nope")).toBeUndefined();
  });

  it("resolves a doseId to its vaccine and dose", () => {
    const found = findDoseById("hepb-birth");
    expect(found?.vaccine.id).toBe("hepb");
    expect(found?.dose.code).toBe("HB-0");
    expect(findDoseById("nope-99mo")).toBeUndefined();
  });
});

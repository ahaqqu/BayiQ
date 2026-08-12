import { describe, expect, it } from "vitest";
import type { ChildRow, RecordRow } from "@app/local-first";
import { SCHEDULE } from "./schedule";
import {
  ageMonths,
  computeNotifications,
  doseStatus,
  graceFor,
} from "./status";

const child = (over: Partial<ChildRow> = {}): ChildRow => ({
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  name: "Aisha",
  dateOfBirth: "2026-03-09",
  sex: "female",
  updatedAt: 1,
  ...over,
});

const record = (over: Partial<RecordRow> = {}): RecordRow => ({
  recordId: "4a3b2c1d-9e8f-4a5b-8c7d-6e5f4a3b2c1d",
  childId: "3f2f1a1e-8b4a-4c2d-9e5f-6a7b8c9d0e1f",
  doseId: "hepb-birth",
  givenDate: "2026-08-09",
  updatedAt: 1,
  ...over,
});

const hepbBirth = SCHEDULE[0]!.doses[0]!;
const bcg1mo = SCHEDULE[1]!.doses[0]!;
const dpt2mo = SCHEDULE[3]!.doses[0]!;

describe("ageMonths", () => {
  it("computes full months between birth and now", () => {
    expect(ageMonths("2026-03-09", new Date("2026-08-09"))).toBe(5);
  });

  it("subtracts a month when the day of month has not arrived", () => {
    expect(ageMonths("2026-03-20", new Date("2026-08-09"))).toBe(4);
  });

  it("never returns negative", () => {
    expect(ageMonths("2026-08-09", new Date("2026-03-09"))).toBe(0);
  });
});

describe("graceFor", () => {
  it("is 1 month under 24 months", () => {
    expect(graceFor(0)).toBe(1);
    expect(graceFor(23)).toBe(1);
  });

  it("is 3 months at or above 24 months", () => {
    expect(graceFor(24)).toBe(3);
    expect(graceFor(216)).toBe(3);
  });
});

describe("doseStatus", () => {
  const now = new Date("2026-08-09");

  it("is done when a record exists", () => {
    expect(doseStatus(child(), hepbBirth, record(), now)).toBe("done");
  });

  it("is overdue past the grace window", () => {
    expect(doseStatus(child(), bcg1mo, undefined, now)).toBe("overdue");
  });

  it("is due at or after the scheduled month within grace", () => {
    expect(doseStatus(child(), dpt2mo, undefined, now)).toBe("overdue");
    const due = child({ dateOfBirth: "2026-06-09" });
    expect(doseStatus(due, dpt2mo, undefined, now)).toBe("due");
  });

  it("is upcoming before the scheduled month", () => {
    const newborn = child({ dateOfBirth: "2026-08-01" });
    expect(doseStatus(newborn, bcg1mo, undefined, now)).toBe("upcoming");
  });
});

describe("computeNotifications", () => {
  const now = new Date("2026-08-09");

  it("counts 17 notifications for a 5-month-old with only HepB recorded", () => {
    const aisha = child();
    const items = computeNotifications(
      [aisha],
      [record()],
      now,
    );
    expect(items).toHaveLength(17);
    const kinds = items.reduce(
      (acc, i) => {
        acc[i.kind] += 1;
        return acc;
      },
      { overdue: 0, due: 0, upcoming: 0 },
    );
    expect(kinds.overdue).toBe(11);
    expect(kinds.due).toBe(4);
    expect(kinds.upcoming).toBe(2);
  });

  it("sorts by severity then scheduled age", () => {
    const items = computeNotifications([child()], [], now);
    const order = { overdue: 0, due: 1, upcoming: 2 };
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!;
      const cur = items[i]!;
      const prevRank = order[prev.kind];
      const curRank = order[cur.kind];
      expect(
        prevRank < curRank ||
          (prevRank === curRank && prev.dose.months <= cur.dose.months),
      ).toBe(true);
    }
  });

  it("excludes recorded doses", () => {
    const aisha = child();
    const items = computeNotifications(
      [aisha],
      [record({ doseId: "bcg-1mo" })],
      now,
    );
    expect(items.some((i) => i.dose.doseId === "bcg-1mo")).toBe(false);
  });

  it("aggregates across children", () => {
    const aisha = child();
    const budi = child({
      childId: "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f",
      name: "Budi",
    });
    const items = computeNotifications([aisha, budi], [], now);
    const childIds = new Set(items.map((i) => i.child.childId));
    expect(childIds.size).toBe(2);
  });
});

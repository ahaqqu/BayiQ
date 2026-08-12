import type { ChildRow, RecordRow } from "@app/local-first";
import { AGE_COLUMNS, SCHEDULE, type ScheduleDose, type ScheduleVaccine } from "./schedule";

export type DoseStatus = "done" | "overdue" | "due" | "upcoming";

/** Schedule table window (prototype UX): 11 visible age columns. */
export const WINDOW_SIZE = 11;
export const WINDOW_PREV = 3;
export const WINDOW_SHIFT = 8;

/** Window start that focuses the child's current age column. */
export function ageFocusStart(child: ChildRow): number {
  const age = ageMonths(child.dateOfBirth);
  let currentCol = 0;
  AGE_COLUMNS.forEach((c, i) => {
    if (c.months <= age) currentCol = i;
  });
  return Math.max(
    0,
    Math.min(currentCol - WINDOW_PREV, AGE_COLUMNS.length - WINDOW_SIZE),
  );
}

/** Window start that focuses a specific dose's age column. */
export function ageFocusForMonths(months: number): number {
  const colIdx = AGE_COLUMNS.findIndex((c) => c.months === months);
  return Math.max(
    0,
    Math.min(colIdx - WINDOW_PREV, AGE_COLUMNS.length - WINDOW_SIZE),
  );
}

export function ageMonths(dob: string, now = new Date()): number {
  const birth = new Date(`${dob}T00:00:00`);
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

export function graceFor(months: number): number {
  return months < 24 ? 1 : 3;
}

/** Kind of an unrecorded dose for a child of `age` months, or null. */
export function doseKind(
  age: number,
  dose: ScheduleDose,
): "overdue" | "due" | "upcoming" | null {
  if (age > dose.months + graceFor(dose.months)) return "overdue";
  if (age >= dose.months) return "due";
  if (dose.months - age <= graceFor(dose.months)) return "upcoming";
  return null;
}

export function doseStatus(
  child: ChildRow,
  dose: ScheduleDose,
  record?: RecordRow | undefined,
  now = new Date(),
): DoseStatus {
  if (record) return "done";
  return doseKind(ageMonths(child.dateOfBirth, now), dose) ?? "upcoming";
}

export type NotificationItem = {
  child: ChildRow;
  vaccine: ScheduleVaccine;
  dose: ScheduleDose;
  kind: "overdue" | "due" | "upcoming";
};

/**
 * Notifications: unrecorded doses that are overdue, due, or upcoming within
 * the grace window, across all children, ordered by severity then scheduled
 * age (prototype rules, spec §Status and notification rules).
 */
export function computeNotifications(
  children: ChildRow[],
  records: RecordRow[],
  now = new Date(),
): NotificationItem[] {
  const recordIndex = new Map<string, RecordRow>();
  for (const r of records) {
    recordIndex.set(`${r.childId}:${r.doseId}`, r);
  }
  const items: NotificationItem[] = [];
  for (const child of children) {
    const age = ageMonths(child.dateOfBirth, now);
    for (const vaccine of SCHEDULE) {
      for (const dose of vaccine.doses) {
        if (recordIndex.has(`${child.childId}:${dose.doseId}`)) continue;
        const kind = doseKind(age, dose);
        if (kind) {
          items.push({ child, vaccine, dose, kind });
        }
      }
    }
  }
  const order = { overdue: 0, due: 1, upcoming: 2 };
  items.sort(
    (a, b) => order[a.kind] - order[b.kind] || a.dose.months - b.dose.months,
  );
  return items;
}

import { test, fc } from "@fast-check/vitest";
import { expect } from "vitest";
import {
  aliveChildren,
  aliveRecords,
  mergeChildren,
  mergeRecords,
  type ChildRow,
  type RecordRow,
} from "./merge";

/**
 * Small id and updatedAt pools force same-id collisions and exact-timestamp
 * ties — the cases where LWW merge law violations hide.
 */
const childArb: fc.Arbitrary<ChildRow> = fc.record({
  childId: fc.constantFrom("a", "b", "c", "d"),
  name: fc.string({ minLength: 1, maxLength: 8 }),
  dateOfBirth: fc.constantFrom("2020-01-01", "2021-06-15", "2026-03-09"),
  sex: fc.option(fc.constantFrom("male", "female"), { nil: undefined }),
  updatedAt: fc.integer({ min: 0, max: 5 }),
  deleted: fc.option(fc.boolean(), { nil: undefined }),
});

const recordArb: fc.Arbitrary<RecordRow> = fc.record({
  recordId: fc.constantFrom("r1", "r2", "r3", "r4"),
  childId: fc.constantFrom("a", "b", "c", "d"),
  doseId: fc.constantFrom("hepb-birth", "dpt-2mo", "pcv-12mo"),
  givenDate: fc.constantFrom("2026-01-01", "2026-08-09"),
  brand: fc.option(fc.string({ maxLength: 8 }), { nil: undefined }),
  note: fc.option(fc.string({ maxLength: 8 }), { nil: undefined }),
  updatedAt: fc.integer({ min: 0, max: 5 }),
  deleted: fc.option(fc.boolean(), { nil: undefined }),
});

const rowsArb = fc.array(childArb, { maxLength: 12 });
const recsArb = fc.array(recordArb, { maxLength: 12 });

const byId = <T extends { childId: string }>(xs: T[]) =>
  [...xs].sort((x, y) => x.childId.localeCompare(y.childId));

const byRecordId = <T extends { recordId: string }>(xs: T[]) =>
  [...xs].sort((x, y) => x.recordId.localeCompare(y.recordId));

test.prop([rowsArb])("children merge is idempotent", (rows) => {
  const once = mergeChildren([], rows);
  expect(mergeChildren(once, rows)).toEqual(once);
});

test.prop([rowsArb, rowsArb])(
  "children merge is commutative, including exact-timestamp ties",
  (a, b) => {
    expect(byId(mergeChildren(a, b))).toEqual(byId(mergeChildren(b, a)));
  },
);

test.prop([rowsArb, rowsArb, rowsArb])(
  "children merge is associative",
  (a, b, c) => {
    const left = byId(mergeChildren(mergeChildren(a, b), c));
    const right = byId(mergeChildren(a, mergeChildren(b, c)));
    expect(left).toEqual(right);
  },
);

test.prop([rowsArb, rowsArb])("children delete wins once seen", (a, b) => {
  const merged = mergeChildren(a, b);
  for (const row of [...a, ...b]) {
    if (row.deleted === true) {
      const winner = merged.find((r) => r.childId === row.childId);
      expect(winner?.deleted).toBe(true);
    }
  }
});

test.prop([recsArb])("records merge is idempotent", (rows) => {
  const once = mergeRecords([], rows);
  expect(mergeRecords(once, rows)).toEqual(once);
});

test.prop([recsArb, recsArb])(
  "records merge is commutative, including exact-timestamp ties",
  (a, b) => {
    expect(byRecordId(mergeRecords(a, b))).toEqual(
      byRecordId(mergeRecords(b, a)),
    );
  },
);

test.prop([recsArb, recsArb, recsArb])(
  "records merge is associative",
  (a, b, c) => {
    const left = byRecordId(mergeRecords(mergeRecords(a, b), c));
    const right = byRecordId(mergeRecords(a, mergeRecords(b, c)));
    expect(left).toEqual(right);
  },
);

test.prop([recsArb, recsArb])("records delete wins once seen", (a, b) => {
  const merged = mergeRecords(a, b);
  for (const row of [...a, ...b]) {
    if (row.deleted === true) {
      const winner = merged.find((r) => r.recordId === row.recordId);
      expect(winner?.deleted).toBe(true);
    }
  }
});

test.prop([fc.uuid(), fc.string({ minLength: 1 }), fc.nat()])(
  "child delete beats concurrent update",
  (id, name, updatedAt) => {
    const update: ChildRow = {
      childId: id,
      name: `${name}-u`,
      dateOfBirth: "2020-01-01",
      updatedAt: updatedAt + 1,
    };
    const del: ChildRow = {
      childId: id,
      name,
      dateOfBirth: "2020-01-01",
      updatedAt: updatedAt + 2,
      deleted: true,
    };
    expect(
      aliveChildren(mergeChildren([update], [del])).find((r) => r.childId === id),
    ).toBeUndefined();
  },
);

const childKeyOf = (r: ChildRow): unknown[] => [r.name, r.dateOfBirth, r.sex ?? null];

function greaterKey(a: unknown[], b: unknown[]): boolean {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    return String(a[i]) > String(b[i]);
  }
  return false;
}

test.prop([childArb, childArb])(
  "same-timestamp ties break on the greater payload key",
  (x, y) => {
    const a: ChildRow = { ...x, childId: "same", updatedAt: 5 };
    const b: ChildRow = { ...y, childId: "same", updatedAt: 5 };
    const merged = mergeChildren([a], [b]);
    const expected = greaterKey(childKeyOf(a), childKeyOf(b)) ? a : b;
    expect(merged[0]?.name).toBe(expected.name);
  },
);

test.prop([childArb, childArb])(
  "tie-break is independent of object key order",
  (x, y) => {
    const base: ChildRow = { ...x, childId: "same", updatedAt: 5 };
    const reordered = {
      updatedAt: base.updatedAt,
      dateOfBirth: base.dateOfBirth,
      name: base.name,
      childId: base.childId,
      sex: base.sex,
      deleted: base.deleted,
    } as ChildRow;
    const a = mergeChildren([base], []);
    const b = mergeChildren([reordered], []);
    expect(a).toEqual(b);
  },
);

test.prop([fc.uuid(), fc.uuid(), fc.nat()])(
  "record delete beats concurrent update",
  (recordId, childId, updatedAt) => {
    const update: RecordRow = {
      recordId,
      childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-09",
      updatedAt: updatedAt + 1,
    };
    const del: RecordRow = {
      recordId,
      childId,
      doseId: "hepb-birth",
      givenDate: "2026-08-09",
      updatedAt: updatedAt + 2,
      deleted: true,
    };
    expect(
      aliveRecords(mergeRecords([update], [del])).find((r) => r.recordId === recordId),
    ).toBeUndefined();
  },
);

import { test, fc } from "@fast-check/vitest";
import { expect } from "vitest";
import { gcTombstones, TOMBSTONE_TTL_MS } from "./tombstones";
import type { ChildRow } from "./merge";

const rowArb: fc.Arbitrary<ChildRow> = fc.record({
  childId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 8 }),
  dateOfBirth: fc.constant("2020-01-01"),
  sex: fc.option(fc.constantFrom("male", "female"), { nil: undefined }),
  updatedAt: fc.integer({ min: 0, max: 1_000_000 }),
  deleted: fc.option(fc.boolean(), { nil: undefined }),
});

test.prop([fc.array(rowArb, { maxLength: 20 })])(
  "GC never touches alive rows",
  (rows) => {
    const alive = rows.filter((r) => !r.deleted);
    const kept = gcTombstones(rows, 2_000_000);
    for (const row of alive) {
      expect(kept).toContainEqual(row);
    }
  },
);

test.prop([fc.array(rowArb, { maxLength: 20 }), fc.integer({ min: 0, max: 1_000_000 })])(
  "GC drops only tombstones older than the horizon",
  (rows, now) => {
    const kept = gcTombstones(rows, now);
    for (const row of rows) {
      if (row.deleted === true && now - row.updatedAt >= TOMBSTONE_TTL_MS) {
        expect(kept.find((r) => r.childId === row.childId)).toBeUndefined();
      }
    }
  },
);

test.prop([fc.array(rowArb, { maxLength: 20 })])(
  "GC is idempotent",
  (rows) => {
    const once = gcTombstones(rows, 2_000_000);
    expect(gcTombstones(once, 2_000_000)).toEqual(once);
  },
);

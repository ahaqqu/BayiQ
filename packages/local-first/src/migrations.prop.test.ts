import { test, fc } from "@fast-check/vitest";
import { expect } from "vitest";
import { migrateToLatest, migrateV2ToV3, type NotesState } from "./migrations";
import type { BayiQState } from "./merge";

const notesStateArb: fc.Arbitrary<NotesState> = fc.record({
  schemaVersion: fc.constantFrom(1, 2),
  notes: fc.array(
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 8 }),
      body: fc.string({ maxLength: 8 }),
      updatedAt: fc.nat(),
      deleted: fc.option(fc.boolean(), { nil: undefined }),
    }),
    { maxLength: 8 },
  ),
  clockFloor: fc.option(fc.nat(), { nil: undefined }),
});

test.prop([notesStateArb])("migration to v3 is deterministic", (snap) => {
  const a = migrateToLatest(snap);
  const b = migrateToLatest(snap);
  expect(a).toEqual(b);
});

test.prop([notesStateArb])("migration to v3 is idempotent", (snap) => {
  const once = migrateToLatest(snap);
  expect(migrateToLatest(once)).toEqual(once);
});

test.prop([notesStateArb])("migration drops notes and starts empty", (snap) => {
  const out = migrateToLatest(snap);
  expect(out.schemaVersion).toBe(3);
  expect(out.children).toEqual([]);
  expect(out.records).toEqual([]);
  expect(out.clockFloor).toBe(snap.clockFloor);
});

test.prop([fc.nat()])("v3 snapshots pass through unchanged", (clockFloor) => {
  const state: BayiQState = {
    schemaVersion: 3,
    children: [],
    records: [],
    clockFloor,
  };
  expect(migrateToLatest(state)).toEqual(state);
});

test("migrateV2ToV3 preserves the clock floor", () => {
  const out = migrateV2ToV3({ schemaVersion: 2, notes: [], clockFloor: 42 });
  expect(out.clockFloor).toBe(42);
});

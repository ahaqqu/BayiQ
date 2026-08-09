import * as v from "valibot";

/**
 * A Record entity as it crosses the wire: proof that a specific Dose was
 * given to a specific Child. `doseId` references the canonical dose map
 * (ADR-002) — the server must not reject unknown `doseId`s so records
 * survive schedule changes (ADR-008). `deleted` is optional: live rows
 * travel without the key; tombstones carry `deleted: true` (ADR-007).
 */
export const RecordSchema = v.object({
  recordId: v.pipe(v.string(), v.uuid()),
  childId: v.pipe(v.string(), v.uuid()),
  doseId: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
  givenDate: v.pipe(v.string(), v.isoDate()),
  brand: v.optional(v.pipe(v.string(), v.maxLength(100))),
  note: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  deleted: v.optional(v.boolean()),
});

export type Record = v.InferOutput<typeof RecordSchema>;

/**
 * Sync request item. Unlike `RecordSchema`, doseId/givenDate may be empty:
 * deleted records sync as payload-stripped tombstones (ADR-007).
 */
export const SyncRecordSchema = v.object({
  ...RecordSchema.entries,
  doseId: v.pipe(v.string(), v.maxLength(64)),
  givenDate: v.pipe(v.string(), v.maxLength(10)),
});

export type SyncRecord = v.InferOutput<typeof SyncRecordSchema>;

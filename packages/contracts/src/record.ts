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
 * Sync request item. Tombstones (`deleted: true`) may carry
 * payload-stripped empty doseId/givenDate (ADR-007). Live rows must
 * satisfy the strict `RecordSchema` fields (non-empty doseId, ISO date).
 */
export const SyncRecordSchema = v.pipe(
  v.object({
    ...RecordSchema.entries,
    doseId: v.pipe(v.string(), v.maxLength(64)),
    givenDate: v.pipe(v.string(), v.maxLength(10)),
  }),
  v.check((input) => {
    if (input.deleted === true) return true;
    if (input.doseId.length < 1) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(input.givenDate) && !isNaN(new Date(input.givenDate).getTime());
  }, "live rows require non-empty doseId and ISO givenDate"),
);

export type SyncRecord = v.InferOutput<typeof SyncRecordSchema>;
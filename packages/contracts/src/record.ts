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
 *
 * Expressed as a `v.variant` on `deleted` rather than a `v.check` so the
 * constraint is visible to JSON Schema / OpenAPI generation: the live
 * branch carries `minLength(1)` on `doseId` and `format: date` on
 * `givenDate`, while the tombstone branch allows empty strings. A `v.check`
 * is invisible to `@valibot/to-json-schema` (no converter, silently dropped
 * under `errorMode: "ignore"`), which let Schemathesis generate live rows
 * with empty fields that the server rejected — a spec/impl mismatch.
 */
export const SyncRecordSchema = v.variant("deleted", [
  // Tombstone: deleted === true, payload stripped (empty doseId/givenDate OK)
  v.object({
    ...RecordSchema.entries,
    deleted: v.literal(true),
    doseId: v.pipe(v.string(), v.maxLength(64)),
    givenDate: v.pipe(v.string(), v.maxLength(10)),
  }),
  // Live row: deleted is false or absent, strict fields required (inherited
  // from RecordSchema.entries — minLength(1) on doseId, isoDate on givenDate)
  v.object({
    ...RecordSchema.entries,
    deleted: v.optional(v.literal(false)),
  }),
]);

export type SyncRecord = v.InferOutput<typeof SyncRecordSchema>;
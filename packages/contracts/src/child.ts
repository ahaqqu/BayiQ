import * as v from "valibot";

/**
 * A Child entity as it crosses the wire. `deleted` is optional: the local
 * store normalizes it to `true | undefined` (ADR-007), so live rows travel
 * without the key and only tombstones carry `deleted: true`.
 */
export const ChildSchema = v.object({
  childId: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  dateOfBirth: v.pipe(v.string(), v.isoDate()),
  sex: v.optional(v.union([v.literal("male"), v.literal("female")])),
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  deleted: v.optional(v.boolean()),
});

export type Child = v.InferOutput<typeof ChildSchema>;

/**
 * Sync request item. Tombstones (`deleted: true`) may carry
 * payload-stripped empty name/dateOfBirth (ADR-007). Live rows must
 * satisfy the strict `ChildSchema` fields (non-empty name, ISO date).
 *
 * Expressed as a `v.variant` on `deleted` rather than a `v.check` so the
 * constraint is visible to JSON Schema / OpenAPI generation — see the
 * note on `SyncRecordSchema` for the rationale.
 */
export const SyncChildSchema = v.variant("deleted", [
  // Tombstone: deleted === true, payload stripped (empty name/dateOfBirth OK)
  v.object({
    ...ChildSchema.entries,
    deleted: v.literal(true),
    name: v.pipe(v.string(), v.maxLength(100)),
    dateOfBirth: v.pipe(v.string(), v.maxLength(10)),
  }),
  // Live row: deleted is false or absent, strict fields required (inherited
  // from ChildSchema.entries — minLength(1) on name, isoDate on dateOfBirth)
  v.object({
    ...ChildSchema.entries,
    deleted: v.optional(v.literal(false)),
  }),
]);

export type SyncChild = v.InferOutput<typeof SyncChildSchema>;
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
 */
export const SyncChildSchema = v.pipe(
  v.object({
    ...ChildSchema.entries,
    name: v.pipe(v.string(), v.maxLength(100)),
    dateOfBirth: v.pipe(v.string(), v.maxLength(10)),
  }),
  v.check((input) => {
    if (input.deleted === true) return true;
    if (input.name.length < 1) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth) && !isNaN(new Date(input.dateOfBirth).getTime());
  }, "live rows require non-empty name and ISO dateOfBirth"),
);

export type SyncChild = v.InferOutput<typeof SyncChildSchema>;
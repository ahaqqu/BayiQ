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
 * Sync request item. Unlike `ChildSchema`, name/dateOfBirth may be empty:
 * deleted children sync as payload-stripped tombstones (ADR-007), and the
 * wire contract must accept them.
 */
export const SyncChildSchema = v.object({
  ...ChildSchema.entries,
  name: v.pipe(v.string(), v.maxLength(100)),
  dateOfBirth: v.pipe(v.string(), v.maxLength(10)),
});

export type SyncChild = v.InferOutput<typeof SyncChildSchema>;

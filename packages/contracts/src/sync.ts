import * as v from "valibot";
import { ChildSchema, SyncChildSchema } from "./child";
import { RecordSchema, SyncRecordSchema } from "./record";

/**
 * CRDT sync envelope (ADR-003, ADR-007): two independent LWW arrays —
 * children and records — plus schema/client version negotiation. The
 * request accepts payload-stripped tombstones (loose item schemas); the
 * response carries only alive rows (strict item schemas). The response
 * carries `serverNow` so the client can raise its clock floor.
 */
export const SyncRequestSchema = v.object({
  schemaVersion: v.pipe(v.number(), v.integer(), v.minValue(1)),
  clientVersion: v.pipe(v.string(), v.minLength(1)),
  children: v.pipe(v.array(SyncChildSchema), v.maxLength(100)),
  records: v.pipe(v.array(SyncRecordSchema), v.maxLength(1000)),
});

export type SyncRequest = v.InferOutput<typeof SyncRequestSchema>;

export const SyncResponseSchema = v.object({
  schemaVersion: v.pipe(v.number(), v.integer(), v.minValue(1)),
  serverNow: v.pipe(v.number(), v.integer(), v.minValue(0)),
  children: v.array(ChildSchema),
  records: v.array(RecordSchema),
});

export type SyncResponse = v.InferOutput<typeof SyncResponseSchema>;

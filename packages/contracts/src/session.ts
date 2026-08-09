import * as v from "valibot";

/**
 * Anonymous session response (ADR-001, ADR-006). `sessionId` is the account
 * id stored with local data for future account linking; `token` is the raw
 * Bearer secret returned exactly once — the server keeps only its SHA-256
 * hash.
 */
export const SessionResponseSchema = v.object({
  sessionId: v.pipe(v.string(), v.uuid()),
  token: v.pipe(v.string(), v.minLength(32)),
  expiresAt: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type SessionResponse = v.InferOutput<typeof SessionResponseSchema>;
